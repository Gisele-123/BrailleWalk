import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { stopSpeaking, speakAndWait } from '../utils/voice';
import { useNavigationContext } from '../context/NavigationContext';
import { ScreenType } from '../context/NavigationContext';
import { useSpeechRecognition } from './useSpeechRecognition';

// Announce the given screen immediately upon focus.
// - Stops any ongoing TTS
// - Resets any partial transcripts
// - Announces the screen name and its instructions
// - Records the current screen into NavigationContext
export function useAnnounceScreen(screen: ScreenType) {
  const { getScreenInstructions, setCurrentScreen } = useNavigationContext();
  const { resetTranscript, startListening, isListening } = useSpeechRecognition();

  useFocusEffect(
    useCallback(() => {
      // Mark screen first so other listeners know we're here
      setCurrentScreen(screen);

      // Clear any partial commands and interrupt any speech
      resetTranscript();
      stopSpeaking();
      const instructions = getScreenInstructions(screen);
      // Small, consistent pause (250ms) before speaking, to avoid overlap and rushing
      setTimeout(async () => {
        // Speak and then ensure listening is active
        await speakAndWait(instructions);
        // Short grace period, then start listening if not already
        setTimeout(() => {
          if (!isListening) {
            startListening();
          }
        }, 150);
      }, 250);

      // Also stop speaking on blur to prevent carry-over
      return () => {
        stopSpeaking();
      };
    }, [screen, getScreenInstructions, setCurrentScreen, resetTranscript])
  );
}


