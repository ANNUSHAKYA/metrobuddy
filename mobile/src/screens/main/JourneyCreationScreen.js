import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  Alert, StyleSheet, Modal, TextInput, FlatList, Dimensions,
  StatusBar, useWindowDimensions,
} from 'react-native';
import client from '../../api/client';
import {
  DELHI_METRO_LINES, searchStations, getLinesForStation,
} from '../../data/delhiMetroData';

const TEAL = '#008080';
const BEIGE = '#F5F5DC';
const DARK_BG = '#0f172a';

export default function JourneyCreationScreen({ navigation }) {
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // 'departure' | 'destination'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLines, setExpandedLines] = useState({});

  const { width } = useWindowDimensions();
  const isTablet = width >= 480;
  const isDesktop = width >= 768;
  const contentMaxWidth = isDesktop ? 480 : isTablet ? 460 : '100%';

  // ─── Search results ───
  const filteredStations = useMemo(() => {
    return searchStations(searchQuery);
  }, [searchQuery]);

  // ─── Grouped by line for browse mode ───
  const groupedByLine = useMemo(() => {
    if (searchQuery.trim()) return null; // When searching, show flat list
    return DELHI_METRO_LINES;
  }, [searchQuery]);

  // ─── Handlers ───
  const openPicker = (target) => {
    setPickerTarget(target);
    setSearchQuery('');
    setExpandedLines({});
    setPickerVisible(true);
  };

  const selectStation = (stationName) => {
    if (pickerTarget === 'departure') {
      setDeparture(stationName);
    } else {
      setDestination(stationName);
    }
    setPickerVisible(false);
  };

  const swapStations = () => {
    setDeparture(destination);
    setDestination(departure);
  };

  const toggleLine = useCallback((lineId) => {
    setExpandedLines((prev) => ({
      ...prev,
      [lineId]: !prev[lineId],
    }));
  }, []);

  const handleCreateJourney = async () => {
    if (!departure || !destination) {
      Alert.alert('Error', 'Please select both departure and destination stations.');
      return;
    }
    if (departure === destination) {
      Alert.alert('Error', 'Departure and destination cannot be the same.');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 60000);
      const payload = {
        departureStation: departure,
        destinationStation: destination,
        departureTimeWindow: {
          start: now.toISOString(),
          end: end.toISOString(),
        },
        date: now.toISOString(),
      };
      await client.post('/journeys', payload);
      navigation.replace('MatchingStatus');
    } catch (err) {
      Alert.alert('Error', 'Failed to create journey.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Line badge component ───
  const LineBadge = ({ line }) => (
    <View style={[styles.lineBadge, { backgroundColor: line.color + '20', borderColor: line.color }]}>
      <View style={[styles.lineDot, { backgroundColor: line.color }]} />
      <Text style={[styles.lineBadgeText, { color: line.color }]} numberOfLines={1}>
        {line.name.replace(' Line', '').replace(' Branch', '')}
      </Text>
    </View>
  );

  // ─── Station row in search results ───
  const renderSearchResult = ({ item }) => {
    const isSelected =
      (pickerTarget === 'departure' && departure === item.name) ||
      (pickerTarget === 'destination' && destination === item.name);
    const isDisabled =
      (pickerTarget === 'departure' && destination === item.name) ||
      (pickerTarget === 'destination' && departure === item.name);

    return (
      <TouchableOpacity
        style={[
          styles.stationRow,
          isSelected && styles.stationRowSelected,
          isDisabled && styles.stationRowDisabled,
        ]}
        onPress={() => !isDisabled && selectStation(item.name)}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <View style={styles.stationRowLeft}>
          <Text style={[styles.stationName, isSelected && styles.stationNameSelected]}>
            {item.name}
          </Text>
          {item.lines.length > 1 && (
            <View style={styles.interchangeRow}>
              <Text style={styles.interchangeLabel}>⇄</Text>
              {item.lines.map((line) => (
                <View
                  key={line.id}
                  style={[styles.miniDot, { backgroundColor: line.color }]}
                />
              ))}
            </View>
          )}
        </View>
        <View style={styles.stationBadges}>
          {item.lines.slice(0, 3).map((line) => (
            <LineBadge key={line.id} line={line} />
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Station selector button ───
  const renderSelectorButton = (label, value, target, emoji) => {
    const lines = value ? getLinesForStation(value) : [];
    return (
      <TouchableOpacity
        style={[styles.selectorButton, value && styles.selectorButtonFilled]}
        onPress={() => openPicker(target)}
        activeOpacity={0.7}
      >
        <View style={styles.selectorLeft}>
          <Text style={styles.selectorEmoji}>{emoji}</Text>
          <View>
            <Text style={styles.selectorLabel}>{label}</Text>
            <Text style={[styles.selectorValue, !value && styles.selectorPlaceholder]}>
              {value || 'Tap to select station'}
            </Text>
          </View>
        </View>
        {value && lines.length > 0 && (
          <View style={styles.selectorBadges}>
            {lines.slice(0, 2).map((l) => (
              <View key={l.id} style={[styles.selectorDot, { backgroundColor: l.color }]} />
            ))}
          </View>
        )}
        <Text style={styles.selectorArrow}>›</Text>
      </TouchableOpacity>
    );
  };

  // ─── Main render ───
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BEIGE} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { alignItems: isTablet ? 'center' : 'stretch' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { maxWidth: contentMaxWidth, width: '100%' }]}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.headerEmoji}>🚇</Text>
            <Text style={styles.title}>Delhi Metro</Text>
            <Text style={styles.subtitle}>Find a buddy for your commute</Text>
          </View>

          {/* Station selectors */}
          <View style={styles.selectorsCard}>
            {renderSelectorButton('Departure Station', departure, 'departure', '📍')}

            {/* Swap button */}
            {departure && destination && (
              <TouchableOpacity style={styles.swapButton} onPress={swapStations}>
                <Text style={styles.swapIcon}>⇅</Text>
              </TouchableOpacity>
            )}

            <View style={styles.selectorDivider} />
            {renderSelectorButton('Destination Station', destination, 'destination', '🏁')}
          </View>

          {/* Route summary */}
          {departure && destination && departure !== destination && (
            <View style={styles.routeSummary}>
              <View style={styles.routeStationBlock}>
                {getLinesForStation(departure).map((l) => (
                  <View key={l.id} style={[styles.routeDot, { backgroundColor: l.color }]} />
                ))}
                <Text style={styles.routeStation} numberOfLines={1}>{departure}</Text>
              </View>
              <Text style={styles.routeArrow}>→</Text>
              <View style={styles.routeStationBlock}>
                {getLinesForStation(destination).map((l) => (
                  <View key={l.id} style={[styles.routeDot, { backgroundColor: l.color }]} />
                ))}
                <Text style={styles.routeStation} numberOfLines={1}>{destination}</Text>
              </View>
            </View>
          )}

          {/* Find Match button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCreateJourney}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating…' : '🔍 Find a Metro Buddy'}
            </Text>
          </TouchableOpacity>

          {/* Metro lines legend */}
          <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>Delhi Metro Lines</Text>
            <View style={styles.legendGrid}>
              {DELHI_METRO_LINES.filter(l => !l.id.includes('branch')).map((line) => (
                <View key={line.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: line.color }]} />
                  <Text style={styles.legendText} numberOfLines={1}>
                    {line.name} ({line.stations.length})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ─── Station Picker Modal ─── */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={[
            styles.modalHeader,
            isDesktop && { alignSelf: 'center', maxWidth: 520, width: '100%' },
          ]}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {pickerTarget === 'departure' ? '📍 Select Departure' : '🏁 Select Destination'}
            </Text>
          </View>

          {/* Search bar */}
          <View style={[
            styles.searchContainer,
            isDesktop && { alignSelf: 'center', maxWidth: 520, width: '100%' },
          ]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search stations... (e.g. Rajiv Chowk)"
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[
            styles.modalBody,
            isDesktop && { alignSelf: 'center', maxWidth: 520, width: '100%' },
          ]}>
            {/* Search results (flat list) */}
            {searchQuery.trim() ? (
              <FlatList
                data={filteredStations}
                keyExtractor={(item) => item.name}
                renderItem={renderSearchResult}
                contentContainerStyle={styles.searchResults}
                ListEmptyComponent={
                  <View style={styles.emptySearch}>
                    <Text style={styles.emptySearchEmoji}>🔍</Text>
                    <Text style={styles.emptySearchText}>No stations found</Text>
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />
            ) : (
              /* Browse by line (grouped) */
              <ScrollView showsVerticalScrollIndicator={false}>
                {DELHI_METRO_LINES.filter(l => !l.id.includes('branch')).map((line) => {
                  const isExpanded = expandedLines[line.id];
                  return (
                    <View key={line.id} style={styles.lineGroup}>
                      <TouchableOpacity
                        style={styles.lineHeader}
                        onPress={() => toggleLine(line.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.lineColorBar, { backgroundColor: line.color }]} />
                        <Text style={styles.lineEmoji}>{line.emoji}</Text>
                        <View style={styles.lineHeaderInfo}>
                          <Text style={[styles.lineName, { color: line.color }]}>
                            {line.name}
                          </Text>
                          <Text style={styles.lineStationCount}>
                            {line.stations.length} stations
                          </Text>
                        </View>
                        <Text style={styles.lineExpandIcon}>
                          {isExpanded ? '▾' : '▸'}
                        </Text>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.lineStations}>
                          {line.stations.map((station, idx) => {
                            const stationLines = getLinesForStation(station);
                            const isInterchange = stationLines.length > 1;
                            const isSelected =
                              (pickerTarget === 'departure' && departure === station) ||
                              (pickerTarget === 'destination' && destination === station);
                            const isDisabled =
                              (pickerTarget === 'departure' && destination === station) ||
                              (pickerTarget === 'destination' && departure === station);

                            return (
                              <TouchableOpacity
                                key={`${line.id}-${station}-${idx}`}
                                style={[
                                  styles.lineStationRow,
                                  isSelected && styles.lineStationSelected,
                                  isDisabled && styles.lineStationDisabled,
                                ]}
                                onPress={() => !isDisabled && selectStation(station)}
                                disabled={isDisabled}
                                activeOpacity={0.7}
                              >
                                {/* Vertical track line */}
                                <View style={styles.trackContainer}>
                                  {idx > 0 && (
                                    <View style={[styles.trackLineTop, { backgroundColor: line.color }]} />
                                  )}
                                  <View style={[
                                    styles.trackDot,
                                    { borderColor: line.color },
                                    isInterchange && styles.trackDotInterchange,
                                    isSelected && { backgroundColor: line.color },
                                  ]} />
                                  {idx < line.stations.length - 1 && (
                                    <View style={[styles.trackLineBottom, { backgroundColor: line.color }]} />
                                  )}
                                </View>

                                <View style={styles.lineStationInfo}>
                                  <Text style={[
                                    styles.lineStationName,
                                    isSelected && styles.lineStationNameSelected,
                                    isDisabled && { opacity: 0.4 },
                                  ]}>
                                    {station}
                                  </Text>
                                  {isInterchange && (
                                    <View style={styles.interchangeBadges}>
                                      <Text style={styles.interchangeSmallLabel}>⇄</Text>
                                      {stationLines
                                        .filter((sl) => sl.id !== line.id.replace('-branch', ''))
                                        .map((sl) => (
                                          <View
                                            key={sl.id}
                                            style={[styles.interchangeMiniDot, { backgroundColor: sl.color }]}
                                          />
                                        ))}
                                    </View>
                                  )}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BEIGE,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  // Header
  headerSection: {
    marginBottom: 28,
  },
  headerEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: TEAL,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
  },
  // Selector card
  selectorsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
    position: 'relative',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  selectorButtonFilled: {
    backgroundColor: '#f0fdfa',
  },
  selectorLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  selectorValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },
  selectorPlaceholder: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  selectorBadges: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 8,
  },
  selectorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  selectorArrow: {
    fontSize: 24,
    color: '#cbd5e1',
    fontWeight: '300',
  },
  selectorDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 14,
  },
  swapButton: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  swapIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Route summary
  routeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
  routeStation: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  routeArrow: {
    fontSize: 18,
    color: TEAL,
    fontWeight: '700',
    marginHorizontal: 10,
  },
  // Button
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
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: BEIGE,
    fontWeight: '700',
    fontSize: 17,
  },
  // Legend
  legendCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    paddingVertical: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },

  // ═══ Modal Styles ═══
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#1e293b',
  },
  clearSearch: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
    padding: 4,
  },
  modalBody: {
    flex: 1,
  },
  // Search results
  searchResults: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  stationRowSelected: {
    backgroundColor: '#f0fdfa',
    borderColor: TEAL,
  },
  stationRowDisabled: {
    opacity: 0.4,
  },
  stationRowLeft: {
    flex: 1,
  },
  stationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  stationNameSelected: {
    color: TEAL,
    fontWeight: '800',
  },
  interchangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  interchangeLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stationBadges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    maxWidth: 160,
    justifyContent: 'flex-end',
  },
  lineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  lineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  lineBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  // Line groups
  lineGroup: {
    marginHorizontal: 16,
    marginBottom: 4,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  lineColorBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 10,
  },
  lineEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  lineHeaderInfo: {
    flex: 1,
  },
  lineName: {
    fontSize: 15,
    fontWeight: '700',
  },
  lineStationCount: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 1,
  },
  lineExpandIcon: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
  },
  // Line stations (expanded)
  lineStations: {
    marginLeft: 16,
    paddingLeft: 8,
    marginBottom: 8,
  },
  lineStationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  lineStationSelected: {
    backgroundColor: '#f0fdfa',
  },
  lineStationDisabled: {
    opacity: 0.3,
  },
  trackContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  trackLineTop: {
    width: 2,
    height: 10,
    position: 'absolute',
    top: -6,
  },
  trackDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  trackDotInterchange: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
  },
  trackLineBottom: {
    width: 2,
    height: 10,
    position: 'absolute',
    bottom: -6,
  },
  lineStationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineStationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    flex: 1,
  },
  lineStationNameSelected: {
    fontWeight: '800',
    color: TEAL,
  },
  interchangeBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  interchangeSmallLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginRight: 2,
  },
  interchangeMiniDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  // Empty search
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptySearchEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptySearchText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
