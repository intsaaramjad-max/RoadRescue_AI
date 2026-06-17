import React, { useState } from 'react';
import { 
  View, 
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const SignUpScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 375;
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Auth context & API states
  const { register, uploadDocs } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Local Form Inputs state bindings
  const [fullName, setFullName] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  // Mechanic Document Verification States
  const [cnicFront, setCnicFront] = useState(null);
  const [cnicBack, setCnicBack] = useState(null);
  const [workshopPics, setWorkshopPics] = useState([]);
  const [policeCert, setPoliceCert] = useState(null);
  const [uploadingField, setUploadingField] = useState(null);

  const validateStep2 = () => {
    if (!fullName.trim()) {
      showAlert('Validation Error', 'Full Name is required');
      return false;
    }
    if (!emailVal.trim()) {
      showAlert('Validation Error', 'Email Address is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal.trim())) {
      showAlert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (!phone.trim()) {
      showAlert('Validation Error', 'Phone Number is required');
      return false;
    }
    if (!password.trim()) {
      showAlert('Validation Error', 'Password is required');
      return false;
    }
    if (password.length < 6) {
      showAlert('Validation Error', 'Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      showAlert('Validation Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleStep2Submit = async () => {
    if (!validateStep2()) return;
    
    setLoading(true);
    try {
      await register(
        fullName.trim(),
        emailVal.trim(),
        phone.trim(),
        password,
        role
      );
      
      if (role === 'DRIVER') {
        navigation.navigate('OtpVerification');
      } else {
        setStep(3);
      }
    } catch (error) {
      showAlert('Registration Failed', error.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async () => {
    if (!cnicFront || !cnicBack || workshopPics.length < 5 || !policeCert) {
      showAlert('Incomplete Documents', 'Please upload CNIC Front/Back, 5 Workshop pictures, and a character certificate.');
      return;
    }
    
    setLoading(true);
    try {
      await uploadDocs(cnicFront, cnicBack, workshopPics, policeCert);
      setStep(4);
    } catch (error) {
      showAlert('Upload Failed', error.message || 'An error occurred during document upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (field) => {
    try {
      setUploadingField(field);
      const fileType = field === 'policeCert' ? '*/*' : 'image/*';
      const result = await DocumentPicker.getDocumentAsync({
        type: fileType,
        copyToCacheDirectory: true
      });
      
      setUploadingField(null);
      
      let selectedFile = null;
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        selectedFile = result.assets[0];
      } else if (result.type === 'success') {
        selectedFile = result;
      }
      
      if (!selectedFile) {
        return; // User cancelled
      }
      
      const fileName = selectedFile.name || 'document_file.jpg';
      
      if (field === 'cnicFront') {
        setCnicFront(fileName);
      } else if (field === 'cnicBack') {
        setCnicBack(fileName);
      } else if (field === 'policeCert') {
        setPoliceCert(fileName);
      } else if (field === 'workshop') {
        setWorkshopPics(prev => {
          if (prev.length < 5) {
            return [...prev, fileName];
          }
          return prev;
        });
      }
    } catch (err) {
      setUploadingField(null);
      showAlert('Error', 'Failed to pick file: ' + err.message);
    }
  };

  const handleRemove = (field, index = null) => {
    if (field === 'cnicFront') {
      setCnicFront(null);
    } else if (field === 'cnicBack') {
      setCnicBack(null);
    } else if (field === 'policeCert') {
      setPoliceCert(null);
    } else if (field === 'workshop') {
      setWorkshopPics(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Dark Blue Background Gradient */}
      <LinearGradient
        colors={['#071022', '#0d1b3e', '#162b66']}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BlurView intensity={60} tint="dark" style={styles.glassCard}>
          
          {/* Header styled like the image layout */}
          <View style={styles.header}>
            {step === 2 && (
              <TouchableOpacity onPress={() => setStep(prev => prev - 1)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={22} color="#FF7A00" />
              </TouchableOpacity>
            )}
            <Text style={styles.headerText}>
              {step === 1 ? 'Choose Account' : step === 2 ? 'Sign Up' : step === 3 ? 'Verification' : 'Status'}
            </Text>
          </View>
          
          {step === 1 ? (
            <View style={styles.roleSelectionContainer}>
              <Text style={styles.sectionTitle}>Choose your account type</Text>
              <Text style={styles.sectionSubtitle}>
                Choose your account type to get started with personalized road rescue services.
              </Text>

              <View style={[styles.cardsRow, { gap: isSmallDevice ? 6 : 10 }]}>
                {/* Driver Card */}
                <View style={[styles.cardContainer, { padding: isSmallDevice ? 8 : 12 }]}>
                  <View style={[styles.cardHeaderRow, { marginBottom: isSmallDevice ? 10 : 14 }]}>
                    <View style={[styles.cardIconCircle, { width: isSmallDevice ? 40 : 46, height: isSmallDevice ? 40 : 46, borderRadius: isSmallDevice ? 20 : 23, marginBottom: isSmallDevice ? 6 : 10 }]}>
                      <Ionicons name="car-sport" size={isSmallDevice ? 20 : 24} color="#FF7A00" />
                    </View>
                    <View style={styles.cardHeaderTextContainer}>
                      <Text style={[styles.cardRoleTitle, { fontSize: isSmallDevice ? 13 : 15 }]}>I'm a Driver</Text>
                      <Text style={[styles.cardRoleSubtitle, { fontSize: isSmallDevice ? 9.5 : 11, height: isSmallDevice ? 26 : 32 }]}>
                        Get roadside help instantly.
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={isSmallDevice ? 12 : 14} color="#FF7A00" style={styles.featureCheck} />
                      <Text style={[styles.featureText, { fontSize: isSmallDevice ? 9 : 10 }]}>Instant roadside help</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={isSmallDevice ? 12 : 14} color="#FF7A00" style={styles.featureCheck} />
                      <Text style={[styles.featureText, { fontSize: isSmallDevice ? 9 : 10 }]}>AI-powered diagnostics</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={isSmallDevice ? 12 : 14} color="#FF7A00" style={styles.featureCheck} />
                      <Text style={[styles.featureText, { fontSize: isSmallDevice ? 9 : 10 }]}>Live mechanic tracking</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={isSmallDevice ? 12 : 14} color="#FF7A00" style={styles.featureCheck} />
                      <Text style={[styles.featureText, { fontSize: isSmallDevice ? 9 : 10 }]}>Secure payments</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.roleContinueBtn, { paddingVertical: isSmallDevice ? 6 : 9, borderRadius: isSmallDevice ? 8 : 10 }]}
                    onPress={() => {
                      setRole('DRIVER');
                      setStep(2);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.roleContinueBtnText, { fontSize: isSmallDevice ? 10.5 : 12 }]}>Continue as Driver</Text>
                  </TouchableOpacity>
                </View>

                {/* Mechanic Card */}
                <View style={[styles.cardContainer, { padding: isSmallDevice ? 8 : 12 }]}>
                  <View style={[styles.cardHeaderRow, { marginBottom: isSmallDevice ? 10 : 14 }]}>
                    <View style={[styles.cardIconCircle, { width: isSmallDevice ? 40 : 46, height: isSmallDevice ? 40 : 46, borderRadius: isSmallDevice ? 20 : 23, marginBottom: isSmallDevice ? 6 : 10 }]}>
                      <Ionicons name="construct" size={isSmallDevice ? 20 : 24} color="#FF7A00" />
                    </View>
                    <View style={styles.cardHeaderTextContainer}>
                      <Text style={[styles.cardRoleTitle, { fontSize: isSmallDevice ? 13 : 15 }]}>I'm a Mechanic</Text>
                      <Text style={[styles.cardRoleSubtitle, { fontSize: isSmallDevice ? 9.5 : 11, height: isSmallDevice ? 26 : 32 }]}>
                        Provide help & earn money.
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={isSmallDevice ? 12 : 14} color="#FF7A00" style={styles.featureCheck} />
                      <Text style={[styles.featureText, { fontSize: isSmallDevice ? 9 : 10 }]}>Get nearby repair jobs</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={isSmallDevice ? 12 : 14} color="#FF7A00" style={styles.featureCheck} />
                      <Text style={[styles.featureText, { fontSize: isSmallDevice ? 9 : 10 }]}>Diagnostics dashboard</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={isSmallDevice ? 12 : 14} color="#FF7A00" style={styles.featureCheck} />
                      <Text style={[styles.featureText, { fontSize: isSmallDevice ? 9 : 10 }]}>Flexible work hours</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={isSmallDevice ? 12 : 14} color="#FF7A00" style={styles.featureCheck} />
                      <Text style={[styles.featureText, { fontSize: isSmallDevice ? 9 : 10 }]}>Direct driver chat</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.roleContinueBtn, { paddingVertical: isSmallDevice ? 6 : 9, borderRadius: isSmallDevice ? 8 : 10 }]}
                    onPress={() => {
                      setRole('MECHANIC');
                      setStep(2);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.roleContinueBtnText, { fontSize: isSmallDevice ? 10.5 : 12 }]}>Continue as Mech</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Back to Login */}
              <TouchableOpacity 
                style={styles.backToLoginBtn} 
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.backToLoginText}>Already have an account? Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : step === 2 ? (
            <View style={styles.formContainer}>
              <View style={styles.selectedRoleBadge}>
                <Ionicons 
                  name={role === 'DRIVER' ? "car-sport" : "construct"} 
                  size={18} 
                  color="#FF7A00" 
                  style={{ marginRight: 6 }} 
                />
                <Text style={styles.selectedRoleBadgeText}>
                  Signing up as {role === 'DRIVER' ? 'Driver' : 'Mechanic'}
                </Text>
              </View>

              {/* Inputs with icons on the right, like the image layout */}
              <View style={[
                styles.inputWrapper,
                focusedField === 'fullName' && styles.inputWrapperFocused
              ]}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Full Name" 
                  placeholderTextColor="#A0AEC0" 
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                />
                <Ionicons name="person" size={20} color="#FF7A00" style={styles.iconRight} />
              </View>
              
              <View style={[
                styles.inputWrapper,
                focusedField === 'email' && styles.inputWrapperFocused
              ]}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Email Address" 
                  keyboardType="email-address"
                  placeholderTextColor="#A0AEC0" 
                  value={emailVal}
                  onChangeText={setEmailVal}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
                <Ionicons name="mail" size={20} color="#FF7A00" style={styles.iconRight} />
              </View>

              <View style={[
                styles.inputWrapper,
                focusedField === 'phone' && styles.inputWrapperFocused
              ]}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Phone Number" 
                  keyboardType="phone-pad"
                  placeholderTextColor="#A0AEC0" 
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
                <Ionicons name="call" size={20} color="#FF7A00" style={styles.iconRight} />
              </View>

              <View style={[
                styles.inputWrapper,
                focusedField === 'password' && styles.inputWrapperFocused
              ]}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Password" 
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#A0AEC0" 
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#d32f2f" style={styles.icon} />
                </TouchableOpacity>
              </View>

              <View style={[
                styles.inputWrapper,
                focusedField === 'confirmPassword' && styles.inputWrapperFocused
              ]}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Confirm Password" 
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#A0AEC0" 
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#d32f2f" style={styles.icon} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Links aligned to the left, Submit aligned to the right (like the image layout) */}
              <View style={styles.bottomSection}>
                <View style={styles.linksContainer}>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkText}>Already have an account?</Text>
                    <Text style={styles.linkText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.submitBtn, loading && styles.submitDocsBtnDisabled]}
                    onPress={handleStep2Submit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>Continue</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : step === 3 ? (
            <View style={styles.verificationContainer}>
              <Text style={styles.sectionTitle}>Document Verification</Text>
              <Text style={styles.sectionSubtitle}>
                Please upload the required documents to verify your shop status and identity.
              </Text>

              {/* CNIC Upload Section */}
              <Text style={styles.uploadLabel}>CNIC Upload (Front & Back)</Text>
              <View style={styles.cnicRow}>
                <TouchableOpacity 
                  style={[styles.uploadBox, cnicFront && styles.uploadBoxCompleted]}
                  onPress={() => !cnicFront && handleUpload('cnicFront')}
                  activeOpacity={0.7}
                >
                  {uploadingField === 'cnicFront' ? (
                    <ActivityIndicator size="small" color="#FF7A00" />
                  ) : cnicFront ? (
                    <View style={styles.uploadInfo}>
                      <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                      <Text style={styles.uploadFileName} numberOfLines={1}>{cnicFront}</Text>
                      <TouchableOpacity onPress={() => handleRemove('cnicFront')} style={styles.removeBtn}>
                        <Ionicons name="close-circle" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="card-outline" size={24} color="#FF7A00" />
                      <Text style={styles.uploadBoxText}>CNIC Front</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.uploadBox, cnicBack && styles.uploadBoxCompleted]}
                  onPress={() => !cnicBack && handleUpload('cnicBack')}
                  activeOpacity={0.7}
                >
                  {uploadingField === 'cnicBack' ? (
                    <ActivityIndicator size="small" color="#FF7A00" />
                  ) : cnicBack ? (
                    <View style={styles.uploadInfo}>
                      <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                      <Text style={styles.uploadFileName} numberOfLines={1}>{cnicBack}</Text>
                      <TouchableOpacity onPress={() => handleRemove('cnicBack')} style={styles.removeBtn}>
                        <Ionicons name="close-circle" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="card-outline" size={24} color="#FF7A00" />
                      <Text style={styles.uploadBoxText}>CNIC Back</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Workshop Pictures Section */}
              <Text style={styles.uploadLabel}>Workshop Pictures (At least 5)</Text>
              <View style={styles.workshopPicsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {workshopPics.map((pic, idx) => (
                    <View key={idx} style={styles.workshopPicSlotUploaded}>
                      <Ionicons name="image" size={22} color="#FF7A00" />
                      <Text style={styles.workshopPicSlotText}>{idx + 1}/5</Text>
                      <TouchableOpacity onPress={() => handleRemove('workshop', idx)} style={styles.removePicBtn}>
                        <Ionicons name="close-circle" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {workshopPics.length < 5 && (
                    <TouchableOpacity 
                      style={[styles.workshopPicSlotAdd, uploadingField === 'workshop' && styles.workshopPicSlotLoading]}
                      onPress={() => uploadingField !== 'workshop' && handleUpload('workshop')}
                      activeOpacity={0.7}
                    >
                      {uploadingField === 'workshop' ? (
                        <ActivityIndicator size="small" color="#FF7A00" />
                      ) : (
                        <>
                          <Ionicons name="camera-outline" size={20} color="#94A3B8" />
                          <Text style={styles.addPicText}>Add Photo</Text>
                          <Text style={styles.addPicCount}>{workshopPics.length}/5</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>

              {/* Character Certificate Section */}
              <Text style={styles.uploadLabel}>Police Verified Character Certificate</Text>
              <TouchableOpacity 
                style={[styles.certificateUploadBox, policeCert && styles.certificateUploadBoxCompleted]}
                onPress={() => !policeCert && handleUpload('policeCert')}
                activeOpacity={0.7}
              >
                {uploadingField === 'policeCert' ? (
                  <ActivityIndicator size="small" color="#FF7A00" />
                ) : policeCert ? (
                  <View style={styles.uploadInfoRow}>
                    <Ionicons name="document-text" size={26} color="#10B981" />
                    <View style={styles.certMeta}>
                      <Text style={styles.certFileName} numberOfLines={1}>{policeCert}</Text>
                      <Text style={styles.certFileSize}>Verified Document</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemove('policeCert')} style={styles.removeCertBtn}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadInfoRow}>
                    <Ionicons name="cloud-upload-outline" size={26} color="#FF7A00" />
                    <View style={styles.certMeta}>
                      <Text style={styles.certPlaceholder}>Upload Certificate</Text>
                      <Text style={styles.certSubText}>Only Police Character certificates allowed</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Submit for Verification Button */}
              <TouchableOpacity 
                style={[
                  styles.submitDocsBtn,
                  ((!cnicFront || !cnicBack || workshopPics.length < 5 || !policeCert) || loading) && styles.submitDocsBtnDisabled
                ]}
                onPress={handleStep3Submit}
                disabled={loading || !cnicFront || !cnicBack || workshopPics.length < 5 || !policeCert}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitDocsBtnText}>Submit for Verification</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statusContainer}>
              <View style={styles.statusIconWrapper}>
                <Ionicons name="shield-checkmark" size={50} color="#10B981" />
              </View>
              
              <Text style={styles.statusTitle}>Submission Received!</Text>
              <Text style={styles.statusDescription}>
                Thank you! Your documents are submitted for review.
              </Text>
              
              <View style={styles.statusInfoCard}>
                <Ionicons name="time" size={22} color="#FF7A00" style={{ marginRight: 10, marginTop: 2 }} />
                <Text style={styles.statusInfoText}>
                  Your account is currently <Text style={{ fontWeight: 'bold', color: '#FF7A00' }}>Under Review</Text>. We will verify your profile and activate your workshop services within <Text style={{ fontWeight: 'bold', color: '#FFF' }}>24 Hours</Text>.
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.doneBtn}
                onPress={() => {
                  setStep(1);
                  setRole('');
                  navigation.navigate('Login');
                }}
              >
                <Text style={styles.doneBtnText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </BlurView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  glassCard: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    maxWidth: 520,
    width: '92%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerText: {
    color: '#FF7A00', // Orange accent
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 1,
  },
  backButton: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleSelectionContainer: {
    padding: 10,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    marginTop: 5,
  },
  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderTextContainer: {
    alignItems: 'center',
  },
  cardRoleTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
    textAlign: 'center',
  },
  cardRoleSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    height: 30, // Keeps height matching between both cards
  },
  featuresList: {
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  featureCheck: {
    marginRight: 4,
    marginTop: 1,
  },
  featureText: {
    color: '#E2E8F0',
    fontSize: 9.5,
    flex: 1,
    lineHeight: 12,
  },
  roleContinueBtn: {
    backgroundColor: '#FF7A00',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 10,
  },
  roleContinueBtnText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  backToLoginBtn: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 5,
  },
  backToLoginText: {
    color: '#FF7A00',
    fontSize: 13,
    fontWeight: '600',
  },
  formContainer: {
    padding: 25,
  },
  selectedRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 0, 0.3)',
  },
  selectedRoleBadgeText: {
    color: '#FF7A00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  label: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 5,
  },
  rolesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  roleBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  roleBoxSelected: {
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
    borderColor: '#FF7A00',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircleSelected: {
    backgroundColor: '#FF7A00',
  },
  roleTitle: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleTitleSelected: {
    color: '#FFF',
  },
  roleDesc: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 45,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapperFocused: {
    borderColor: '#FF7A00',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontStyle: 'italic',
    fontSize: 15,
    borderWidth: 0,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderStyle: 'none',
      },
    }),
  },
  icon: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
  iconRightInteractive: {
    marginLeft: 10,
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    overflow: 'hidden',
  },
  loginLink: {
    marginBottom: 10,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 5,
  },
  linksContainer: {
    alignItems:'flex-start',
  },
  loginLinkText: {
    color: '#FF7A00',
    fontWeight: 'bold',
    fontSize: 13,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#FF7A00',
    fontSize: 13,
    fontWeight: '600',
  },
  linkText: {
    color: '#FF7A00',
    fontWeight: 'bold',
    fontStyle: 'italic',
    fontSize: 13,
    marginBottom: 3,
  },
  buttonContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  submitBtn: {
    backgroundColor: '#FF7A00',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Verification Styles (Step 3)
  verificationContainer: {
    padding: 20,
  },
  uploadLabel: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 15,
  },
  cnicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  uploadBox: {
    flex: 1,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  uploadBoxCompleted: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderStyle: 'solid',
  },
  uploadBoxText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
  },
  uploadInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  uploadFileName: {
    color: '#E2E8F0',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    width: '85%',
  },
  removeBtn: {
    marginTop: 6,
  },
  workshopPicsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    marginTop: 5,
  },
  workshopPicSlotUploaded: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 122, 0, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  workshopPicSlotText: {
    color: '#FF7A00',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  removePicBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0F172A',
    borderRadius: 10,
  },
  workshopPicSlotAdd: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workshopPicSlotLoading: {
    borderStyle: 'solid',
  },
  addPicText: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  addPicCount: {
    color: '#FF7A00',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 1,
  },
  certificateUploadBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    padding: 16,
    marginBottom: 25,
    marginTop: 5,
  },
  certificateUploadBoxCompleted: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderStyle: 'solid',
  },
  uploadInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  certMeta: {
    flex: 1,
    marginLeft: 12,
  },
  certPlaceholder: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  certSubText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  certFileName: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  certFileSize: {
    color: '#10B981',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  removeCertBtn: {
    padding: 4,
  },
  submitDocsBtn: {
    backgroundColor: '#FF7A00',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 15,
  },
  submitDocsBtnDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.6,
  },
  submitDocsBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Status Styles (Step 4)
  statusContainer: {
    padding: 30,
    alignItems: 'center',
  },
  statusIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  statusDescription: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
  },
  statusInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  statusInfoText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  doneBtn: {
    backgroundColor: '#FF7A00',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;
