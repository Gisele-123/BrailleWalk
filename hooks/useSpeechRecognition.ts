import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

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
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isConfirming] = useState<boolean>(false);

  // Web recognition instance
  const webRecognitionRef = useRef<any | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const RecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (RecognitionClass) {
        const recognition = new RecognitionClass();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          let finalText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalText += result[0].transcript + ' ';
            }
          }
          if (finalText.trim().length > 0) {
            setTranscript(prev => (prev ? `${prev} ${finalText.trim()}` : finalText.trim()));
          }
        };
        recognition.onerror = () => {
          setIsListening(false);
        };
        recognition.onend = () => {
          setIsListening(false);
        };
        webRecognitionRef.current = recognition;
      }
    } else if (Voice) {
      Voice.onSpeechStart = () => {
        setIsListening(true);
      };
      Voice.onSpeechResults = (event: any) => {
        const values: string[] = event.value || [];
        if (values.length > 0) {
          setTranscript(values[0]);
        }
      };
      Voice.onSpeechPartialResults = (event: any) => {
        const values: string[] = event.value || [];
        if (values.length > 0) {
          setTranscript(values.join(' '));
        }
      };
      Voice.onSpeechError = () => {
        setIsListening(false);
      };
      Voice.onSpeechEnd = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (Platform.OS === 'web') {
        const recognition = webRecognitionRef.current;
        try {
          recognition?.stop?.();
        } catch {}
        webRecognitionRef.current = null;
      } else if (Voice) {
        Voice.destroy?.();
      }
    };
  }, []);

  const startListening = async () => {
    setTranscript('');
    if (Platform.OS === 'web') {
      const recognition = webRecognitionRef.current;
      if (!recognition) {
        Speech.speak('Speech recognition is not supported in this browser.');
        return;
      }
      try {
        recognition.start();
        setIsListening(true);
      } catch {
        // Some browsers throw if start called twice
      }
    } else if (Voice) {
      try {
        await Voice.start('en-US');
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    } else {
      Speech.speak('Speech recognition is not available on this device.');
    }
  };

  const stopListening = async () => {
    if (Platform.OS === 'web') {
      try {
        webRecognitionRef.current?.stop?.();
      } catch {}
      setIsListening(false);
    } else if (Voice) {
      try {
        await Voice.stop();
      } catch {}
      setIsListening(false);
    }
  };

  const resetTranscript = () => {
    setTranscript('');
  };

  const confirmCommand = () => {
    // No confirmation flow in real recognition version
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isConfirming: false,
    confirmCommand,
  };
}