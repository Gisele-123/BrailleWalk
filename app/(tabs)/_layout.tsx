import { Tabs, useRouter } from 'expo-router';
import { Camera, Navigation, TriangleAlert as AlertTriangle, Settings } from 'lucide-react-native';
import { useEffect } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export default function TabLayout() {
  const router = useRouter();
  const { transcript, startListening, isListening, resetTranscript, isConfirming, confirmCommand } = useSpeechRecognition();
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
    if (command.includes('navigation')) {
      router.replace('/(tabs)/navigate');
      resetTranscript();
    } else if (command.includes('scan') || command.includes('scanning')) {
      router.replace('/(tabs)');
      resetTranscript();
    } else if (command.includes('emergency')) {
      router.replace('/(tabs)/emergency');
      resetTranscript();
    } else if (command.includes('setting')) {
      router.replace('/(tabs)/settings');
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