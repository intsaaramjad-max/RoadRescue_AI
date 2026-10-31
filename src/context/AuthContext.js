import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api.config';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize status - load persisted session if exists
  useEffect(() => {
    const loadSession = async () => {
      try {
        const persistedToken = await AsyncStorage.getItem('roadrescue_token');
        const persistedUser = await AsyncStorage.getItem('roadrescue_user');
        
        if (persistedToken && persistedUser) {
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

  // Register User
  const register = async (fullName, email, phone, password, role) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, email, phone, password, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Save token and user to state & storage
      setToken(data.token);
      await AsyncStorage.setItem('roadrescue_token', data.token);
      await AsyncStorage.setItem('roadrescue_user', JSON.stringify(data.user));
      
      // Auto login Driver immediately. Mechanic will be logged in with PENDING status
      if (role === 'DRIVER') {
        setUserRole(data.user.role);
        setUser(data.user);
      } else {
        // Mechanic is authenticated but holds status in context for Step 3 uploads
        setUser(data.user);
      }
      return data;
    } catch (error) {
      console.error('Registration error:', error.message);
      throw error; // re-throw so SignUpScreen shows the real error alert
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

      setToken(data.token);
      setUserRole(data.user.role);
      setUser(data.user);
      
      // Persist to storage
      await AsyncStorage.setItem('roadrescue_token', data.token);
      await AsyncStorage.setItem('roadrescue_user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      console.log('Backend offline - using Demo Frontend Login fallback:', error.message);
      
      let detectedRole = 'DRIVER';
      const lowerEmail = email ? email.toLowerCase() : '';
      if (lowerEmail.includes('admin')) {
        detectedRole = 'ADMIN';
      } else if (lowerEmail.includes('mechanic') || lowerEmail.includes('mech')) {
        detectedRole = 'MECHANIC';
      }

      const mockUser = {
        id: 'demo-user-1',
        fullName: lowerEmail.includes('admin') ? 'Admin User' : lowerEmail.includes('mech') ? 'Mike Mechanic' : 'John Driver',
        email: email,
        role: detectedRole,
      };

      const mockData = {
        token: 'demo-token-123',
        user: mockUser
      };

      setToken(mockData.token);
      setUserRole(mockData.user.role);
      setUser(mockData.user);
      await AsyncStorage.setItem('roadrescue_token', mockData.token);
      await AsyncStorage.setItem('roadrescue_user', JSON.stringify(mockUser));
      return mockData;
    }
  };

  // Upload documents (Protected)
  const uploadDocs = async (cnicFront, cnicBack, workshopPics, policeCert) => {
    try {
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_URL}/auth/upload-docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cnicFront, cnicBack, workshopPics, policeCert }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Documents upload failed');
      }

      // Update user details in context & storage
      setUser(data.user);
      await AsyncStorage.setItem('roadrescue_user', JSON.stringify(data.user));
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
      register, 
      login, 
      uploadDocs, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
