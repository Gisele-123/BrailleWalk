import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shield, ArrowLeft } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { speak } from '../../utils/voice';
import { useRouter } from 'expo-router';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useNavigationContext } from '../../context/NavigationContext';
import { useAnnounceScreen } from '../../hooks/useAnnounceScreen';

// Remove this constant since we're using navigation context

export default function EmergencyActivatedScreen() {
  useAnnounceScreen('emergency-activated');
  const router = useRouter();
  const { transcript, resetTranscript, startListening } = useSpeechRecognition();
  const hasSpoken = useRef(false);

  // Initial announcements are handled by useAnnounceScreen.

  useEffect(() => {
    if (!transcript) return;
    const text = transcript.toLowerCase();
    const handleAndReset = (fn: () => void) => { fn(); resetTranscript(); };
    if (text.includes('repeat')) {
      handleAndReset(() => speak(getScreenInstructions('emergency-activated')));
      return;
    }
    if (text.includes('read') || text.includes('read screen')) {
      handleAndReset(() => speak('Emergency active screen. Your contacts have been notified. One button to go back to the emergency page.'));
      return;
    }
    if (text.includes('back')) {
      handleAndReset(() => router.replace('/(tabs)/emergency'));
      return;
    }
  }, [transcript]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Shield size={64} color="#FF4444" />
        <Text style={styles.title}>Emergency Mode Active</Text>
      </View>
      <Text style={styles.infoText}>
        Your emergency contacts have been notified and your location has been shared. Remain calm and wait for assistance.
      </Text>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace('/(tabs)/emergency')}
        accessible={true}
        accessibilityLabel="Return to Emergency screen"
        accessibilityRole="button"
      >
        <ArrowLeft size={24} color="#000000" />
        <Text style={styles.backButtonText}>Back to Emergency</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: '#FF4444',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  backButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
