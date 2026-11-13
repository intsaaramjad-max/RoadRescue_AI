import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api.config';
import { assertSecureWebApi } from '../utils/secureApi';

const AuthContext = createContext({});
const LEGACY_DEMO_TOKEN = 'demo-token-123';

export const AuthProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSignup, setPendingSignup] = useState(null);
  const pendingSignupRef = useRef(null);
  const pendingBackendSessionRef = useRef(null);

  // Initialize status - load persisted session if exists
  useEffect(() => {
    const loadSession = async () => {
      try {
        const persistedToken = await AsyncStorage.getItem('roadrescue_token');
        const persistedUser = await AsyncStorage.getItem('roadrescue_user');
        
        if (persistedToken && persistedUser) {
          if (persistedToken === LEGACY_DEMO_TOKEN) {
            await AsyncStorage.removeItem('roadrescue_token');
            await AsyncStorage.removeItem('roadrescue_user');
            return;
          }

          const parsedUser = JSON.parse(persistedUser);
          setToken(persistedToken);
          setUser(parsedUser);
          setUserRole(parsedUser.role);
          
          // Background sync profile status
          try {
            const response = await fetch(`${API_URL}/auth/me`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${persistedToken}`
              }
            });
            if (response.ok) {
              const profileData = await response.json();
              setUser(profileData.user);
              setUserRole(profileData.user.role);
              await AsyncStorage.setItem('roadrescue_user', JSON.stringify(profileData.user));
            } else {
              // Token might be expired/revoked, clear session
              setUserRole(null);
              setUser(null);
              setToken(null);
              await AsyncStorage.removeItem('roadrescue_token');
              await AsyncStorage.removeItem('roadrescue_user');
            }
          } catch (profileError) {
            console.log('Background profile sync failed:', profileError);
          }
        }
      } catch (e) {
        console.log('Failed to load session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const beginSignup = (details) => {
    pendingSignupRef.current = details;
    pendingBackendSessionRef.current = null;
    setPendingSignup(details);
  };

  const clearPendingSignup = () => {
    pendingSignupRef.current = null;
    pendingBackendSessionRef.current = null;
    setPendingSignup(null);
  };

  const persistSession = async (session) => {
    setToken(session.token);
    setUserRole(session.user.role);
    setUser(session.user);
    await AsyncStorage.setItem('roadrescue_token', session.token);
    await AsyncStorage.setItem('roadrescue_user', JSON.stringify(session.user));
  };

  const completePhoneSignup = async (idToken) => {
    const signup = pendingSignupRef.current;
    if (!signup) throw new Error('Signup details expired. Return to signup and try again.');

    try {
      assertSecureWebApi();

      const response = await fetch(`${API_URL}/auth/firebase-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          fullName: signup.fullName,
          email: signup.email,
          phone: signup.phone,
          password: signup.password,
          role: signup.role,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Verified signup failed (${response.status}).`);
      if (!data.token || !data.user?.id || !data.user?.role) {
        throw new Error('The server did not return a valid authenticated session.');
      }

      if (data.user.role === 'DRIVER') {
        await persistSession({ token: data.token, user: data.user });
        clearPendingSignup();
      } else {
        pendingBackendSessionRef.current = { token: data.token, user: data.user };
      }
      return data;
    } catch (error) {
      if (typeof idToken === 'string' && (idToken.startsWith('demo-') || idToken === 'demo-firebase-id-token')) {
        console.log('Demo mode active: creating local demo session for signup.');
        const mockUser = {
          id: 'demo-user-' + Date.now(),
          fullName: signup.fullName || 'Demo User',
          email: signup.email,
          phone: signup.phone || '+923001234567',
          role: signup.role,
          verificationStatus: signup.role === 'MECHANIC' ? 'PENDING' : 'APPROVED',
        };
        const mockData = {
          token: 'demo-token-' + Date.now(),
          user: mockUser,
        };
        if (signup.role === 'DRIVER') {
          await persistSession(mockData);
          clearPendingSignup();
        } else {
          pendingBackendSessionRef.current = mockData;
        }
        return mockData;
      }
      throw error;
    }
  };

  // Login User
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      if (
        typeof data.token !== 'string' ||
        !data.token.trim() ||
        data.token === LEGACY_DEMO_TOKEN ||
        !data.user?.id ||
        !data.user?.role
      ) {
        throw new Error('The server did not return a valid authenticated session.');
      }

      setToken(data.token.trim());
      setUserRole(data.user.role);
      setUser(data.user);
      clearPendingSignup();

      // Persist to storage
      await AsyncStorage.setItem('roadrescue_token', data.token.trim());
      await AsyncStorage.setItem('roadrescue_user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (profile) => {
    if (!token) throw new Error('You must be signed in to update your profile.');

    const response = await fetch(`${API_URL}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Profile update failed (${response.status})`);
    }
    if (!data.user?.id || !data.user?.role) {
      throw new Error('The server returned an invalid profile response.');
    }

    setUser(data.user);
    await AsyncStorage.setItem('roadrescue_user', JSON.stringify(data.user));
    return data.user;
  };

  // Upload documents (Protected)
  const uploadDocs = async (cnicFront, cnicBack, workshopPics, policeCert) => {
    try {
      const uploadToken = token || pendingBackendSessionRef.current?.token;
      if (!uploadToken) throw new Error('Complete phone verification before uploading documents.');

      const response = await fetch(`${API_URL}/auth/upload-docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${uploadToken}`
        },
        body: JSON.stringify({ cnicFront, cnicBack, workshopPics, policeCert }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Documents upload failed');
      }

      // Update user details in context & storage
      const pendingSession = pendingBackendSessionRef.current;
      if (pendingSession) {
        await persistSession({ token: pendingSession.token, user: data.user });
        clearPendingSignup();
      } else {
        setUser(data.user);
        await AsyncStorage.setItem('roadrescue_user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    setUserRole(null);
    setUser(null);
    setToken(null);
    clearPendingSignup();
    try {
      await AsyncStorage.removeItem('roadrescue_token');
      await AsyncStorage.removeItem('roadrescue_user');
    } catch (e) {
      console.error('Failed to clear session during logout:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole, 
      token, 
      isLoading, 
      pendingSignup,
      beginSignup,
      clearPendingSignup,
      completePhoneSignup,
      login, 
      updateUserProfile,
      uploadDocs, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
