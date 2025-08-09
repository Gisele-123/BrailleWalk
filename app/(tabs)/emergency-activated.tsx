import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shield, ArrowLeft } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

const EMERGENCY_INSTRUCTIONS = 'Emergency mode is now active. Your location has been shared. Stay calm, help is on the way.';

export default function EmergencyActivatedScreen() {
  const router = useRouter();
  const { transcript, resetTranscript } = useSpeechRecognition();
  const hasSpoken = useRef(false);

  useEffect(() => {
    if (!hasSpoken.current) {
      Speech.speak(EMERGENCY_INSTRUCTIONS);
      hasSpoken.current = true;
    }
  }, []);

  useEffect(() => {
    if (transcript && transcript.toLowerCase().includes('repeat')) {
      Speech.speak(EMERGENCY_INSTRUCTIONS);
      resetTranscript();
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
