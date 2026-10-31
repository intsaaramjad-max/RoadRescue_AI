import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Linking, Alert,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';

const FAQS = [
  {
    q: 'How do I request roadside assistance?',
    a: 'Go to the Dashboard and tap on the service you need (Tow Truck, Flat Tire, Battery, etc.). Fill in your location and vehicle details, then confirm your request.',
  },
  {
    q: 'How long does a mechanic take to arrive?',
    a: 'Average response time is 10–20 minutes depending on your location and available mechanics nearby.',
  },
  {
    q: 'Can I cancel a request?',
    a: 'Yes, you can cancel a request before the mechanic starts travelling. Go to Live Map and tap Cancel.',
  },
  {
    q: 'How does payment work?',
    a: 'Payment is processed after the service is completed. You can pay via saved card, wallet, or cash.',
  },
  {
    q: 'How is my rating calculated?',
    a: 'New users start with a 5.0 rating. As mechanics rate your service interactions, the rating updates accordingly.',
  },
  {
    q: 'How do I add multiple vehicles?',
    a: 'Go to Profile → My Vehicles tab and tap "Add New Vehicle". You can add up to 5 vehicles.',
  },
];

export default function HelpSupportScreen({ navigation }) {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [message, setMessage]         = useState('');

  const sendMessage = () => {
    if (!message.trim()) {
      Alert.alert('Empty Message', 'Please type your message first.');
      return;
    }
    Alert.alert('Message Sent ✅', 'Our support team will get back to you within 24 hours.');
    setMessage('');
  };

  const contactOptions = [
    { icon: 'call-outline',           color: '#10B981', label: 'Call Support',    sub: '+92 311 ROAD RESCUE', onPress: () => Linking.openURL('tel:+923111234567') },
    { icon: 'mail-outline',           color: '#3B82F6', label: 'Email Us',        sub: 'support@roadrescue.pk', onPress: () => Linking.openURL('mailto:support@roadrescue.pk') },
    { icon: 'logo-whatsapp',          color: '#25D366', label: 'WhatsApp',        sub: 'Chat instantly',        onPress: () => Linking.openURL('https://wa.me/923111234567') },
    { icon: 'globe-outline',          color: '#8B5CF6', label: 'Visit Website',   sub: 'roadrescue.pk',         onPress: () => Linking.openURL('https://roadrescue.pk') },
  ];

  return (
    <ScreenWrapper useSafeArea>
      <Header title="Help & Support" showBack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <Ionicons name="help-buoy" size={36} color="#F97316" />
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Search FAQs or contact our support team 24/7</Text>
        </View>

        {/* Contact Options */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.contactGrid}>
          {contactOptions.map((opt, i) => (
            <TouchableOpacity
              key={i} style={styles.contactCard}
              onPress={opt.onPress} activeOpacity={0.8}
            >
              <View style={[styles.contactIcon, { backgroundColor: opt.color + '18' }]}>
                <Ionicons name={opt.icon} size={22} color={opt.color} />
              </View>
              <Text style={styles.contactLabel}>{opt.label}</Text>
              <Text style={styles.contactSub}>{opt.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQS.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.faqCard, expandedFaq === i && styles.faqCardOpen]}
            onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQ, expandedFaq === i && { color: '#F97316' }]} numberOfLines={expandedFaq === i ? undefined : 1}>
                {faq.q}
              </Text>
              <Ionicons
                name={expandedFaq === i ? 'chevron-up' : 'chevron-down'}
                size={17}
                color={expandedFaq === i ? '#F97316' : '#64748B'}
              />
            </View>
            {expandedFaq === i && (
              <Text style={styles.faqA}>{faq.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Send Message */}
        <Text style={styles.sectionTitle}>Send Us a Message</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Describe your issue..."
          placeholderTextColor="#475569"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} activeOpacity={0.85}>
          <Ionicons name="send" size={17} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.sendBtnTxt}>Send Message</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.version}>RoadRescue AI • Version 2.0.0</Text>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },

  heroCard: { alignItems: 'center', backgroundColor: 'rgba(249,115,22,0.07)', borderRadius: 18, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(249,115,22,0.15)' },
  heroTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '800', marginTop: 10, marginBottom: 6 },
  heroSub: { color: '#94A3B8', fontSize: 13, textAlign: 'center' },

  sectionTitle: { color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12, marginTop: 8 },

  contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  contactCard: { width: '47.5%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  contactIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  contactLabel: { color: '#F8FAFC', fontSize: 14, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  contactSub: { color: '#64748B', fontSize: 11, textAlign: 'center' },

  faqCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  faqCardOpen: { borderColor: 'rgba(249,115,22,0.25)', backgroundColor: 'rgba(249,115,22,0.05)' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ: { color: '#F8FAFC', fontSize: 14, fontWeight: '600', flex: 1, marginRight: 10 },
  faqA: { color: '#94A3B8', fontSize: 13, lineHeight: 20, marginTop: 10 },

  messageInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14, color: '#F8FAFC', fontSize: 14, minHeight: 110, marginBottom: 12 },
  sendBtn: { flexDirection: 'row', backgroundColor: '#F97316', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  sendBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  version: { color: '#334155', fontSize: 12, textAlign: 'center' },
});
