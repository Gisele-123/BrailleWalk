import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useVoiceContext } from '../context/VoiceContext';

let Voice: any;
if (Platform.OS !== 'web') {
  try {
    // Lazy require to avoid web bundling issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Voice = require('@react-native-voice/voice').default || require('@react-native-voice/voice');
  } catch (e) {
    Voice = null;
  }
}

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => Promise<void> | void;
  stopListening: () => Promise<void> | void;
  resetTranscript: () => void;
  isConfirming: boolean;
  confirmCommand: (confirmed: boolean) => void;
}

declare global {
  // Minimal web speech types to avoid TS errors
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useVoiceContext();
  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isConfirming: false,
    confirmCommand: () => {},
  };
}