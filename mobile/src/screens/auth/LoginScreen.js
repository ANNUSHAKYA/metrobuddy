import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  SafeAreaView, StyleSheet, StatusBar, KeyboardAvoidingView, Platform,
  useWindowDimensions,
} from 'react-native';
import client from '../../api/client';

const TEAL = '#008080';
const BEIGE = '#F5F5DC';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 480;
  const isDesktop = width >= 768;
  const contentMaxWidth = isDesktop ? 420 : isTablet ? 440 : '100%';

  const handleLogin = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      await client.post('/auth/send-otp', { phone });
      navigation.navigate('VerifyOtp', { phone });
    } catch (err) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BEIGE} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.inner, isTablet && styles.innerCentered]}
      >
        <View style={[styles.card, { maxWidth: contentMaxWidth, width: '100%' }, isDesktop && styles.cardDesktop]}>
          {/* Brand */}
          <View style={styles.brandBlock}>
            <Text style={styles.brandEmoji}>🚇</Text>
            <Text style={styles.brandTitle}>Metro Buddy</Text>
            <Text style={styles.brandSub}>Find your commute companion</Text>
            <Text style={styles.brandCity}>Delhi Metro</Text>
          </View>

          {/* Input */}
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
            />
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending OTP…' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            We'll send a 6-digit code to verify your number.
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
  card: {
    // Default: full width, no card styling on mobile
  },
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
  brandBlock: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: TEAL,
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 16,
    color: '#666',
    marginTop: 6,
  },
  brandCity: {
    fontSize: 13,
    color: TEAL,
    fontWeight: '700',
    marginTop: 6,
    backgroundColor: TEAL + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputBlock: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: TEAL,
    fontSize: 17,
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
  footerNote: {
    marginTop: 20,
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
  },
});
