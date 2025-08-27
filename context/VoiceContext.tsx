import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import * as Speech from 'expo-speech';
import { onSpeakStart, onSpeakEnd } from '../utils/voice';

type VoiceContextValue = {
  isListening: boolean;
  transcript: string;
  startListening: () => Promise<void> | void;
  stopListening: () => Promise<void> | void;
  resetTranscript: () => void;
  hasMicPermission: boolean;
  requestMicPermission: () => Promise<boolean>;
};

const VoiceContext = createContext<VoiceContextValue | undefined>(undefined);

let VoiceNative: any;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    VoiceNative = require('@react-native-voice/voice').default || require('@react-native-voice/voice');
  } catch (e) {
    VoiceNative = null;
  }
}

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasMicPermission, setHasMicPermission] = useState<boolean>(Platform.OS !== 'android');
  const webRecognitionRef = useRef<any | null>(null);
  const ttsSpeakingRef = useRef<boolean>(false);
  const startInProgressRef = useRef<boolean>(false);
  const lastStartTimestampRef = useRef<number>(0);

  const pauseRecognition = useCallback(async () => {
    if (Platform.OS === 'web') {
      try { webRecognitionRef.current?.stop?.(); } catch {}
      setIsListening(false);
    } else if (VoiceNative) {
      try { await VoiceNative.stop(); } catch {}
      setIsListening(false);
    }
  }, []);

  const resumeRecognition = useCallback(async () => {
    if (ttsSpeakingRef.current) return;
    // Debounce rapid restarts within 300ms
    const now = Date.now();
    if (now - lastStartTimestampRef.current < 300) return;
    if (startInProgressRef.current) return;
    if (isListening) return;
    await startListening();
  }, [isListening]);

  useEffect(() => {
    const unsubscribeStart = onSpeakStart(() => {
      ttsSpeakingRef.current = true;
      pauseRecognition();
    });
    const unsubscribeEnd = onSpeakEnd(() => {
      ttsSpeakingRef.current = false;
      resumeRecognition();
    });

    if (Platform.OS === 'web') {
      const RecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (RecognitionClass) {
        const recognition = new RecognitionClass();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onstart = () => {
          setIsListening(true);
        };
        recognition.onresult = (event: any) => {
          let finalText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) finalText += result[0].transcript + ' ';
          }
          if (finalText.trim().length > 0) {
            setTranscript(prev => (prev ? `${prev} ${finalText.trim()}` : finalText.trim()));
          }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => {
          setIsListening(false);
          // Auto-resume shortly after if not speaking
          setTimeout(() => {
            if (!ttsSpeakingRef.current) {
              resumeRecognition();
            }
          }, 300);
        };
        webRecognitionRef.current = recognition;
      }
    } else if (VoiceNative) {
      VoiceNative.onSpeechStart = () => setIsListening(true);
      VoiceNative.onSpeechResults = (event: any) => {
        const values: string[] = event.value || [];
        if (values.length > 0) setTranscript(values[0]);
      };
      VoiceNative.onSpeechPartialResults = (event: any) => {
        const values: string[] = event.value || [];
        if (values.length > 0) setTranscript(values.join(' '));
      };
      VoiceNative.onSpeechError = () => setIsListening(false);
      VoiceNative.onSpeechEnd = () => {
        setIsListening(false);
        // Auto-resume shortly after if not speaking
        setTimeout(() => {
          if (!ttsSpeakingRef.current) {
            resumeRecognition();
          }
        }, 300);
      };
    }

    return () => {
      unsubscribeStart();
      unsubscribeEnd();
      if (Platform.OS === 'web') {
        const recognition = webRecognitionRef.current;
        try { recognition?.stop?.(); } catch {}
        webRecognitionRef.current = null;
      } else if (VoiceNative) {
        VoiceNative.destroy?.();
      }
    };
  }, [pauseRecognition, resumeRecognition]);

  // Start listening as soon as the provider mounts
  useEffect(() => {
    startListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureAndroidMicPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      const ok = granted === PermissionsAndroid.RESULTS.GRANTED;
      setHasMicPermission(ok);
      return ok;
    } catch {
      return false;
    }
  };

  const requestMicPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      return await ensureAndroidMicPermission();
    }
    // iOS/Web: permission is handled by first use, assume true here
    setHasMicPermission(true);
    return true;
  };

  const startListening = async () => {
    if (startInProgressRef.current) return;
    if (isListening) return;
    startInProgressRef.current = true;
    lastStartTimestampRef.current = Date.now();
    setTranscript('');
    if (Platform.OS === 'web') {
      const recognition = webRecognitionRef.current;
      if (!recognition) {
        Speech.speak('Speech recognition is not supported in this browser.');
        startInProgressRef.current = false;
        return;
      }
      try {
        recognition.start();
        // onstart will set isListening
      } catch (e) {
        // swallow invalid state errors when already starting
      } finally {
        startInProgressRef.current = false;
      }
    } else if (VoiceNative) {
      const hasMic = await ensureAndroidMicPermission();
      if (!hasMic) {
        Speech.speak('Microphone permission is required for voice commands. Please enable microphone access in settings.');
        startInProgressRef.current = false;
        return;
      }
      try {
        await VoiceNative.start('en-US');
        setIsListening(true);
      } catch {
        setIsListening(false);
      } finally {
        startInProgressRef.current = false;
      }
    } else {
      Speech.speak('Speech recognition is not available on this device.');
      startInProgressRef.current = false;
    }
  };

  const stopListening = async () => {
    if (Platform.OS === 'web') {
      try { webRecognitionRef.current?.stop?.(); } catch {}
      setIsListening(false);
    } else if (VoiceNative) {
      try { await VoiceNative.stop(); } catch {}
      setIsListening(false);
    }
  };

  const resetTranscript = () => setTranscript('');

  const value: VoiceContextValue = {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    hasMicPermission,
    requestMicPermission,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoiceContext(): VoiceContextValue {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoiceContext must be used within VoiceProvider');
  return ctx;
}


