import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform,
  useWindowDimensions,
} from 'react-native';
import client from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';

const TEAL = '#008080';
const BEIGE = '#F5F5DC';

export default function VerifyOtpScreen({ route, navigation }) {
  const { phone, devOtp } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 480;
  const isDesktop = width >= 768;
  const contentMaxWidth = isDesktop ? 420 : isTablet ? 440 : '100%';

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleVerify = async () => {
    if (otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await client.post('/auth/verify-otp', { phone, otp });
      const { token, user } = res.data;

      setAuth(token, user);

      if (!user.anonymousHandle) {
        navigation.replace('ProfileSetup');
      }
      // else: AppNavigator switches to Main stack automatically
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid OTP. Please try again.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    if (devOtp) {
      setOtp(devOtp);
    }
  };

  // Mask phone for display: +91987****210
  const maskedPhone = phone
    ? phone.slice(0, phone.length - 7) + '****' + phone.slice(-3)
    : phone;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.inner, isTablet && styles.innerCentered]}
      >
        <View style={[styles.card, { maxWidth: contentMaxWidth, width: '100%' }, isDesktop && styles.cardDesktop]}>
          {/* Dev Mode Banner */}
          {devOtp && (
            <View style={styles.devBanner}>
              <View style={styles.devBannerHeader}>
                <Text style={styles.devBannerIcon}>⚡</Text>
                <Text style={styles.devBannerLabel}>DEV MODE</Text>
              </View>
              <Text style={styles.devBannerCode}>{devOtp}</Text>
              <TouchableOpacity style={styles.autoFillButton} onPress={handleAutoFill}>
                <Text style={styles.autoFillText}>Auto-fill Code</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.header}>
            <Text style={styles.title}>Verify Phone</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
            </Text>
          </View>

          <View style={styles.inputBlock}>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor="#ccc"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Verifying…' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>

          {!devOtp && (
            <Text style={styles.hint}>
              Didn't receive the code? Check your SMS inbox.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BEIGE,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  innerCentered: {
    alignItems: 'center',
  },
  card: {},
  cardDesktop: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  // Dev banner
  devBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  devBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  devBannerIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  devBannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 1.5,
  },
  devBannerCode: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 8,
    marginBottom: 10,
  },
  autoFillButton: {
    backgroundColor: TEAL,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  autoFillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  // Header
  header: {
    marginBottom: 36,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: TEAL,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: TEAL,
  },
  inputBlock: {
    marginBottom: 28,
  },
  otpInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: TEAL,
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: 12,
    fontWeight: '700',
    color: '#333',
  },
  button: {
    backgroundColor: TEAL,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: BEIGE,
    fontWeight: '700',
    fontSize: 17,
  },
  hint: {
    marginTop: 24,
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
  },
});
