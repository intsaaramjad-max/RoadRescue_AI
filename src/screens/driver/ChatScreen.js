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
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

const API_URL = Platform.select({
  ios: 'https://road-rescue-ai-poc2.vercel.app/api',
  android: 'https://road-rescue-ai-poc2.vercel.app/api',
  default: 'https://road-rescue-ai-poc2.vercel.app/api',
});

// Format timestamp to short time string
const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Individual message bubble
function MessageBubble({ message, isMe }) {
  return (
    <View style={[bubbleStyles.wrapper, isMe ? bubbleStyles.wrapperRight : bubbleStyles.wrapperLeft]}>
      {!isMe && (
        <View style={bubbleStyles.avatar}>
          <Ionicons name="construct" size={14} color="#FFF" />
        </View>
      )}
      <View style={[bubbleStyles.bubble, isMe ? bubbleStyles.bubbleMe : bubbleStyles.bubbleOther]}>
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
  textMe: { color: '#FFF', fontWeight: '500' },
  textOther: { color: '#E2E8F0' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  time: { fontSize: 10, color: '#64748B' },
});

export default function ChatScreen({ route, navigation }) {
  const { user, token } = useAuth();

  const requestId = route?.params?.requestId || 'demo-chat';
  const recipientName = route?.params?.recipientName || 'Mechanic';

  const [messages, setMessages] = useState([
    {
      id: 'demo-1',
      requestId,
      senderId: 'mechanic-demo',
      senderRole: 'MECHANIC',
      text: 'Hello! I have accepted your request. I am on my way to your location. 🚗',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      isRead: true,
    },
    {
      id: 'demo-2',
      requestId,
      senderId: 'mechanic-demo',
      senderRole: 'MECHANIC',
      text: 'My ETA is approximately 12 minutes. Please stay near your vehicle.',
      createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      isRead: true,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    const optimisticMsg = {
      id: 'local-' + Date.now(),
      requestId,
      senderId: user?.id || 'local-user',
      senderRole: user?.role || 'DRIVER',
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
          <View style={styles.onlineDot} />
          <View>
            <Text style={styles.headerName}>{recipientName}</Text>
            <Text style={styles.headerStatus}>Online • Service in Progress</Text>
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
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isMe={item.senderId === (user?.id || 'local-user') || item.id.startsWith('local-')}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={48} color="#334155" />
              <Text style={styles.emptyChatText}>No messages yet. Say hi! 👋</Text>
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
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 10,
  },
  headerName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  headerStatus: {
    color: '#10B981',
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
