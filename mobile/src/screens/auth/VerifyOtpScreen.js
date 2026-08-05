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
  // Support both old { phone } and new { identifier, method, maskedIdentifier }
  const {
    identifier,
    method = 'phone',
    maskedIdentifier,
    devOtp,
    // Legacy fallback
    phone,
  } = route.params || {};

  const activeIdentifier = identifier || phone;
  const activeMethod = method;
  const displayIdentifier = maskedIdentifier || activeIdentifier;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 480;
  const isDesktop = width >= 768;
  const contentMaxWidth = isDesktop ? 420 : isTablet ? 440 : '100%';

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleVerify = async () => {
    if (otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit verification code');
      return;
    }
    setLoading(true);
    try {
      const res = await client.post('/auth/verify-otp', {
        identifier: activeIdentifier,
        otp,
      });
      const { token, user } = res.data;
      setAuth(token, user);

      if (!user.anonymousHandle) {
        navigation.replace('ProfileSetup');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid code. Please try again.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    if (devOtp) setOtp(devOtp);
  };

  // Determine channel label
  const channelLabel = activeMethod === 'email' ? 'email' : 'phone';
  const channelIcon = activeMethod === 'email' ? '📧' : '📱';

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
                <Text style={styles.devBannerLabel}>DEV MODE — {channelLabel.toUpperCase()} OTP</Text>
              </View>
              <Text style={styles.devBannerCode}>{devOtp}</Text>
              <TouchableOpacity style={styles.autoFillButton} onPress={handleAutoFill}>
                <Text style={styles.autoFillText}>Auto-fill Code</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.channelBadge}>{channelIcon} via {channelLabel}</Text>
            <Text style={styles.title}>Enter Your Code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{'\n'}
              <Text style={styles.identifierHighlight}>{displayIdentifier}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.inputBlock}>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor="#ccc"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
            />
          </View>

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Verifying…' : 'Verify Code'}
            </Text>
          </TouchableOpacity>

          {/* Resend hint */}
          {!devOtp && (
            <Text style={styles.hint}>
              Didn't receive the code? Check your {channelLabel} and spam folder.
            </Text>
          )}

          {/* Back link */}
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backLinkText}>← Use a different {channelLabel}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BEIGE },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  innerCentered: { alignItems: 'center' },
  card: {},
  cardDesktop: {
    backgroundColor: '#fff', borderRadius: 20, padding: 36,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 6,
  },
  // ─── Dev banner ───
  devBanner: {
    backgroundColor: '#0f172a', borderRadius: 12, padding: 16,
    marginBottom: 24, alignItems: 'center',
  },
  devBannerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  devBannerIcon: { fontSize: 14, marginRight: 6 },
  devBannerLabel: { fontSize: 10, fontWeight: '800', color: '#fbbf24', letterSpacing: 1.5 },
  devBannerCode: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: 10, marginBottom: 10 },
  autoFillButton: { backgroundColor: TEAL, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  autoFillText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  // ─── Header ───
  header: { marginBottom: 32 },
  channelBadge: {
    fontSize: 12, fontWeight: '700', color: TEAL, letterSpacing: 0.5,
    marginBottom: 8, textTransform: 'uppercase',
  },
  title: { fontSize: 28, fontWeight: '800', color: TEAL, marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', lineHeight: 22 },
  identifierHighlight: { fontWeight: '700', color: TEAL },
  // ─── Input ───
  inputBlock: { marginBottom: 24 },
  otpInput: {
    backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 18,
    borderRadius: 14, borderWidth: 1.5, borderColor: TEAL,
    fontSize: 30, textAlign: 'center', letterSpacing: 14,
    fontWeight: '700', color: '#333',
  },
  // ─── Button ───
  button: {
    backgroundColor: TEAL, paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    shadowColor: TEAL, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: BEIGE, fontWeight: '700', fontSize: 17 },
  // ─── Footer ───
  hint: { marginTop: 20, textAlign: 'center', color: '#999', fontSize: 13 },
  backLink: { marginTop: 20, alignItems: 'center' },
  backLinkText: { color: TEAL, fontWeight: '600', fontSize: 14 },
});
