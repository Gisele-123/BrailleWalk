import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Camera, UserCheck, Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const ONBOARDING_INSTRUCTIONS = [
  'Welcome to BrailleWalk.',
  'We need to set up facial recognition for security.',
  'Tap anywhere to begin camera setup.'
];

export default function OnboardingScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const { transcript, resetTranscript } = useSpeechRecognition();
  const hasSpoken = useRef(false);

  async function speakInstructions() {
    for (const line of ONBOARDING_INSTRUCTIONS) {
      Speech.speak(line);
      await sleep(1200 + line.length * 20);
    }
  }

  useEffect(() => {
    if (!hasSpoken.current) {
      speakInstructions();
      hasSpoken.current = true;
    }
  }, []);

  useEffect(() => {
    if (transcript && transcript.toLowerCase().includes('repeat')) {
      speakInstructions();
      resetTranscript();
    }
  }, [transcript]);

  const handleCameraSetup = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Speech.speak('Camera permission is required for BrailleWalk to function. Please enable camera access in settings.');
        return;
      }
    }
    setIsScanning(true);
    // Speak with pauses to allow user to prepare
    async function speakScanInstructions() {
      Speech.speak('Hold your device at arm\'s length and look directly at the camera.');
      await sleep(2500);
      Speech.speak('Scanning will begin automatically. Please hold still.');
      await sleep(2500);
      // Simulate facial recognition process
      setTimeout(() => {
        setScanComplete(true);
        setIsScanning(false);
        Speech.speak('Facial recognition setup complete. You can now use BrailleWalk securely.');
      }, 2000);
    }
    speakScanInstructions();
  };

  const handleContinue = () => {
    Speech.speak('Entering BrailleWalk main interface.');
    router.replace('/(tabs)');
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading camera permissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Volume2 size={48} color="#FFD700" />
          <Text style={styles.title}>BrailleWalk</Text>
          <Text style={styles.subtitle}>AI-Powered Accessibility Assistant</Text>
        </View>

        {!isScanning && !scanComplete && (
          <TouchableOpacity 
            style={styles.setupContainer}
            onPress={handleCameraSetup}
            accessible={true}
            accessibilityLabel="Tap to begin facial recognition setup"
            accessibilityRole="button"
          >
            <View style={styles.setupContent}>
              <Camera size={64} color="#FFD700" />
              <Text style={styles.instructionText}>
                Tap anywhere to set up secure facial recognition
              </Text>
              <Text style={styles.descriptionText}>
                No passwords needed. Your face is your key.
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {isScanning && (
            <View style={styles.cameraContainer}>
              <CameraView style={styles.camera} facing="front">
                <View style={styles.scanOverlay}>
                  <View style={styles.scanFrame} />
                  <Text style={styles.scanText}>Scanning your face...</Text>
                </View>
              </CameraView>
            </View>
        )}

        {scanComplete && (
            <View style={styles.completeContainer}>
              <UserCheck size={64} color="#00AA00" />
              <Text style={styles.completeText}>Setup Complete!</Text>
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={handleContinue}
                accessible={true}
                accessibilityLabel="Continue to main app"
                accessibilityRole="button"
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFD700',
    marginTop: 8,
    textAlign: 'center',
  },
  setupContainer: {
    alignItems: 'center',
    padding: 24,
  },
  setupContent: {
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 16,
  },
  cameraContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 3,
    borderColor: '#FFD700',
    borderRadius: 100,
    borderStyle: 'dashed',
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  completeContainer: {
    alignItems: 'center',
  },
  completeText: {
    fontSize: 28,
    color: '#00AA00',
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 48,
    paddingVertical: 20,
    borderRadius: 16,
    marginTop: 32,
    minWidth: 200,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
  },
});