import { useState, useEffect } from 'react';
import * as Speech from 'expo-speech';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isConfirming: boolean;
  confirmCommand: (confirmed: boolean) => void;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState('');


  const simulateVoiceCommand = () => {
    const commands = [
      'scan room',
      'navigate to kitchen',
      'what do you see',
      'help me',
      'emergency mode',
      'repeat last instruction',
    ];
    const randomCommand = commands[Math.floor(Math.random() * commands.length)];
    setPendingTranscript(randomCommand);
    setTimeout(() => {
      setIsListening(false);
      setIsConfirming(true);
      Speech.speak(`I heard: ${randomCommand}. Is that correct? Say yes or no.`);
    }, 4000); // Listen for 4 seconds
  };

  const startListening = () => {
    setIsListening(true);
    setTranscript('');
    setPendingTranscript('');
    setIsConfirming(false);
    Speech.speak('Listening for voice command...');
    setTimeout(simulateVoiceCommand, 1000); // Wait 1s before "listening"
  };

  const stopListening = () => {
    setIsListening(false);
    setIsConfirming(false);
    Speech.speak('Voice recognition stopped.');
  };

  const resetTranscript = () => {
    setTranscript('');
    setPendingTranscript('');
    setIsConfirming(false);
  };

  // Simulate user confirmation (in real app, listen for yes/no)
  const confirmCommand = (confirmed: boolean) => {
    if (confirmed && pendingTranscript) {
      setTranscript(pendingTranscript);
      setPendingTranscript('');
      setIsConfirming(false);
      Speech.speak('Confirmed.');
    } else {
      setTranscript('');
      setPendingTranscript('');
      setIsConfirming(false);
      Speech.speak('Okay, please repeat your command.');
      setTimeout(startListening, 1000);
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isConfirming,
    confirmCommand,
  };
}