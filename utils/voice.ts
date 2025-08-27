import * as Speech from 'expo-speech';

type SpeakOptions = {
  rate?: number;
  pitch?: number;
  language?: string;
  volume?: number;
};

let defaultRate = 0.9; // medium pace for better comprehension without being too slow
let defaultPitch = 1.0;

export function setSpeechRate(rate: number) {
  // Clamp 0.1 - 1.0 for platform safety
  defaultRate = Math.max(0.1, Math.min(rate, 1.0));
}

export function setSpeechPitch(pitch: number) {
  // Clamp 0.5 - 2.0 typical range
  defaultPitch = Math.max(0.5, Math.min(pitch, 2.0));
}

type VoidFn = () => void;
const onSpeakStartListeners: VoidFn[] = [];
const onSpeakEndListeners: VoidFn[] = [];

export function onSpeakStart(listener: VoidFn) {
  onSpeakStartListeners.push(listener);
  return () => {
    const idx = onSpeakStartListeners.indexOf(listener);
    if (idx >= 0) onSpeakStartListeners.splice(idx, 1);
  };
}

export function onSpeakEnd(listener: VoidFn) {
  onSpeakEndListeners.push(listener);
  return () => {
    const idx = onSpeakEndListeners.indexOf(listener);
    if (idx >= 0) onSpeakEndListeners.splice(idx, 1);
  };
}

export function speak(text: string, options: SpeakOptions & { onDone?: VoidFn; onStopped?: VoidFn; onError?: VoidFn } = {}) {
  const finalOptions: any = {
    rate: defaultRate,
    pitch: defaultPitch,
    ...options,
  };

  // Always interrupt any ongoing speech before starting a new utterance
  try {
    Speech.stop();
  } catch {}

  // Notify start listeners synchronously
  onSpeakStartListeners.forEach((fn) => fn());

  const originalOnDone = finalOptions.onDone;
  const originalOnStopped = finalOptions.onStopped;
  const originalOnError = finalOptions.onError;

  finalOptions.onDone = () => {
    try { originalOnDone?.(); } catch {}
    onSpeakEndListeners.forEach((fn) => fn());
  };
  finalOptions.onStopped = () => {
    try { originalOnStopped?.(); } catch {}
    onSpeakEndListeners.forEach((fn) => fn());
  };
  finalOptions.onError = () => {
    try { originalOnError?.(); } catch {}
    onSpeakEndListeners.forEach((fn) => fn());
  };

  Speech.speak(text, finalOptions);
}

export function stopSpeaking() {
  Speech.stop();
}

export async function isSpeakingAsync(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}

export function speakAndWait(text: string, options: SpeakOptions = {}): Promise<void> {
  return new Promise<void>((resolve) => {
    // Ensure we stop any ongoing speech before starting
    try { Speech.stop(); } catch {}

    speak(text, {
      ...options,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}


