import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import { speak } from '../../utils/voice';
import * as Haptics from 'expo-haptics';
import { Navigation, MapPin, Mic, MicOff, Play, Square, Volume2 } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { navigationService, NavigationRoute, NavigationStep } from '../../utils/navigation';
import { useAnnounceScreen } from '../../hooks/useAnnounceScreen';
import { useVoiceContext } from '../../context/VoiceContext';
import PushToTalk from '../../components/PushToTalk';

// Remove this interface since we're importing it from navigation.ts

// Remove this constant since we're using navigation context

export default function NavigateScreen() {
  useAnnounceScreen('navigation');
  const { hasMicPermission, requestMicPermission } = useVoiceContext();
  const [destination, setDestination] = useState('');
  const [awaitingDestination, setAwaitingDestination] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [navigationRoute, setNavigationRoute] = useState<NavigationRoute | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const { transcript, resetTranscript, startListening, stopListening } = useSpeechRecognition();

  // Initial announcements are handled by useAnnounceScreen.

  useEffect(() => {
    if (!transcript) return;
    const text = transcript.toLowerCase();
    const handleAndReset = (fn: () => void) => { fn(); resetTranscript(); };
    if (text.includes('repeat')) {
      handleAndReset(() => speak(getScreenInstructions('navigation')));
      return;
    }
    if (text.includes('read') || text.includes('read screen')) {
      handleAndReset(() => speak('Navigation screen. Destination field and buttons for start, stop, and repeat. Say go to speak your destination. Say stop to cancel.'));
      return;
    }
    if (text.includes('go')) {
      setAwaitingDestination(true);
      handleAndReset(() => speak('Please say your destination.'));
      return;
    }
    if (awaitingDestination) {
      const dest = text.trim();
      if (dest) {
        setAwaitingDestination(false);
        speak(`Destination ${dest}. Starting navigation.`);
        setDestination(dest);
        handleAndReset(() => startNavigation());
      }
      return;
    }
    if (text.includes('stop navigation') || text.includes('stop')) {
      handleAndReset(() => stopNavigation());
      return;
    }
    if (text.includes('repeat step') || text.includes('repeat instruction')) {
      handleAndReset(() => repeatCurrentStep());
      return;
    }
  }, [transcript]);

  const getCurrentLocation = async () => {
    try {
      const location = await navigationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(`Lat: ${location.latitude.toFixed(4)}, Lon: ${location.longitude.toFixed(4)}`);
        speak(`Current location obtained. Ready for navigation.`);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      speak('Unable to get current location.');
    }
  };

  const startNavigation = async () => {
    if (!destination.trim()) {
      speak('Please enter a destination first.');
      return;
    }

    speak('Calculating route to ' + destination + '. Please wait.');
    
    try {
      const route = await navigationService.getNavigationRoute(destination);
      if (!route) {
        speak('Unable to calculate route to ' + destination + '. Please try again.');
        return;
      }

      setNavigationRoute(route);
      setIsNavigating(true);
      setCurrentStep(0);
      
      // Start location tracking for real-time updates
      await navigationService.startLocationTracking();
      
      speak(route.steps[0].instruction);
      triggerHapticFeedback(route.steps[0].hapticPattern);

      // Simulate step progression (in real app, this would be based on actual location updates)
      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        stepIndex++;
        if (stepIndex < route.steps.length) {
          setCurrentStep(stepIndex);
          speak(route.steps[stepIndex].instruction);
          triggerHapticFeedback(route.steps[stepIndex].hapticPattern);
        } else {
          setIsNavigating(false);
          navigationService.stopLocationTracking();
          clearInterval(progressInterval);
          speak('Navigation complete. You have arrived at your destination.');
        }
      }, 5000);
    } catch (error) {
      console.error('Error starting navigation:', error);
      speak('Error starting navigation. Please try again.');
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setCurrentStep(0);
    navigationService.stopLocationTracking();
    speak('Navigation stopped.');
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
    if (isNavigating && navigationRoute && navigationRoute.steps[currentStep]) {
      speak(navigationRoute.steps[currentStep].instruction);
      triggerHapticFeedback(navigationRoute.steps[currentStep].hapticPattern);
    } else {
      speak('No active navigation. Set a destination to begin.');
    }
  };

  return (
    <View style={styles.container}>
      {!hasMicPermission && (
        <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: '#FFD700' }]}
            onPress={requestMicPermission}
            accessible={true}
            accessibilityLabel="Grant microphone permission"
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryButtonText, { color: '#000' }]}>Enable Microphone</Text>
          </TouchableOpacity>
        </View>
      )}
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
        
        {currentLocation && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Current Location:</Text>
            <Text style={styles.locationText}>{currentLocation}</Text>
          </View>
        )}
      </View>

      {isNavigating && navigationRoute && (
        <View style={styles.navigationContainer}>
          <Text style={styles.currentStepText}>Current Step:</Text>
          <Text style={styles.instructionText}>
            {navigationRoute.steps[currentStep]?.instruction}
          </Text>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {navigationRoute.steps.length}
          </Text>
          <Text style={styles.routeInfoText}>
            Total: {navigationRoute.totalDistance} feet • ~{Math.round(navigationRoute.totalTime / 60)} min
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
            if (isListening) {
              speak('Voice input disabled');
              stopListening();
            } else {
              speak('Voice input enabled. Say your destination.');
              startListening();
            }
            setIsListening(!isListening);
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

        <TouchableOpacity
          style={styles.locationButton}
          onPress={getCurrentLocation}
          accessible={true}
          accessibilityLabel="Get current location"
          accessibilityRole="button"
        >
          <MapPin size={24} color="#000000" />
          <Text style={styles.locationButtonText}>Location</Text>
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
  routeInfoText: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 8,
  },
  locationContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  locationLabel: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
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
  locationButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  locationButtonText: {
    color: '#000000',
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