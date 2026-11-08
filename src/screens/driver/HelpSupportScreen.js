import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Linking,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Header } from '../../components/Header';
import Ionicons from '@expo/vector-icons/Ionicons';

const FAQS = [
  {
    id: 'request-assistance',
    category: 'Service Requests',
    q: 'How do I request roadside assistance?',
    a: 'Go to the Dashboard and tap on the service you need (Tow Truck, Flat Tire, Battery, etc.). Fill in your location and vehicle details, then confirm your request.',
  },
  {
    id: 'mechanic-arrival',
    category: 'Mechanics',
    q: 'How long does a mechanic take to arrive?',
    a: 'Average response time is 10–20 minutes depending on your location and available mechanics nearby.',
  },
  {
    id: 'cancel-request',
    category: 'Service Requests',
    q: 'Can I cancel a request?',
    a: 'Yes, you can cancel a request before the mechanic starts travelling. Go to Live Map and tap Cancel.',
  },
  {
    id: 'payment-method',
    category: 'Payments & Security Fee',
    q: 'How does payment work?',
    a: 'Cash is the available payment method. Pay the service charges and any applicable security fee after the service. The final amounts will be shown when pricing details are available.',
  },
  {
    id: 'rating',
    category: 'Account & Profile',
    q: 'How is my rating calculated?',
    a: 'New users start with a 5.0 rating. As mechanics rate your service interactions, the rating updates accordingly.',
  },
  {
    id: 'vehicles',
    category: 'Account & Profile',
    q: 'How do I add multiple vehicles?',
    a: 'Go to Profile → My Vehicles tab and tap "Add New Vehicle". You can add up to 5 vehicles.',
  },
  {
    id: 'update-profile',
    category: 'Account & Profile',
    q: 'How can I update my profile?',
    a: 'Open the Profile tab and choose Edit Profile to update the name and phone number shown in your profile.',
  },
  {
    id: 'security-fee',
    category: 'Payments & Security Fee',
    q: 'What is the security fee?',
    a: 'Any applicable security fee will be shown separately from service charges. Its amount and calculation depend on the pricing details provided for the service.',
  },
  {
    id: 'choose-mechanic',
    category: 'Mechanics',
    q: 'How do I know which mechanic accepted my request?',
    a: 'When a mechanic accepts your request, check the request details or live tracking screen for the available mechanic and service updates.',
  },
  {
    id: 'ai-diagnosis',
    category: 'AI Diagnosis',
    q: 'How does AI vehicle diagnosis work?',
    a: 'Choose AI Diagnosis and follow the on-screen instructions to submit the available vehicle information. Use the result as guidance and contact a mechanic for help with repairs.',
  },
];

const FAQ_CATEGORIES = [
  'All',
  'Account & Profile',
  'Service Requests',
  'Payments & Security Fee',
  'Mechanics',
  'AI Diagnosis',
];

export default function HelpSupportScreen({ navigation }) {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [message, setMessage] = useState('');
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState('All');
  const [messageFeedback, setMessageFeedback] = useState('');

  const filteredFaqs = useMemo(() => {
    const query = faqSearch.trim().toLowerCase();
    return FAQS.filter((faq) => {
      const matchesCategory = faqCategory === 'All' || faq.category === faqCategory;
      const matchesSearch = !query || `${faq.q} ${faq.a} ${faq.category}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [faqCategory, faqSearch]);

  const sendMessage = () => {
    if (!message.trim()) {
      setMessageFeedback('Please enter a message before continuing.');
      return;
    }
    setMessageFeedback(
      'Your message is ready, but has not been sent. Support messaging is not connected yet.'
    );
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

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => navigation.navigate('HomeStack', { screen: 'CreateRequest' })}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <View style={styles.emergencyIcon}>
            <Ionicons name="car-outline" size={21} color="#FFFFFF" />
          </View>
          <View style={styles.emergencyCopy}>
            <Text style={styles.emergencyTitle}>Emergency Roadside Assistance</Text>
            <Text style={styles.emergencySub}>Create a service request</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

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
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search questions..."
            placeholderTextColor="#64748B"
            value={faqSearch}
            onChangeText={(text) => {
              setFaqSearch(text);
              setExpandedFaq(null);
            }}
            returnKeyType="search"
            accessibilityLabel="Search FAQs"
          />
          {faqSearch ? (
            <TouchableOpacity
              onPress={() => { setFaqSearch(''); setExpandedFaq(null); }}
              accessibilityRole="button"
              accessibilityLabel="Clear FAQ search"
            >
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.faqCategories}
        >
          {FAQ_CATEGORIES.map((category) => {
            const selected = faqCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[styles.faqCategory, selected && styles.faqCategoryActive]}
                onPress={() => { setFaqCategory(category); setExpandedFaq(null); }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.faqCategoryText, selected && styles.faqCategoryTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {filteredFaqs.map((faq) => (
          <TouchableOpacity
            key={faq.id}
            style={[styles.faqCard, expandedFaq === faq.id && styles.faqCardOpen]}
            onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ expanded: expandedFaq === faq.id }}
            accessibilityLabel={faq.q}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQ, expandedFaq === faq.id && { color: '#F97316' }]} numberOfLines={expandedFaq === faq.id ? undefined : 2}>
                {faq.q}
              </Text>
              <Ionicons
                name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                size={17}
                color={expandedFaq === faq.id ? '#F97316' : '#64748B'}
              />
            </View>
            {expandedFaq === faq.id && (
              <Text style={styles.faqA}>{faq.a}</Text>
            )}
          </TouchableOpacity>
        ))}
        {filteredFaqs.length === 0 ? (
          <Text style={styles.noFaqs}>No FAQs match your search.</Text>
        ) : null}

        {/* Send Message */}
        <Text style={styles.sectionTitle}>Send Us a Message</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Describe your issue..."
          placeholderTextColor="#475569"
          value={message}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          accessibilityLabel="Support message"
          onChangeText={(text) => {
            setMessage(text);
            if (messageFeedback) setMessageFeedback('');
          }}
        />
        {messageFeedback ? (
          <Text accessibilityRole="alert" style={styles.messageFeedback}>
            {messageFeedback}
          </Text>
        ) : null}
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={sendMessage}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
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
  emergencyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1D4ED8', borderRadius: 14, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(249,115,22,0.45)' },
  emergencyIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  emergencyCopy: { flex: 1 },
  emergencyTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  emergencySub: { color: '#DBEAFE', fontSize: 12, marginTop: 3 },

  sectionTitle: { color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12, marginTop: 8 },

  contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  contactCard: { width: '47.5%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  contactIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  contactLabel: { color: '#F8FAFC', fontSize: 14, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  contactSub: { color: '#64748B', fontSize: 11, textAlign: 'center' },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 13, marginBottom: 12 },
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 14, paddingVertical: 12 },
  faqCategories: { gap: 8, paddingBottom: 12 },
  faqCategory: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  faqCategoryActive: { backgroundColor: 'rgba(29,78,216,0.35)', borderColor: '#3B82F6' },
  faqCategoryText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  faqCategoryTextActive: { color: '#FFFFFF' },
  faqCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  faqCardOpen: { borderColor: 'rgba(249,115,22,0.25)', backgroundColor: 'rgba(249,115,22,0.05)' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ: { color: '#F8FAFC', fontSize: 14, fontWeight: '600', flex: 1, marginRight: 10 },
  faqA: { color: '#94A3B8', fontSize: 13, lineHeight: 20, marginTop: 10 },
  noFaqs: { color: '#94A3B8', fontSize: 13, textAlign: 'center', paddingVertical: 20 },

  messageInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14, color: '#F8FAFC', fontSize: 14, minHeight: 110, marginBottom: 12 },
  messageFeedback: { color: '#93C5FD', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  sendBtn: { flexDirection: 'row', backgroundColor: '#F97316', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  sendBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  version: { color: '#334155', fontSize: 12, textAlign: 'center' },
});
