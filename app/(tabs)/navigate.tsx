import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Navigation, MapPin, Mic, MicOff, Play, Square, Volume2 } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface NavigationStep {
  instruction: string;
  distance: string;
  direction: 'straight' | 'left' | 'right';
  hapticPattern: 'light' | 'medium' | 'heavy';
}

const NAVIGATION_INSTRUCTIONS = 'GPS Navigation ready. Enter a destination or say "navigate to" followed by your destination.';

export default function NavigateScreen() {
  const [destination, setDestination] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([]);
  const { transcript, resetTranscript } = useSpeechRecognition();
  const hasSpoken = useRef(false);

  useEffect(() => {
    if (!hasSpoken.current) {
      Speech.speak(NAVIGATION_INSTRUCTIONS);
      hasSpoken.current = true;
    }
  }, []);

  useEffect(() => {
    if (transcript && transcript.toLowerCase().includes('repeat')) {
      Speech.speak(NAVIGATION_INSTRUCTIONS);
      resetTranscript();
    }
  }, [transcript]);

  const generateNavigationSteps = (dest: string): NavigationStep[] => {
    // Simulate navigation steps
    return [
      { instruction: `Starting navigation to ${dest}`, distance: '', direction: 'straight', hapticPattern: 'medium' },
      { instruction: 'Head straight for 50 feet', distance: '50 feet', direction: 'straight', hapticPattern: 'light' },
      { instruction: 'Turn right in 10 feet', distance: '10 feet', direction: 'right', hapticPattern: 'heavy' },
      { instruction: 'Continue straight for 100 feet', distance: '100 feet', direction: 'straight', hapticPattern: 'light' },
      { instruction: 'Turn left in 15 feet', distance: '15 feet', direction: 'left', hapticPattern: 'heavy' },
      { instruction: 'Destination ahead on your right', distance: '20 feet', direction: 'right', hapticPattern: 'medium' },
      { instruction: `You have arrived at ${dest}`, distance: '', direction: 'straight', hapticPattern: 'medium' },
    ];
  };

  const startNavigation = () => {
    if (!destination.trim()) {
      Speech.speak('Please enter a destination first.');
      return;
    }

    const steps = generateNavigationSteps(destination);
    setNavigationSteps(steps);
    setIsNavigating(true);
    setCurrentStep(0);
    
    Speech.speak(steps[0].instruction);
    triggerHapticFeedback(steps[0].hapticPattern);

    // Simulate step progression
    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setCurrentStep(stepIndex);
        Speech.speak(steps[stepIndex].instruction);
        triggerHapticFeedback(steps[stepIndex].hapticPattern);
      } else {
        setIsNavigating(false);
        clearInterval(progressInterval);
        Speech.speak('Navigation complete. You have arrived at your destination.');
      }
    }, 5000);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setCurrentStep(0);
    Speech.speak('Navigation stopped.');
    triggerHapticFeedback('light');
  };

  const triggerHapticFeedback = (pattern: 'light' | 'medium' | 'heavy') => {
    if (Platform.OS === 'web') return;
    
    switch (pattern) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  };

  const repeatCurrentStep = () => {
    if (isNavigating && navigationSteps[currentStep]) {
      Speech.speak(navigationSteps[currentStep].instruction);
      triggerHapticFeedback(navigationSteps[currentStep].hapticPattern);
    } else {
      Speech.speak('No active navigation. Set a destination to begin.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Navigation size={32} color="#FFD700" />
        <Text style={styles.title}>GPS Navigation</Text>
      </View>

      <View style={styles.destinationContainer}>
        <Text style={styles.label}>Destination</Text>
        <TextInput
          style={styles.input}
          value={destination}
          onChangeText={setDestination}
          placeholder="Where would you like to go?"
          placeholderTextColor="#666666"
          accessible={true}
          accessibilityLabel="Enter destination"
          accessibilityHint="Type your destination or use voice input"
        />
      </View>

      {isNavigating && (
        <View style={styles.navigationContainer}>
          <Text style={styles.currentStepText}>Current Step:</Text>
          <Text style={styles.instructionText}>
            {navigationSteps[currentStep]?.instruction}
          </Text>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {navigationSteps.length}
          </Text>
        </View>
      )}

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={repeatCurrentStep}
          accessible={true}
          accessibilityLabel="Repeat current navigation instruction"
          accessibilityRole="button"
        >
          <Volume2 size={24} color="#000000" />
          <Text style={styles.secondaryButtonText}>Repeat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: isNavigating ? '#FF4444' : '#FFD700' }]}
          onPress={isNavigating ? stopNavigation : startNavigation}
          accessible={true}
          accessibilityLabel={isNavigating ? 'Stop navigation' : 'Start navigation'}
          accessibilityRole="button"
        >
          {isNavigating ? (
            <Square size={32} color="#FFFFFF" />
          ) : (
            <Play size={32} color="#000000" />
          )}
          <Text style={[styles.mainButtonText, { color: isNavigating ? '#FFFFFF' : '#000000' }]}>
            {isNavigating ? 'Stop' : 'Navigate'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.voiceButton, { backgroundColor: isListening ? '#00AA00' : '#333333' }]}
          onPress={() => {
            setIsListening(!isListening);
            Speech.speak(isListening ? 'Voice input disabled' : 'Voice input enabled. Say your destination.');
          }}
          accessible={true}
          accessibilityLabel={isListening ? 'Disable voice input' : 'Enable voice input'}
          accessibilityRole="button"
        >
          {isListening ? (
            <Mic size={24} color="#FFFFFF" />
          ) : (
            <MicOff size={24} color="#FFFFFF" />
          )}
          <Text style={styles.voiceButtonText}>Voice</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {isNavigating ? 'Navigation Active' : 'Ready to Navigate'}
        </Text>
      </View>
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
  destinationContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    color: '#000000',
    minHeight: 60,
  },
  navigationContainer: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  currentStepText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  mainButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  voiceButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  voiceButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  statusBar: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});