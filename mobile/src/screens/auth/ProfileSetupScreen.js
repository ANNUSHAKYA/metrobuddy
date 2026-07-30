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

export default function ProfileSetupScreen() {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const { token, updateUser } = useAuthStore();
  const { width } = useWindowDimensions();
  const isTablet = width >= 480;
  const isDesktop = width >= 768;
  const contentMaxWidth = isDesktop ? 420 : isTablet ? 440 : '100%';

  const handleSetup = async () => {
    if (!handle || handle.length < 3) {
      Alert.alert('Error', 'Handle must be at least 3 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await client.post('/auth/profile', { token, handle });
      updateUser(res.data.user);
      // AppNavigator will now see user.anonymousHandle and switch to Main Stack
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to setup profile');
    } finally {
      setLoading(false);
    }
  };

  const generateHandle = () => {
    const lines = ['Teal', 'Amber', 'Coral', 'Blue', 'Red', 'Silver', 'Gold'];
    const animals = ['Fox', 'Owl', 'Wolf', 'Bear', 'Hawk', 'Lynx'];
    const randomLine = lines[Math.floor(Math.random() * lines.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    const randomNum = Math.floor(Math.random() * 1000);
    setHandle(`${randomLine}${randomAnimal}_${randomNum}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.inner, isTablet && styles.innerCentered]}
      >
        <View style={[styles.card, { maxWidth: contentMaxWidth, width: '100%' }, isDesktop && styles.cardDesktop]}>
          <View style={styles.header}>
            <Text style={styles.emoji}>🎭</Text>
            <Text style={styles.title}>Create Profile</Text>
            <Text style={styles.subtitle}>
              Choose an anonymous handle for your commutes. Your real identity stays hidden.
            </Text>
          </View>

          <View style={styles.inputBlock}>
            <TextInput
              style={styles.input}
              placeholder="e.g. TealFox_42"
              placeholderTextColor="#aaa"
              value={handle}
              onChangeText={setHandle}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.generateBtn} onPress={generateHandle}>
            <Text style={styles.generateText}>🎲 Generate Random Handle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSetup}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Saving…' : 'Complete Setup'}
            </Text>
          </TouchableOpacity>
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
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
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
    textAlign: 'center',
    lineHeight: 22,
  },
  inputBlock: {
    marginBottom: 12,
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
  generateBtn: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    paddingVertical: 8,
  },
  generateText: {
    color: TEAL,
    fontWeight: '600',
    fontSize: 14,
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
});
