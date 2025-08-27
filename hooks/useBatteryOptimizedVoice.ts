import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useVoiceContext } from '../context/VoiceContext';

interface BatteryOptimizedVoiceOptions {
  enableBatteryOptimization?: boolean;
  pauseWhenBackgrounded?: boolean;
  lowBatteryThreshold?: number;
}

export function useBatteryOptimizedVoice(options: BatteryOptimizedVoiceOptions = {}) {
  const {
    enableBatteryOptimization = true,
    pauseWhenBackgrounded = true,
    lowBatteryThreshold = 20
  } = options;

  const { isListening, startListening, stopListening } = useVoiceContext();
  const [isOptimized, setIsOptimized] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const appState = useRef(AppState.currentState);
  const isBackgrounded = useRef(false);

  // Monitor app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground
        isBackgrounded.current = false;
        if (pauseWhenBackgrounded && isOptimized) {
          startListening();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to background
        isBackgrounded.current = true;
        if (pauseWhenBackgrounded && isListening) {
          stopListening();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isListening, isOptimized, pauseWhenBackgrounded, startListening, stopListening]);

  // Battery level monitoring (simplified - in real app, use expo-battery)
  useEffect(() => {
    if (!enableBatteryOptimization) return;

    // Simulate battery level (in real app, use expo-battery)
    const simulateBatteryLevel = () => {
      // This would be replaced with actual battery level from expo-battery
      const simulatedLevel = Math.random() * 100;
      setBatteryLevel(simulatedLevel);
      
      if (simulatedLevel < lowBatteryThreshold && isListening) {
        stopListening();
        setIsOptimized(true);
      } else if (simulatedLevel > lowBatteryThreshold + 10 && isOptimized) {
        startListening();
        setIsOptimized(false);
      }
    };

    // Check battery level every 30 seconds
    const batteryInterval = setInterval(simulateBatteryLevel, 30000);
    simulateBatteryLevel(); // Initial check

    return () => clearInterval(batteryInterval);
  }, [enableBatteryOptimization, lowBatteryThreshold, isListening, isOptimized, startListening, stopListening]);

  const startOptimizedListening = () => {
    if (isBackgrounded.current && pauseWhenBackgrounded) {
      return; // Don't start if app is backgrounded
    }
    
    if (batteryLevel !== null && batteryLevel < lowBatteryThreshold && enableBatteryOptimization) {
      return; // Don't start if battery is low
    }
    
    startListening();
    setIsOptimized(false);
  };

  const stopOptimizedListening = () => {
    stopListening();
    setIsOptimized(false);
  };

  return {
    isListening,
    isOptimized,
    batteryLevel,
    isBackgrounded: isBackgrounded.current,
    startListening: startOptimizedListening,
    stopListening: stopOptimizedListening,
  };
}
