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
  const { phone } = route.params;
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
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.inner, isTablet && styles.innerCentered]}
      >
        <View style={[styles.card, { maxWidth: contentMaxWidth, width: '100%' }, isDesktop && styles.cardDesktop]}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify Phone</Text>
            <Text style={styles.subtitle}>Enter the OTP sent to {phone}</Text>
          </View>

          <View style={styles.inputBlock}>
            <TextInput
              style={styles.otpInput}
              placeholder="123456"
              placeholderTextColor="#bbb"
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

          <Text style={styles.hint}>
            Use code <Text style={styles.hintBold}>123456</Text> for testing
          </Text>
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
    fontSize: 16,
    color: '#666',
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
  hintBold: {
    fontWeight: '700',
    color: TEAL,
  },
});
