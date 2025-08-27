import { Tabs, useRouter } from 'expo-router';
import { Camera, Navigation, TriangleAlert as AlertTriangle, Settings } from 'lucide-react-native';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useNavigationContext } from '../../context/NavigationContext';
import { useGlobalNavigation } from '../../hooks/useGlobalNavigation';
// Removed global push-to-talk

export default function TabLayout() {
  const router = useRouter();
  const { transcript, startListening, isListening, resetTranscript, isConfirming, confirmCommand } = useSpeechRecognition();
  const { setCurrentScreen } = useNavigationContext();
  const { navigateToScreen, getCurrentScreenInfo, listAvailableScreens } = useGlobalNavigation();
  // Track if we are waiting for confirmation
  useEffect(() => {
    if (isConfirming && transcript) {
      const answer = transcript.toLowerCase();
      if (answer.includes('yes')) {
        confirmCommand(true);
        resetTranscript();
      } else if (answer.includes('no')) {
        confirmCommand(false);
        resetTranscript();
      }
    }
  }, [isConfirming, transcript]);

  useEffect(() => {
    if (!transcript || isConfirming) return;
    // Normalize transcript
    const command = transcript.toLowerCase();
    
    // Enhanced navigation commands
    if (command.includes('go to') || command.includes('navigate to') || command.includes('switch to')) {
      const screenMatch = command.match(/(?:go to|navigate to|switch to)\s+(\w+)/);
      if (screenMatch) {
        navigateToScreen(screenMatch[1]);
        resetTranscript();
        return;
      }
    }
    
    // Quick navigation commands
    if (command.includes('navigation') || command.includes('gps')) {
      navigateToScreen('navigation');
      resetTranscript();
    } else if (command.includes('scan') || command.includes('scanner')) {
      navigateToScreen('scanner');
      resetTranscript();
    } else if (command.includes('emergency') || command.includes('sos')) {
      navigateToScreen('emergency');
      resetTranscript();
    } else if (command.includes('setting')) {
      navigateToScreen('settings');
      resetTranscript();
    } else if (command.includes('where am i') || command.includes('current screen')) {
      getCurrentScreenInfo();
      resetTranscript();
    } else if (command.includes('list screens') || command.includes('available screens')) {
      listAvailableScreens();
      resetTranscript();
    }
    // (Start/stop scanning will be handled in Scanner tab)
  }, [transcript, isConfirming]);

  // Optionally, always listen for commands
  useEffect(() => {
    if (!isListening && !isConfirming) startListening();
  }, [isListening, isConfirming]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#333333',
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginBottom: 4,
        },
      }}
      screenListeners={{
        tabPress: (e) => {
          const routeName = e.target?.split('-')[0];
          switch (routeName) {
            case 'index':
              setCurrentScreen('scanner');
              break;
            case 'navigate':
              setCurrentScreen('navigation');
              break;
            case 'emergency':
              setCurrentScreen('emergency');
              break;
            case 'settings':
              setCurrentScreen('settings');
              break;
          }
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ size, color }) => (
            <Camera size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Environment Scanner',
        }}
      />
      <Tabs.Screen
        name="navigate"
        options={{
          title: 'Navigate',
          tabBarIcon: ({ size, color }) => (
            <Navigation size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'GPS Navigation',
        }}
      />
      <Tabs.Screen
        name="emergency"
        options={{
          title: 'Emergency',
          tabBarIcon: ({ size, color }) => (
            <AlertTriangle size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Emergency Features',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'App Settings',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});