import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { TriangleAlert as AlertTriangle, Phone, MapPin, Volume2, UserPlus, Shield } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

const EMERGENCY_INSTRUCTIONS = 'Emergency features ready. Triple tap the red emergency button to activate emergency mode.';

export default function EmergencyScreen() {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: '1', name: 'Sarah Mutesi', phone: '+250 798 384 666', relationship: 'Sister' },
    { id: '2', name: 'Dr. Michael Kaburinda', phone: '+250 788 748 410', relationship: 'Doctor' },
    { id: '3', name: 'Emergency Services', phone: '911', relationship: 'Emergency' },
  ]);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { transcript, resetTranscript, startListening } = useSpeechRecognition();
  const hasSpoken = useRef(false);

  useEffect(() => {
    if (!hasSpoken.current) {
      Speech.speak(EMERGENCY_INSTRUCTIONS);
      Speech.speak('You can say emergency to activate, or say cancel to stop the countdown.');
      hasSpoken.current = true;
      startListening();
    }
  }, []);

  useEffect(() => {
    if (!transcript) return;
    const text = transcript.toLowerCase();
    const handleAndReset = (fn: () => void) => { fn(); resetTranscript(); };
    if (text.includes('repeat')) {
      handleAndReset(() => Speech.speak(EMERGENCY_INSTRUCTIONS));
      return;
    }
    if (text.includes('emergency')) {
      handleAndReset(() => startEmergencyCountdown());
      return;
    }
    if (text.includes('cancel')) {
      handleAndReset(() => cancelEmergency());
      return;
    }
    if (text.includes('read screen')) {
      handleAndReset(() => Speech.speak('Emergency screen. Large red emergency button in the center. Quick actions for share location and instructions. List of emergency contacts below.'));
      return;
    }
  }, [transcript]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (isEmergencyActive && countdown === 0) {
      activateEmergencyMode();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, isEmergencyActive]);

  const startEmergencyCountdown = () => {
    if (isEmergencyActive) return;
    
    setCountdown(5);
    setIsEmergencyActive(true);
    Speech.speak('Emergency mode activating in 5 seconds. Tap cancel to stop.');
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const cancelEmergency = () => {
    setIsEmergencyActive(false);
    setCountdown(0);
    Speech.speak('Emergency mode cancelled.');
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const activateEmergencyMode = () => {
    Speech.speak('Emergency mode activated. Sharing your location with emergency contacts and activating audio beacon. Moving to emergency page, please wait...');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/(tabs)/emergency-activated');
    }, 2500); // Slow transition (2.5s)
    
    if (Platform.OS !== 'web') {
      // Continuous haptic feedback pattern
      const hapticPattern = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 1000);
      
      setTimeout(() => clearInterval(hapticPattern), 10000);
    }
  };

  const callContact = (contact: EmergencyContact) => {
    Speech.speak(`Calling ${contact.name}`);
    // In a real app, this would trigger a phone call
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const shareLocation = () => {
    Speech.speak('Sharing your current location with emergency contacts.');
    // Simulate location sharing
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const renderContact = ({ item }: { item: EmergencyContact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => callContact(item)}
      accessible={true}
      accessibilityLabel={`Call ${item.name}, ${item.relationship}`}
      accessibilityRole="button"
    >
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactRelationship}>{item.relationship}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
      </View>
      <Phone size={24} color="#FFD700" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={{ color: '#FFD700', marginTop: 24, fontSize: 20 }}>Moving to Emergency Page...</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <AlertTriangle size={32} color="#FF4444" />
            <Text style={styles.title}>Emergency</Text>
          </View>

          {isEmergencyActive && countdown > 0 && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>Activating in {countdown}</Text>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelEmergency}
                accessible={true}
                accessibilityLabel="Cancel emergency activation"
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.emergencyButtonContainer}>
            <TouchableOpacity
              style={[styles.emergencyButton, { opacity: isEmergencyActive ? 0.7 : 1 }]}
              onPress={startEmergencyCountdown}
              disabled={isEmergencyActive}
              accessible={true}
              accessibilityLabel="Emergency activation button"
              accessibilityHint="Triple tap to activate emergency mode"
              accessibilityRole="button"
            >
              <Shield size={48} color="#FFFFFF" />
              <Text style={styles.emergencyButtonText}>
                {isEmergencyActive ? 'ACTIVATING...' : 'EMERGENCY'}
              </Text>
              <Text style={styles.emergencySubtext}>Triple Tap</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={shareLocation}
              accessible={true}
              accessibilityLabel="Share current location"
              accessibilityRole="button"
            >
              <MapPin size={28} color="#000000" />
              <Text style={styles.quickActionText}>Share Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => Speech.speak('Emergency features: Tap the red emergency button to activate emergency mode. Use quick actions to share location or repeat instructions.')}
              accessible={true}
              accessibilityLabel="Get help with emergency features"
              accessibilityRole="button"
            >
              <Volume2 size={28} color="#000000" />
              <Text style={styles.quickActionText}>Instructions</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactsContainer}>
            <Text style={styles.contactsTitle}>Emergency Contacts</Text>
            <FlatList
              data={emergencyContacts}
              renderItem={renderContact}
              keyExtractor={(item) => item.id}
              style={styles.contactsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  emergencyButtonContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  emergencyButton: {
    backgroundColor: '#FF4444',
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  emergencySubtext: {
    color: '#FFCCCC',
    fontSize: 14,
    marginTop: 4,
  },
  countdownContainer: {
    backgroundColor: '#FF4444',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  quickActionButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 0.45,
  },
  quickActionText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  contactsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contactsTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactRelationship: {
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  statusBar: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});