import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, FlatList } from 'react-native';
import * as Speech from 'expo-speech';
import { speak } from '../../utils/voice';
import * as Haptics from 'expo-haptics';
import { Settings, Volume2, VolumeX, Vibrate, Moon, Sun, Mic, Shield, Camera } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useNavigationContext } from '../../context/NavigationContext';
import { useAnnounceScreen } from '../../hooks/useAnnounceScreen';

interface SettingsOption {
  id: string;
  title: string;
  description: string;
  value: boolean;
  icon: React.ReactNode;
  onChange: (value: boolean) => void;
}

// Remove this constant since we're using navigation context

export default function SettingsScreen() {
  useAnnounceScreen('settings');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [highContrastMode, setHighContrastMode] = useState(true);
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(true);
  const [emergencyModeEnabled, setEmergencyModeEnabled] = useState(true);
  const { transcript, resetTranscript, startListening } = useSpeechRecognition();

  // Initial announcements are handled by useAnnounceScreen.

  useEffect(() => {
    if (!transcript) return;
    const text = transcript.toLowerCase();
    const handleAndReset = (fn: () => void) => { fn(); resetTranscript(); };
    if (text.includes('repeat')) {
      handleAndReset(() => speak(getScreenInstructions('settings')));
      return;
    }
    if (text.includes('read') || text.includes('read screen')) {
      handleAndReset(() => speak('Settings screen. Say voice, haptic, auto, contrast, commands, or emergency to toggle that setting.'));
      return;
    }
    const toggleShortcuts: Array<[string, () => void, string]> = [
      ['voice', () => handleVoiceToggle(!voiceEnabled), 'Voice feedback'],
      ['haptic', () => handleHapticToggle(!hapticEnabled), 'Haptic feedback'],
      ['auto', () => setAutoScanEnabled(!autoScanEnabled), 'Auto-scan environment'],
      ['contrast', () => setHighContrastMode(!highContrastMode), 'High contrast mode'],
      ['commands', () => setVoiceCommandsEnabled(!voiceCommandsEnabled), 'Voice commands'],
      ['emergency', () => setEmergencyModeEnabled(!emergencyModeEnabled), 'Emergency features'],
    ];
    for (const [key, action, label] of toggleShortcuts) {
      if (text.includes(key)) {
        handleAndReset(action);
        speak(`${label} toggled.`);
        return;
      }
    }
  }, [transcript]);

  const handleVoiceToggle = (value: boolean) => {
    setVoiceEnabled(value);
    if (value) {
      speak('Voice feedback enabled');
    } else {
      speak('Voice feedback disabled');
    }
  };

  const handleHapticToggle = (value: boolean) => {
    setHapticEnabled(value);
    if (Platform.OS !== 'web') {
      if (value) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        speak('Haptic feedback enabled');
      } else {
        speak('Haptic feedback disabled');
      }
    }
  };

  const settings: SettingsOption[] = [
    {
      id: 'voice',
      title: 'Voice Feedback',
      description: 'Enable audio descriptions and announcements',
      value: voiceEnabled,
      icon: voiceEnabled ? <Volume2 size={24} color="#FFD700" /> : <VolumeX size={24} color="#666666" />,
      onChange: handleVoiceToggle,
    },
    {
      id: 'haptic',
      title: 'Haptic Feedback',
      description: 'Enable vibration for navigation and alerts',
      value: hapticEnabled,
      icon: <Vibrate size={24} color={hapticEnabled ? "#FFD700" : "#666666"} />,
      onChange: handleHapticToggle,
    },
    {
      id: 'autoScan',
      title: 'Auto-Scan Environment',
      description: 'Automatically scan surroundings every 5 seconds',
      value: autoScanEnabled,
      icon: <Camera size={24} color={autoScanEnabled ? "#FFD700" : "#666666"} />,
      onChange: (value) => {
        setAutoScanEnabled(value);
         speak(value ? 'Auto-scan enabled' : 'Auto-scan disabled');
      },
    },
    {
      id: 'contrast',
      title: 'High Contrast Mode',
      description: 'Enhanced visibility with high contrast colors',
      value: highContrastMode,
      icon: highContrastMode ? <Sun size={24} color="#FFD700" /> : <Moon size={24} color="#666666" />,
      onChange: (value) => {
        setHighContrastMode(value);
         speak(value ? 'High contrast mode enabled' : 'High contrast mode disabled');
      },
    },
    {
      id: 'voiceCommands',
      title: 'Voice Commands',
      description: 'Control app with voice commands',
      value: voiceCommandsEnabled,
      icon: <Mic size={24} color={voiceCommandsEnabled ? "#FFD700" : "#666666"} />,
      onChange: (value) => {
        setVoiceCommandsEnabled(value);
         speak(value ? 'Voice commands enabled' : 'Voice commands disabled');
      },
    },
    {
      id: 'emergency',
      title: 'Emergency Features',
      description: 'Enable emergency mode and location sharing',
      value: emergencyModeEnabled,
      icon: <Shield size={24} color={emergencyModeEnabled ? "#FFD700" : "#666666"} />,
      onChange: (value) => {
        setEmergencyModeEnabled(value);
         speak(value ? 'Emergency features enabled' : 'Emergency features disabled');
      },
    },
  ];

  const renderSettingItem = ({ item }: { item: SettingsOption }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={() => item.onChange(!item.value)}
      accessible={true}
      accessibilityLabel={`${item.title}. ${item.description}. Currently ${item.value ? 'enabled' : 'disabled'}`}
      accessibilityRole="switch"
      accessibilityState={{ checked: item.value }}
    >
      <View style={styles.settingContent}>
        <View style={styles.settingIcon}>
          {item.icon}
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
        <Switch
          value={item.value}
          onValueChange={item.onChange}
          trackColor={{ false: '#333333', true: '#FFD700' }}
          thumbColor={item.value ? '#000000' : '#666666'}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Settings size={32} color="#FFD700" />
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Accessibility Settings</Text>
          <FlatList
            data={settings}
            renderItem={renderSettingItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>About BrailleWalk</Text>
          <Text style={styles.infoText}>
            BrailleWalk is designed to be your trusted companion for safe, independent navigation. 
            All core features work offline to ensure reliability when you need it most.
          </Text>
          
          <View style={styles.privacyContainer}>
            <Shield size={20} color="#00AA00" />
            <Text style={styles.privacyText}>
              Your privacy is protected. Facial recognition data is stored locally on your device and never shared.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.voiceTestButton}
          onPress={() => speak('This is a voice test. BrailleWalk voice feedback is working correctly.')}
          accessible={true}
          accessibilityLabel="Test voice feedback"
          accessibilityRole="button"
        >
          <Volume2 size={24} color="#000000" />
          <Text style={styles.voiceTestButtonText}>Test Voice Feedback</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  scrollContainer: {
    flex: 1,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  infoContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 16,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00AA00',
  },
  privacyText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  voiceTestButton: {
    backgroundColor: '#FFD700',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  voiceTestButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});