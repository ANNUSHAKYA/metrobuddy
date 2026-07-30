import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  SafeAreaView, StyleSheet, StatusBar, Modal, Animated,
  KeyboardAvoidingView, Platform, Alert, Image,
  useWindowDimensions,
} from 'react-native';
import client from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';

const TEAL = '#008080';
const BEIGE = '#F5F5DC';
const DARK_TEAL = '#006666';

// ─── Premium placeholder media URLs ───
const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600',
  'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600',
];
const MOCK_VIDEOS = [
  'https://images.unsplash.com/photo-1532939163844-547f958e91b4?w=600',
];

// ─── Main Component ────────────────────────────────────────────
export default function ChatScreen({ route, navigation }) {
  const { matchId, buddyHandle } = route.params;
  const userId = useAuthStore((s) => s.user?.id);
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth >= 768;
  const chatMaxWidth = isDesktop ? 600 : '100%';
  const mediaWidth = Math.min(screenWidth * 0.55, 320);
  const mediaHeight = Math.min(screenWidth * 0.4, 240);
  const modalImageSize = Math.min(screenWidth - 48, 400);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showAttachDrawer, setShowAttachDrawer] = useState(false);
  const [viewOnceMedia, setViewOnceMedia] = useState(null); // modal state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [voiceProgress, setVoiceProgress] = useState({});

  const flatListRef = useRef(null);
  const recordTimerRef = useRef(null);
  const voiceTimerRef = useRef(null);

  // ─── Waveform animation bars ───
  const waveBars = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(4))
  ).current;

  // ─── Poll messages every 2 seconds ───
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await client.get(`/chat/${matchId}/messages`);
        setMessages(res.data);
      } catch (err) {
        // silently fail polling
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [matchId]);

  // ─── Auto-scroll to bottom on new messages ───
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // ─── Start waveform animation ───
  const startWaveAnimation = useCallback(() => {
    waveBars.forEach((bar) => {
      const animate = () => {
        Animated.sequence([
          Animated.timing(bar, {
            toValue: Math.random() * 22 + 4,
            duration: 80 + Math.random() * 120,
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: 4,
            duration: 80 + Math.random() * 120,
            useNativeDriver: false,
          }),
        ]).start(animate);
      };
      animate();
    });
  }, [waveBars]);

  const stopWaveAnimation = useCallback(() => {
    waveBars.forEach((bar) => {
      bar.stopAnimation();
      bar.setValue(4);
    });
  }, [waveBars]);

  // ─── Send text message ───
  const handleSendText = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setInputText('');
    try {
      await client.post(`/chat/${matchId}/messages`, {
        type: 'text',
        content: trimmed,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // ─── Send media ───
  const handleSendMedia = async (isViewOnce, isVideo = false) => {
    setShowAttachDrawer(false);
    const pool = isVideo ? MOCK_VIDEOS : MOCK_PHOTOS;
    const mediaUrl = pool[Math.floor(Math.random() * pool.length)];
    try {
      await client.post(`/chat/${matchId}/messages`, {
        type: 'media',
        content: isViewOnce
          ? (isVideo ? '🎬 View-Once Video' : '📷 View-Once Photo')
          : (isVideo ? '🎬 Video' : '📷 Photo'),
        mediaUrl,
        viewOnce: isViewOnce,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to send media');
    }
  };

  // ─── Record voice note ───
  const handleRecordStart = () => {
    setIsRecording(true);
    setRecordingTime(0);
    startWaveAnimation();
    recordTimerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const handleRecordStop = async () => {
    setIsRecording(false);
    stopWaveAnimation();
    clearInterval(recordTimerRef.current);
    const duration = recordingTime || 1;
    setRecordingTime(0);
    try {
      await client.post(`/chat/${matchId}/messages`, {
        type: 'voice',
        content: `🎤 Voice Note`,
        duration,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to send voice note');
    }
  };

  // ─── Simulate buddy reply ───
  const handleSimulateReply = async () => {
    try {
      await client.post(`/chat/${matchId}/simulate-reply`);
    } catch (err) {
      Alert.alert('Error', 'Failed to simulate reply');
    }
  };

  // ─── View once reveal ───
  const handleRevealViewOnce = async (msg) => {
    if (msg.isOpened) return;
    setViewOnceMedia(msg);
  };

  const handleCloseViewOnce = async () => {
    if (viewOnceMedia) {
      try {
        await client.post(`/chat/message/${viewOnceMedia.id}/reveal`);
      } catch (err) {
        // ignore errors
      }
      setViewOnceMedia(null);
    }
  };

  // ─── Voice note playback simulation ───
  const handlePlayVoice = (msg) => {
    if (playingVoiceId === msg.id) {
      // stop
      clearInterval(voiceTimerRef.current);
      setPlayingVoiceId(null);
      setVoiceProgress((prev) => ({ ...prev, [msg.id]: 0 }));
      return;
    }
    setPlayingVoiceId(msg.id);
    setVoiceProgress((prev) => ({ ...prev, [msg.id]: 0 }));
    const totalDuration = (msg.duration || 3) * 10; // 100ms ticks
    let tick = 0;
    voiceTimerRef.current = setInterval(() => {
      tick += 1;
      setVoiceProgress((prev) => ({
        ...prev,
        [msg.id]: Math.min(tick / totalDuration, 1),
      }));
      if (tick >= totalDuration) {
        clearInterval(voiceTimerRef.current);
        setPlayingVoiceId(null);
      }
    }, 100);
  };

  // ─── Format time ───
  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ─── Render a single message ───
  const renderMessage = ({ item }) => {
    const isMine = item.senderId === userId;
    const bubbleStyle = isMine ? styles.myBubble : styles.theirBubble;
    const textStyle = isMine ? styles.myText : styles.theirText;
    const timeStyle = isMine ? styles.myTime : styles.theirTime;

    // Voice note message
    if (item.type === 'voice') {
      const progress = voiceProgress[item.id] || 0;
      const isPlaying = playingVoiceId === item.id;
      return (
        <View style={[styles.bubbleRow, isMine && styles.bubbleRowRight]}>
          <View style={[bubbleStyle, styles.voiceBubble]}>
            <TouchableOpacity
              onPress={() => handlePlayVoice(item)}
              style={styles.playButton}
            >
              <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
            </TouchableOpacity>
            <View style={styles.voiceWaveContainer}>
              {Array.from({ length: 16 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.voiceBar,
                    {
                      height: 4 + Math.sin(i * 0.8 + (item.id % 10)) * 10 + 6,
                      backgroundColor:
                        i / 16 <= progress
                          ? isMine ? '#fff' : TEAL
                          : isMine ? 'rgba(255,255,255,0.35)' : '#cbd5e1',
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[timeStyle, { marginLeft: 8, minWidth: 32 }]}>
              {formatDuration(item.duration || 0)}
            </Text>
          </View>
        </View>
      );
    }

    // Media / View-once message
    if (item.type === 'media') {
      if (item.viewOnce) {
        return (
          <View style={[styles.bubbleRow, isMine && styles.bubbleRowRight]}>
            <TouchableOpacity
              style={[bubbleStyle, styles.viewOnceBubble]}
              onPress={() => !item.isOpened && handleRevealViewOnce(item)}
              disabled={item.isOpened}
            >
              <Text style={styles.viewOnceIcon}>
                {item.isOpened ? '⊘' : '🔒'}
              </Text>
              <Text style={[textStyle, item.isOpened && styles.openedText]}>
                {item.isOpened
                  ? 'Opened'
                  : `Tap to view (View Once)`}
              </Text>
            </TouchableOpacity>
          </View>
        );
      }
      // Regular media
      return (
        <View style={[styles.bubbleRow, isMine && styles.bubbleRowRight]}>
          <View style={[bubbleStyle, styles.mediaBubble]}>
            {item.mediaUrl && (
              <Image
                source={{ uri: item.mediaUrl }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            )}
            <Text style={[textStyle, { marginTop: 6 }]}>{item.content}</Text>
          </View>
        </View>
      );
    }

    // Text message (default)
    return (
      <View style={[styles.bubbleRow, isMine && styles.bubbleRowRight]}>
        <View style={bubbleStyle}>
          <Text style={textStyle}>{item.content}</Text>
          <Text style={timeStyle}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  // ─── Render ───
  return (
    <SafeAreaView style={[styles.container, isDesktop && styles.containerDesktop]}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_TEAL} />

      {/* ─── Header ─── */}
      <View style={[styles.header, isDesktop && { alignSelf: 'center', maxWidth: chatMaxWidth, width: '100%' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>🧑‍🤝‍🧑</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{buddyHandle || 'Metro Buddy'}</Text>
            <Text style={styles.headerStatus}>Matched • Active</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.simReplyButton}
          onPress={handleSimulateReply}
        >
          <Text style={styles.simReplyText}>🤖</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Messages ─── */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[styles.messagesList, isDesktop && { maxWidth: chatMaxWidth, alignSelf: 'center', width: '100%' }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatEmoji}>💬</Text>
              <Text style={styles.emptyChatText}>
                Say hello to your Metro Buddy!
              </Text>
              <Text style={styles.emptyChatSub}>
                Messages auto-expire when your commute ends.
              </Text>
            </View>
          }
        />

        {/* ─── Voice Recording Overlay ─── */}
        {isRecording && (
          <View style={styles.recordingOverlay}>
            <View style={styles.waveformRow}>
              {waveBars.map((bar, i) => (
                <Animated.View
                  key={i}
                  style={[styles.waveBar, { height: bar }]}
                />
              ))}
            </View>
            <Text style={styles.recordingTimer}>
              {formatDuration(recordingTime)}
            </Text>
            <TouchableOpacity
              style={styles.stopRecordButton}
              onPress={handleRecordStop}
            >
              <Text style={styles.stopRecordIcon}>⬆️</Text>
              <Text style={styles.stopRecordText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Attachment Drawer ─── */}
        {showAttachDrawer && (
          <View style={styles.attachDrawer}>
            <TouchableOpacity
              style={styles.attachOption}
              onPress={() => handleSendMedia(false, false)}
            >
              <Text style={styles.attachIcon}>📷</Text>
              <Text style={styles.attachLabel}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachOption}
              onPress={() => handleSendMedia(false, true)}
            >
              <Text style={styles.attachIcon}>🎬</Text>
              <Text style={styles.attachLabel}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachOption}
              onPress={() => handleSendMedia(true, false)}
            >
              <Text style={styles.attachIcon}>🔒</Text>
              <Text style={styles.attachLabel}>View-Once Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachOption}
              onPress={() => handleSendMedia(true, true)}
            >
              <Text style={styles.attachIcon}>🔐</Text>
              <Text style={styles.attachLabel}>View-Once Video</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Input Bar ─── */}
        {!isRecording && (
          <View style={[styles.inputBar, isDesktop && { maxWidth: chatMaxWidth, alignSelf: 'center', width: '100%' }]}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => setShowAttachDrawer(!showAttachDrawer)}
            >
              <Text style={styles.attachButtonIcon}>＋</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Message…"
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => setShowAttachDrawer(false)}
              onSubmitEditing={handleSendText}
              returnKeyType="send"
            />
            {inputText.trim() ? (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendText}
              >
                <Text style={styles.sendIcon}>⬆️</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.micButton}
                onPressIn={handleRecordStart}
              >
                <Text style={styles.micIcon}>🎙️</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ─── View-Once Media Modal ─── */}
      <Modal
        visible={!!viewOnceMedia}
        transparent
        animationType="fade"
        onRequestClose={handleCloseViewOnce}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>🔒 View Once</Text>
            {viewOnceMedia?.mediaUrl && (
              <Image
                source={{ uri: viewOnceMedia.mediaUrl }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
            <Text style={styles.modalWarning}>
              This media will disappear after you close this viewer.
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handleCloseViewOnce}
            >
              <Text style={styles.modalCloseText}>Close & Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0ece3',
  },
  containerDesktop: {
    backgroundColor: '#e8e4db',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL,
    paddingHorizontal: 12,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  headerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  headerStatus: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  simReplyButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simReplyText: {
    fontSize: 18,
  },
  // Chat area
  chatArea: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  // Bubbles
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
  },
  myBubble: {
    backgroundColor: TEAL,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '75%',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  theirBubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  myText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  theirText: {
    color: '#1e293b',
    fontSize: 15,
    lineHeight: 20,
  },
  myTime: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  theirTime: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 4,
  },
  // Voice bubble
  voiceBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playIcon: {
    fontSize: 14,
  },
  voiceWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  voiceBar: {
    width: 3,
    borderRadius: 2,
  },
  // Media bubble
  mediaBubble: {
    overflow: 'hidden',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  mediaImage: {
    width: 200,
    height: 150,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  // View-once bubble
  viewOnceBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,128,128,0.4)',
  },
  viewOnceIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  openedText: {
    fontStyle: 'italic',
    opacity: 0.5,
  },
  // Empty state
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyChatEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyChatText: {
    fontSize: 17,
    fontWeight: '700',
    color: TEAL,
    textAlign: 'center',
  },
  emptyChatSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  attachButtonIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1e293b',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendIcon: {
    fontSize: 16,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  micIcon: {
    fontSize: 18,
  },
  // Attachment drawer
  attachDrawer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  attachOption: {
    minWidth: 70,
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  attachIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  attachLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  // Recording overlay
  recordingOverlay: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 3,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  recordingTimer: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  stopRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stopRecordIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  stopRecordText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  // View-Once modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    alignItems: 'center',
    width: '100%',
  },
  modalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalImage: {
    width: 360,
    height: 360,
    maxWidth: '90%',
    borderRadius: 12,
    marginBottom: 20,
  },
  modalWarning: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modalCloseButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
