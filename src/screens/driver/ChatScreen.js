import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

const API_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  ios: 'http://localhost:5000/api',
  default: 'http://localhost:5000/api'
});

// Format timestamp to short time string
const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Individual message bubble
function MessageBubble({ message, isMe, senderName, recipientImage }) {
  return (
    <View style={[bubbleStyles.wrapper, isMe ? bubbleStyles.wrapperRight : bubbleStyles.wrapperLeft]}>
      {!isMe && (
        <View style={bubbleStyles.avatar}>
          {recipientImage ? (
            <Image source={{ uri: recipientImage }} style={bubbleStyles.avatarImage} />
          ) : (
            <Text style={bubbleStyles.avatarInitial}>{senderName?.charAt(0)?.toUpperCase() || '?'}</Text>
          )}
        </View>
      )}
      <View style={[bubbleStyles.bubble, isMe ? bubbleStyles.bubbleMe : bubbleStyles.bubbleOther]}>
        <Text style={[bubbleStyles.senderName, isMe && bubbleStyles.senderNameMe]}>{senderName}</Text>
        <Text style={[bubbleStyles.text, isMe ? bubbleStyles.textMe : bubbleStyles.textOther]}>
          {message.text}
        </Text>
        <View style={bubbleStyles.timeRow}>
          <Text style={[bubbleStyles.time, isMe && { color: 'rgba(255,255,255,0.6)' }]}>
            {formatTime(message.createdAt)}
          </Text>
          {isMe && (
            <Ionicons
              name={message.isRead ? 'checkmark-done' : 'checkmark'}
              size={12}
              color="rgba(255,255,255,0.6)"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  wrapper: { flexDirection: 'row', marginVertical: 3, alignItems: 'flex-end' },
  wrapperRight: { justifyContent: 'flex-end' },
  wrapperLeft: { justifyContent: 'flex-start' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 4,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 14 },
  avatarInitial: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: '#F97316',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  text: { fontSize: 14, lineHeight: 20 },
  senderName: { color: '#93C5FD', fontSize: 10, fontWeight: '700', marginBottom: 3 },
  senderNameMe: { color: 'rgba(255,255,255,0.82)' },
  textMe: { color: '#FFF', fontWeight: '500' },
  textOther: { color: '#E2E8F0' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  time: { fontSize: 10, color: '#64748B' },
});

export default function ChatScreen({ route, navigation }) {
  const { user, userRole, token } = useAuth();
  const routeParams = route?.params || {};
  const request = routeParams.request || routeParams.requestData || {};
  const requestId = routeParams.requestId || request.id || request._id;
  const currentRole = (user?.role || userRole || 'DRIVER').toUpperCase();
  const ownName = user?.fullName?.trim() || '';
  const nameCandidates = currentRole === 'DRIVER'
    ? [
      routeParams.mechanicName,
      routeParams.mechanicFullName,
      routeParams.recipientName,
      routeParams.mechanic?.fullName,
      routeParams.assignedMechanic?.fullName,
      request.mechanic?.fullName,
      request.assignedMechanic?.fullName,
      request.mechanicFullName,
      request.mechanicName,
    ]
    : [
      routeParams.driverName,
      routeParams.customerName,
      routeParams.recipientName,
      routeParams.driver?.fullName,
      routeParams.customer?.fullName,
      request.driverName,
      request.customerName,
      request.driver?.fullName,
      request.customer?.fullName,
    ];
  const recipientName = nameCandidates
    .find((name) => typeof name === 'string'
      && name.trim()
      && !name.includes('@')
      && name.trim().toLowerCase() !== ownName.toLowerCase())?.trim()
    || (currentRole === 'DRIVER' ? 'Assigned service provider' : 'Customer');
  const recipient = currentRole === 'DRIVER'
    ? routeParams.mechanic || routeParams.assignedMechanic || request.mechanic || request.assignedMechanic || {}
    : routeParams.driver || routeParams.customer || request.driver || request.customer || {};
  const recipientImage = [
    routeParams.recipientImage,
    routeParams.recipientPhoto,
    routeParams.recipientAvatar,
    routeParams.profileImage,
    recipient.profileImage,
    recipient.avatarUrl,
    recipient.photoUrl,
    recipient.imageUrl,
  ].find((image) => typeof image === 'string' && image.trim()) || null;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!requestId || !token) {
      setMessages([]);
      return undefined;
    }

    let active = true;
    fetch(`${API_URL}/chat/${encodeURIComponent(requestId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load chat messages.');
        return data;
      })
      .then((data) => {
        if (active && Array.isArray(data.messages)) setMessages(data.messages);
      })
      .catch((error) => {
        if (active) console.error('Failed to load chat messages:', error);
      });

    return () => {
      active = false;
    };
  }, [requestId, token]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

    if (!SpeechRecognition) {
      Alert.alert(
        'Voice input unavailable',
        'Voice input is supported in Chrome and Edge on the web.'
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join('');
      setInputText((currentText) => `${currentText}${currentText ? ' ' : ''}${transcript}`);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    if (!requestId) {
      Alert.alert('Chat unavailable', 'Open chat from a service request to send a message.');
      return;
    }

    const optimisticMsg = {
      id: 'local-' + Date.now(),
      requestId,
      senderId: user?.id || 'local-user',
      senderRole: currentRole,
      text,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setSending(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, text }),
      });
      // If backend is unreachable (demo mode), message already showing
    } catch (error) {
      // Optimistic UI — message stays visible even if request fails
    } finally {
      setSending(false);
    }
  };

  const quickReplies = ['On my way!', 'Thank you 🙏', 'How long?', 'I am here'];

  return (
    <ScreenWrapper useSafeArea={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <View style={styles.headerAvatar}>
            {recipientImage ? (
              <Image source={{ uri: recipientImage }} style={styles.headerAvatarImage} />
            ) : (
              <Text style={styles.headerAvatarInitial}>{recipientName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View>
            <Text style={styles.headerName}>{recipientName}</Text>
            <Text style={styles.headerStatus}>
              {requestId ? `Service request ${requestId}` : 'Service participant'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}>
          <Ionicons name="call" size={20} color="#10B981" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onLayout={scrollToBottom}
          renderItem={({ item }) => {
            const isMe = item.senderRole
              ? item.senderRole.toUpperCase() === currentRole
              : item.senderId === (user?.id || 'local-user');
            return (
              <MessageBubble
                message={item}
                isMe={isMe}
                senderName={isMe ? ownName || 'You' : recipientName}
                recipientImage={isMe ? null : recipientImage}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={48} color="#334155" />
              <Text style={styles.emptyChatText}>
                {requestId ? 'No messages yet. Say hi!' : 'Open chat from a service request to start a conversation.'}
              </Text>
            </View>
          }
        />

        {/* Quick Replies */}
        <View style={styles.quickRepliesRow}>
          {quickReplies.map((reply) => (
            <TouchableOpacity
              key={reply}
              style={styles.quickReplyChip}
              onPress={() => {
                setInputText(reply);
                inputRef.current?.focus();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.quickReplyText}>{reply}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#475569"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.voiceBtn, isListening && styles.voiceBtnActive]}
            onPress={toggleVoiceInput}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={20} color={isListening ? '#FFF' : '#F97316'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginRight: 10,
  },
  headerMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerAvatarImage: { width: '100%', height: '100%', borderRadius: 20 },
  headerAvatarInitial: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  headerName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  headerStatus: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 1,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16,185,129,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyChat: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyChatText: {
    color: '#475569',
    fontSize: 14,
    marginTop: 12,
  },
  quickRepliesRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
    flexWrap: 'nowrap',
  },
  quickReplyChip: {
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.25)',
  },
  quickReplyText: {
    color: '#F97316',
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: 10,
  },
  voiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(249,115,22,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.25)',
    marginRight: 8,
  },
  voiceBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
});
