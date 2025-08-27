import React, { createContext, useContext, useState, useEffect } from 'react';
import { speak } from '../utils/voice';

export type ScreenType = 'onboarding' | 'scanner' | 'navigation' | 'emergency' | 'settings' | 'emergency-activated';

interface NavigationContextValue {
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType) => void;
  announceScreen: (screen: ScreenType) => void;
  getScreenInstructions: (screen: ScreenType) => string;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

const SCREEN_INSTRUCTIONS: Record<ScreenType, string> = {
  onboarding: 'Welcome to BrailleWalk setup. Tap anywhere to begin facial recognition setup. Say scan to begin.',
  scanner: 'Environment Scanner ready. Tap the large button to start scanning, or say "scan" to begin. Say "read" for a summary.',
  navigation: 'GPS Navigation ready. Enter a destination or say "go" followed by your destination. Say "read" for a summary.',
  emergency: 'Emergency features ready. Triple tap the red emergency button to activate emergency mode. Say "sos" to activate.',
  settings: 'Settings screen. Customize your BrailleWalk experience. Say "read" for a summary.',
  'emergency-activated': 'Emergency mode is now active. Your location has been shared. Stay calm, help is on the way. Say "back" to return.',
};

const SCREEN_NAMES: Record<ScreenType, string> = {
  onboarding: 'Setup Screen',
  scanner: 'Environment Scanner',
  navigation: 'GPS Navigation',
  emergency: 'Emergency',
  settings: 'Settings',
  'emergency-activated': 'Emergency Active',
};

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreenState] = useState<ScreenType>('onboarding');

  const setCurrentScreen = (screen: ScreenType) => {
    setCurrentScreenState(screen);
  };

  const announceScreen = (screen: ScreenType) => {
    const screenName = SCREEN_NAMES[screen];
    const instructions = SCREEN_INSTRUCTIONS[screen];
    
    speak(`Now on ${screenName}. ${instructions}`);
  };

  const getScreenInstructions = (screen: ScreenType): string => {
    return SCREEN_INSTRUCTIONS[screen];
  };

  const value: NavigationContextValue = {
    currentScreen,
    setCurrentScreen,
    announceScreen,
    getScreenInstructions,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigationContext must be used within NavigationProvider');
  return ctx;
}
