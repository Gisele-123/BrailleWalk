import React, { useCallback, useRef, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, GestureResponderEvent, Platform } from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useVoiceContext } from '../context/VoiceContext';
import { stopSpeaking } from '../utils/voice';

type Props = {
  size?: number;
  style?: any;
  label?: string;
};

export default function PushToTalk({ size = 64, style, label = 'Voice' }: Props) {
  const { isListening, startListening, stopListening, hasMicPermission, requestMicPermission } = useVoiceContext();
  const [pressed, setPressed] = useState(false);
  const holdActiveRef = useRef(false);

  const ensurePermission = useCallback(async () => {
    if (!hasMicPermission) {
      await requestMicPermission();
    }
  }, [hasMicPermission, requestMicPermission]);

  const handlePressIn = async (e: GestureResponderEvent) => {
    setPressed(true);
    holdActiveRef.current = true;
    await ensurePermission();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Ensure no TTS overlaps listening
    try { stopSpeaking(); } catch {}
    startListening();
  };

  const handlePressOut = async (e: GestureResponderEvent) => {
    setPressed(false);
    if (holdActiveRef.current) {
      holdActiveRef.current = false;
      stopListening();
    }
  };

  const handleToggle = async () => {
    // Tap toggles listening
    await ensurePermission();
    if (isListening) {
      stopListening();
    } else {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      try { stopSpeaking(); } catch {}
      startListening();
    }
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleToggle}
      activeOpacity={0.9}
      style={[styles.fab, pressed || isListening ? styles.fabActive : undefined, style]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={isListening ? 'Stop listening' : 'Start listening'}
      accessibilityHint="Tap to toggle. Press and hold to push-to-talk."
    >
      {isListening ? (
        <Mic size={size * 0.5} color="#FFFFFF" />
      ) : (
        <MicOff size={size * 0.5} color="#000000" />
      )}
      <Text style={[styles.label, isListening ? styles.labelActive : undefined]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabActive: {
    backgroundColor: '#00AA00',
  },
  label: {
    position: 'absolute',
    bottom: 6,
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  labelActive: {
    color: '#FFFFFF',
  },
});


