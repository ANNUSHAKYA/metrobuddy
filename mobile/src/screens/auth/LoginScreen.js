import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, Modal, FlatList,
  SafeAreaView, StyleSheet, StatusBar, KeyboardAvoidingView, Platform,
  useWindowDimensions, Animated,
} from 'react-native';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import client from '../../api/client';

const TEAL = '#008080';
const BEIGE = '#F5F5DC';
const DARK = '#0f172a';

// ─── Country Code Data ────────────────────────────────────────
const COUNTRIES = [
  { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India' },
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'SG', dial: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France' },
  { code: 'JP', dial: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: 'KR', dial: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: 'NP', dial: '+977', flag: '🇳🇵', name: 'Nepal' },
  { code: 'PK', dial: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: 'LK', dial: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
  { code: 'MY', dial: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: 'TH', dial: '+66',  flag: '🇹🇭', name: 'Thailand' },
  { code: 'ID', dial: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: 'PH', dial: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: 'NZ', dial: '+64',  flag: '🇳🇿', name: 'New Zealand' },
  { code: 'ZA', dial: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'BR', dial: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: 'MX', dial: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: 'IT', dial: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: 'ES', dial: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: 'RU', dial: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: 'CN', dial: '+86',  flag: '🇨🇳', name: 'China' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const [method, setMethod] = useState('phone'); // 'phone' | 'email'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const { width } = useWindowDimensions();
  const isTablet = width >= 480;
  const isDesktop = width >= 768;
  const contentMaxWidth = isDesktop ? 440 : isTablet ? 440 : '100%';

  // ─── Filter countries ───
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    const q = searchQuery.toLowerCase();
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.dial.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // ─── Validate phone → E.164 ───
  const getE164Phone = () => {
    const rawNumber = phone.replace(/[\s\-\(\)]/g, '');
    const fullNumber = `${country.dial}${rawNumber}`;
    const parsed = parsePhoneNumberFromString(fullNumber, country.code);
    if (!parsed || !parsed.isValid()) return null;
    return parsed.format('E.164');
  };

  // ─── Submit handler ───
  const handleContinue = async () => {
    setValidationError('');
    let identifier = null;

    if (method === 'phone') {
      if (!phone.trim()) {
        setValidationError('Please enter your phone number');
        return;
      }
      identifier = getE164Phone();
      if (!identifier) {
        setValidationError(`Invalid phone number for ${country.name}`);
        return;
      }
    } else {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) {
        setValidationError('Please enter your email address');
        return;
      }
      if (!EMAIL_REGEX.test(trimmed)) {
        setValidationError('Please enter a valid email address');
        return;
      }
      identifier = trimmed;
    }

    setLoading(true);
    try {
      const payload = method === 'phone' ? { phone: identifier } : { email: identifier };
      const res = await client.post('/auth/send-otp', payload);

      navigation.navigate('VerifyOtp', {
        identifier,
        method,
        maskedIdentifier: res.data.maskedIdentifier || identifier,
        devOtp: res.data.mockOtp || null,
      });
    } catch (err) {
      if (err.response?.status === 429) {
        Alert.alert('Rate Limited', err.response.data.error || 'Too many requests. Please try again later.');
      } else {
        Alert.alert('Error', 'Failed to send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMethod = (m) => {
    setMethod(m);
    setValidationError('');
    setPhone('');
    setEmail('');
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

          {/* Method tab switcher */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, method === 'phone' && styles.tabActive]}
              onPress={() => switchMethod('phone')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabIcon, method === 'phone' && styles.tabIconActive]}>📱</Text>
              <Text style={[styles.tabText, method === 'phone' && styles.tabTextActive]}>Phone</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, method === 'email' && styles.tabActive]}
              onPress={() => switchMethod('email')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabIcon, method === 'email' && styles.tabIconActive]}>📧</Text>
              <Text style={[styles.tabText, method === 'email' && styles.tabTextActive]}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* Input area */}
          <View style={styles.inputBlock}>
            {method === 'phone' ? (
              <>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneRow}>
                  <TouchableOpacity
                    style={styles.countryButton}
                    onPress={() => { setSearchQuery(''); setPickerVisible(true); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.countryFlag}>{country.flag}</Text>
                    <Text style={styles.countryDial}>{country.dial}</Text>
                    <Text style={styles.countryArrow}>▾</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Phone number"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(t) => { setPhone(t); setValidationError(''); }}
                    autoCapitalize="none"
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.emailInput}
                  placeholder="you@example.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setValidationError(''); }}
                />
              </>
            )}

            {validationError ? (
              <Text style={styles.errorText}>{validationError}</Text>
            ) : null}
          </View>

          {/* Continue button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending code…' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            {method === 'phone'
              ? "We'll send a 6-digit code to your phone."
              : "We'll send a 6-digit code to your email."}
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* ─── Country Picker Modal ─── */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Country</Text>
          </View>

          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search country..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryRow,
                  item.code === country.code && styles.countryRowSelected,
                ]}
                onPress={() => {
                  setCountry(item);
                  setPickerVisible(false);
                  setValidationError('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.countryRowFlag}>{item.flag}</Text>
                <Text style={styles.countryRowName}>{item.name}</Text>
                <Text style={styles.countryRowDial}>{item.dial}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.countryList}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BEIGE },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  innerCentered: { alignItems: 'center' },
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
  brandBlock: { alignItems: 'center', marginBottom: 32 },
  brandEmoji: { fontSize: 52, marginBottom: 10 },
  brandTitle: { fontSize: 34, fontWeight: '800', color: TEAL, letterSpacing: -0.5 },
  brandSub: { fontSize: 15, color: '#666', marginTop: 4 },
  brandCity: {
    fontSize: 12, color: TEAL, fontWeight: '700', marginTop: 6,
    backgroundColor: TEAL + '18', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12, overflow: 'hidden',
  },
  // ─── Tab switcher ───
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIcon: { fontSize: 16, opacity: 0.5 },
  tabIconActive: { opacity: 1 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: TEAL },
  // ─── Input ───
  inputBlock: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginLeft: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'stretch' },
  countryButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: TEAL,
    borderRightWidth: 0, borderTopLeftRadius: 14, borderBottomLeftRadius: 14,
    paddingHorizontal: 12, paddingVertical: 14, gap: 4,
  },
  countryFlag: { fontSize: 20 },
  countryDial: { fontSize: 15, fontWeight: '700', color: '#333' },
  countryArrow: { fontSize: 11, color: '#94a3b8', marginLeft: 2 },
  phoneInput: {
    flex: 1, backgroundColor: '#fff',
    paddingHorizontal: 14, paddingVertical: 15,
    borderTopRightRadius: 14, borderBottomRightRadius: 14,
    borderWidth: 1.5, borderColor: TEAL,
    fontSize: 16, color: '#333',
  },
  emailInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 15,
    borderRadius: 14, borderWidth: 1.5, borderColor: TEAL,
    fontSize: 16, color: '#333',
  },
  errorText: { color: '#dc2626', fontSize: 13, fontWeight: '600', marginTop: 6, marginLeft: 2 },
  // ─── Button ───
  button: {
    backgroundColor: TEAL, paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    shadowColor: TEAL, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: BEIGE, fontWeight: '700', fontSize: 17 },
  footerNote: { marginTop: 18, textAlign: 'center', color: '#999', fontSize: 13 },
  // ─── Country Picker Modal ───
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  modalClose: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  modalCloseText: { fontSize: 16, color: '#64748b', fontWeight: '700' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: DARK },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: DARK },
  countryList: { paddingHorizontal: 16, paddingBottom: 20 },
  countryRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 13,
    paddingHorizontal: 14, backgroundColor: '#fff', borderRadius: 10,
    marginBottom: 4, borderWidth: 1, borderColor: '#f1f5f9',
  },
  countryRowSelected: { backgroundColor: '#f0fdfa', borderColor: TEAL },
  countryRowFlag: { fontSize: 24, marginRight: 12 },
  countryRowName: { flex: 1, fontSize: 15, fontWeight: '600', color: DARK },
  countryRowDial: { fontSize: 15, fontWeight: '700', color: '#64748b' },
});
