import { useState } from 'react';
import * as Speech from 'expo-speech';
import { speak } from '../utils/voice';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

interface EmergencyModeHook {
  isEmergencyActive: boolean;
  activateEmergency: () => void;
  deactivateEmergency: () => void;
  shareLocation: () => void;
  callEmergencyContact: (contact: EmergencyContact) => void;
  playAudioBeacon: () => void;
}

export function useEmergencyMode(): EmergencyModeHook {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  const activateEmergency = () => {
    setIsEmergencyActive(true);
    
    // Announce emergency activation
    speak('Emergency mode activated. Broadcasting distress signal and sharing location.');
    
    // Continuous haptic pattern
    if (Platform.OS !== 'web') {
      const hapticPattern = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 1000);
      
      // Stop after 30 seconds
      setTimeout(() => clearInterval(hapticPattern), 30000);
    }

    // Auto-share location and contact emergency contacts
    shareLocation();
    playAudioBeacon();
  };

  const deactivateEmergency = () => {
    setIsEmergencyActive(false);
    speak('Emergency mode deactivated.');
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const shareLocation = () => {
    // Simulate location sharing
    speak('Your location has been shared with your emergency contacts.');
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const callEmergencyContact = (contact: EmergencyContact) => {
    speak(`Calling ${contact.name}`);
    // In a real app, this would initiate a phone call
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const playAudioBeacon = () => {
    // Play a loud, distinctive audio beacon
    const beaconMessage = 'Help needed! This is an emergency alert from BrailleWalk. My location has been shared with my emergency contacts.';
    
    // Repeat the beacon message multiple times
    speak(beaconMessage);
    setTimeout(() => speak(beaconMessage), 5000);
    setTimeout(() => speak(beaconMessage), 10000);
  };

  return {
    isEmergencyActive,
    activateEmergency,
    deactivateEmergency,
    shareLocation,
    callEmergencyContact,
    playAudioBeacon,
  };
}