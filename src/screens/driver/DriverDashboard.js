import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { colors, typography, spacing, borderRadius } from '../../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';

export default function DriverDashboard({ navigation }) {
  const { user, logout } = useAuth();

  return (
    <ScreenWrapper useSafeArea={true}>
      {/* Premium Dark Glassmorphic Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.fullName || 'Driver'} 👋</Text>
          <Text style={styles.subGreeting}>Need assistance today?</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Active Rescue Tracking Panel */}
        <Card style={styles.activeRequestCard}>
          <View style={styles.activeCardHeader}>
            <View style={styles.pulseContainer}>
              <View style={styles.pulseDot} />
              <View style={styles.pulseRing} />
            </View>
            <Text style={styles.activeCardTitle}>Active Rescue Request</Text>
          </View>
          
          <View style={styles.trackerDetails}>
            <View style={styles.trackerRow}>
              <Ionicons name="construct-outline" size={18} color={colors.primary} />
              <Text style={styles.trackerText}>
                Mechanic: <Text style={styles.boldText}>Mike's Auto Repair</Text>
              </Text>
            </View>
            <View style={styles.trackerRow}>
              <Ionicons name="time-outline" size={18} color="#10B981" />
              <Text style={styles.trackerText}>
                Status: <Text style={[styles.boldText, { color: '#10B981' }]}>On the way (ETA 5 mins)</Text>
              </Text>
            </View>
          </View>

          <View style={styles.activeActionsRow}>
            <TouchableOpacity 
              style={[styles.actionBtnSecondary, { marginRight: 10 }]}
              onPress={() => navigation.navigate('Chat')}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnSecondaryText}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionBtnPrimary}
              onPress={() => navigation.navigate('LiveTracking')}
              activeOpacity={0.8}
            >
              <Ionicons name="map" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnPrimaryText}>Live Map</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Services Dispatch Section */}
        <Text style={styles.sectionTitle}>Request Assistance</Text>
        <View style={styles.servicesGrid}>
          {[
            { id: 1, title: 'Tow Truck', icon: 'car-sport', color: '#3B82F6', desc: 'Flatbed towing' },
            { id: 2, title: 'Flat Tire', icon: 'disc', color: '#10B981', desc: 'Tire replacement' },
            { id: 3, title: 'Battery', icon: 'battery-charging', color: '#F59E0B', desc: 'Jumpstart & swap' },
            { id: 4, title: 'Lockout', icon: 'key', color: '#EF4444', desc: 'Key retrieval' },
            { id: 5, title: 'Fuel Delivery', icon: 'water', color: '#8B5CF6', desc: 'Gas top-up' },
            { id: 6, title: 'AI Diagnosis', icon: 'hardware-chip', color: colors.primary, desc: 'Smart scan' },
          ].map(service => (
            <TouchableOpacity 
              key={service.id} 
              style={styles.serviceItem}
              onPress={() => {
                if (service.title === 'AI Diagnosis') {
                  navigation.navigate('AIDiagnosis');
                } else {
                  navigation.navigate('CreateRequest', { serviceType: service.title });
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: service.color + '15' }]}>
                <Ionicons name={service.icon} size={28} color={service.color} />
              </View>
              <Text style={styles.serviceText}>{service.title}</Text>
              <Text style={styles.serviceSubText}>{service.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dynamic Navigation Control Modules */}
        <Text style={styles.sectionTitle}>Control Hub & Utilities</Text>
        <View style={styles.modulesGrid}>
          {[
            { 
              title: 'Live Map & Tracking', 
              desc: 'View active directions, route maps & live mechanic location tracker', 
              icon: 'map-outline', 
              color: '#3B82F6', 
              target: 'LiveTracking' 
            },
            { 
              title: 'Chat Messenger', 
              desc: 'Instant chats, image sharing & status logs with support and mechanics', 
              icon: 'chatbubbles-outline', 
              color: '#10B981', 
              target: 'Chat' 
            },
            { 
              title: 'Payment & Wallet', 
              desc: 'Configure cards, view pricing plans & transaction receipt logs', 
              icon: 'wallet-outline', 
              color: '#F59E0B', 
              target: 'Payment' 
            },
            { 
              title: 'Feedback & Reviews', 
              desc: 'Rate completed services, leave reviews & recommend improvements', 
              icon: 'star-outline', 
              color: '#EF4444', 
              target: 'Feedback' 
            },
            { 
              title: 'Service History Logs', 
              desc: 'Track and review past invoices, request lists & breakdown types', 
              icon: 'time-outline', 
              color: '#8B5CF6', 
              target: 'History' 
            },
          ].map((mod, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.moduleCard}
              onPress={() => navigation.navigate(mod.target)}
              activeOpacity={0.7}
            >
              <View style={[styles.moduleIconWrapper, { backgroundColor: mod.color + '15' }]}>
                <Ionicons name={mod.icon} size={22} color={mod.color} />
              </View>
              <View style={styles.moduleMeta}>
                <Text style={styles.moduleTitle}>{mod.title}</Text>
                <Text style={styles.moduleDesc} numberOfLines={2}>{mod.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: '#0F172A',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  subGreeting: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 3,
  },
  logoutBtn: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: 10,
    backgroundColor: '#0F172A',
  },
  activeRequestCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    marginBottom: spacing.xl,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  pulseContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
    zIndex: 1,
  },
  activeCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF7A00',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trackerDetails: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  trackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  trackerText: {
    color: '#E2E8F0',
    fontSize: 14,
    marginLeft: 10,
  },
  boldText: {
    fontWeight: '700',
    color: '#FFF',
  },
  activeActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#FF7A00',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnPrimaryText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 122, 0, 0.3)',
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnSecondaryText: {
    color: '#FF7A00',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 14,
    marginTop: 5,
    letterSpacing: 0.5,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: 10,
  },
  serviceItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  serviceSubText: {
    color: '#64748B',
    fontSize: 10.5,
    textAlign: 'center',
  },
  modulesGrid: {
    gap: 10,
    marginBottom: spacing.xxl,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  moduleIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  moduleMeta: {
    flex: 1,
  },
  moduleTitle: {
    color: '#FFF',
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  moduleDesc: {
    color: '#64748B',
    fontSize: 11.5,
    lineHeight: 15,
  },
});
