import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  Alert, SafeAreaView, StyleSheet, StatusBar, ScrollView,
  useWindowDimensions,
} from 'react-native';
import client from '../../api/client';
import { getLinesForStation } from '../../data/delhiMetroData';

const TEAL = '#008080';
const BEIGE = '#F5F5DC';

export default function MatchingStatusScreen({ navigation }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 480;
  const isDesktop = width >= 768;
  const contentMaxWidth = isDesktop ? 480 : isTablet ? 460 : '100%';

  useEffect(() => {
    // Poll active match endpoint every 3 seconds
    const interval = setInterval(async () => {
      try {
        const res = await client.get('/journeys/active-match');
        if (res.data.match) {
          setMatch(res.data.match);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling active match:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await client.post('/journeys/cancel');
      navigation.replace('JourneyCreation');
    } catch (err) {
      Alert.alert('Error', 'Failed to cancel journey');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateMatch = async () => {
    setSimulating(true);
    try {
      await client.post('/journeys/simulate-match');
      // The poll interval will pick it up automatically within 3 seconds
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to simulate match');
    } finally {
      setSimulating(false);
    }
  };

  // Get metro line colors for stations
  const departureLines = match ? getLinesForStation(match.departureStation) : [];
  const destinationLines = match ? getLinesForStation(match.destinationStation) : [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BEIGE} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && { alignItems: 'center' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { maxWidth: contentMaxWidth, width: '100%' }]}>
          {!match ? (
            // Searching state
            <View style={styles.searchingContainer}>
              <Text style={styles.searchingEmoji}>🔍</Text>
              <Text style={styles.title}>Finding a Buddy…</Text>
              <Text style={styles.subtitle}>
                We are scanning for commuters going your way at the same time.
              </Text>

              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={TEAL} />
              </View>

              {/* Simulation Helper */}
              <View style={styles.simulationBox}>
                <Text style={styles.simText}>Testing alone?</Text>
                <TouchableOpacity
                  style={[styles.simButton, simulating && styles.disabled]}
                  onPress={handleSimulateMatch}
                  disabled={simulating}
                >
                  <Text style={styles.simButtonText}>
                    {simulating ? 'Simulating…' : '🎲 Simulate Companion Match'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Matched state
            <View style={styles.matchedContainer}>
              <Text style={styles.matchedEmoji}>🎉</Text>
              <Text style={styles.title}>Buddy Found!</Text>
              <Text style={styles.subtitle}>
                You have been matched with another commuter.
              </Text>

              <View style={[styles.matchCard, isDesktop && styles.matchCardDesktop]}>
                <View style={styles.cardSection}>
                  <Text style={styles.cardLabel}>COMMUTE COMPANION</Text>
                  <Text style={styles.cardValue}>{match.buddyHandle}</Text>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardSection}>
                  <Text style={styles.cardLabel}>MEETUP SPOT</Text>
                  <Text style={styles.cardValue}>{match.meetupSpot}</Text>
                  <Text style={styles.meetupHelp}>
                    Meet inside the departure station before boarding.
                  </Text>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardSection}>
                  <Text style={styles.cardLabel}>ROUTE</Text>
                  <View style={styles.routeRow}>
                    <View style={styles.routeStationBlock}>
                      {departureLines.map((l) => (
                        <View key={l.id} style={[styles.routeDot, { backgroundColor: l.color }]} />
                      ))}
                      <Text style={styles.routeText} numberOfLines={1}>
                        {match.departureStation}
                      </Text>
                    </View>
                    <Text style={styles.routeArrow}>→</Text>
                    <View style={styles.routeStationBlock}>
                      {destinationLines.map((l) => (
                        <View key={l.id} style={[styles.routeDot, { backgroundColor: l.color }]} />
                      ))}
                      <Text style={styles.routeText} numberOfLines={1}>
                        {match.destinationStation}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => navigation.navigate('Chat', {
                  matchId: match.id,
                  buddyHandle: match.buddyHandle,
                })}
              >
                <Text style={styles.chatButtonText}>💬 Chat with Buddy</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cancel button always visible */}
          <TouchableOpacity
            style={[styles.cancelButton, loading && styles.disabled]}
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>
              {match ? 'End Commute' : 'Cancel Search'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BEIGE,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: TEAL,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  // Searching styles
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  loaderContainer: {
    marginVertical: 40,
  },
  simulationBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  simText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '600',
  },
  simButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  simButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  // Matched styles
  matchedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchedEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  matchCardDesktop: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardSection: {
    paddingVertical: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: TEAL,
  },
  meetupHelp: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  routeStationBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  routeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  routeArrow: {
    fontSize: 16,
    color: TEAL,
    fontWeight: '700',
    marginHorizontal: 8,
  },
  chatButton: {
    backgroundColor: TEAL,
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 12,
  },
  chatButtonText: {
    color: BEIGE,
    fontWeight: '700',
    fontSize: 16,
  },
  // Cancel button styles
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});
