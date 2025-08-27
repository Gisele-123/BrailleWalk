import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { stopSpeaking } from '../utils/voice';

export function useScreenVoiceGuard() {
  useFocusEffect(
    useCallback(() => {
      // Stop any ongoing speech when the screen focuses
      stopSpeaking();

      // Also stop on blur/unmount to be safe
      return () => {
        stopSpeaking();
      };
    }, [])
  );
}
