import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { speak } from '../../utils/voice';
import * as Haptics from 'expo-haptics';
import { Camera, Mic, MicOff, Volume2, Scan } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useAnnounceScreen } from '../../hooks/useAnnounceScreen';
import { useVoiceContext } from '../../context/VoiceContext';
import PushToTalk from '../../components/PushToTalk';

const { width, height } = Dimensions.get('window');

interface DetectedObject {
  id: string;
  name: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  distance: string;
  direction: string;
}

// Remove this constant since we're using navigation context

export default function ScannerScreen() {
  useAnnounceScreen('scanner');
  const { hasMicPermission, requestMicPermission } = useVoiceContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [isListening, setIsListening] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [lastDescription, setLastDescription] = useState('');
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const { transcript, resetTranscript, startListening, stopListening } = useSpeechRecognition();

  // Initial announcements are handled by useAnnounceScreen.

  useEffect(() => {
    if (transcript && transcript.toLowerCase().includes('repeat')) {
      const instructions = getScreenInstructions('scanner');
      speak(instructions);
      resetTranscript();
    }
  }, [transcript]);

  useEffect(() => {
    if (!transcript) return;
    const command = transcript.toLowerCase();
    const handleAndReset = (fn: () => void) => {
      fn();
      resetTranscript();
    };
    if (command.includes('repeat')) {
      handleAndReset(() => speak(getScreenInstructions('scanner')));
      return;
    }
    if (
      command.includes('scan') ||
      command.includes('start scanning') ||
      command.includes('describe') ||
      command.includes('what do you see')
    ) {
      speak("I heard 'scan'. Starting scanning.");
      handleAndReset(() => {
        if (!isListening) startScanning();
      });
      return;
    }
    if (command.includes('stop') || command.includes('stop scanning')) {
      speak("I heard 'stop'. Stopping scanning.");
      handleAndReset(() => {
        if (isListening) stopScanning();
      });
      return;
    }
    if (command.includes('help')) {
      handleAndReset(() => speak('Say scan to begin describing your surroundings. Say stop to stop scanning. Say repeat to hear this again. Say read for a summary.'));
      return;
    }
    if (command.includes('read') || command.includes('read screen')) {
      handleAndReset(() => speak('Scanner screen. Large button at center to start or stop scanning. Repeat button on the left, help button on the right. I will speak detected objects every few seconds while scanning.'));
      return;
    }
  }, [transcript]);

  useEffect(() => {
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, []);

  // Simulate object detection
  const simulateObjectDetection = () => {
    const objects = [
      { name: 'table', distance: '2 feet', direction: 'ahead' },
      { name: 'chair', distance: '1 foot', direction: 'to your right' },
      { name: 'door', distance: '5 feet', direction: 'to your left' },
      { name: 'stairs', distance: '8 feet', direction: 'ahead and right' },
      { name: 'person', distance: '3 feet', direction: 'to your left' },
    ];

    const randomObjects = objects
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 1)
      .map((obj, index) => ({
        id: `obj_${Date.now()}_${index}`,
        name: obj.name,
        confidence: Math.random() * 0.3 + 0.7,
        x: Math.random() * (width - 100),
        y: Math.random() * (height - 200) + 100,
        width: 80 + Math.random() * 40,
        height: 80 + Math.random() * 40,
        distance: obj.distance,
        direction: obj.direction,
      }));

    setDetectedObjects(randomObjects);

    // Create audio description
    if (randomObjects.length > 0) {
      const descriptions = randomObjects.map(obj =>
        `${obj.name} ${obj.distance} ${obj.direction}`
      );
      const fullDescription = `I can see: ${descriptions.join(', ')}`;
      setLastDescription(fullDescription);
      speak(fullDescription);

      // Haptic feedback for detection
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      const noObjectsMsg = 'No objects detected in this direction. Try moving the camera slowly.';
      setLastDescription(noObjectsMsg);
      speak(noObjectsMsg);
    }
  };

  const startScanning = () => {
    if (!permission?.granted) {
      requestPermission();
      return;
    }

    speak('Starting continuous scanning. I will describe what I see every few seconds.');
    setIsListening(true);

    // Start continuous detection
    simulateObjectDetection();
    detectionInterval.current = setInterval(simulateObjectDetection, 4000) as unknown as NodeJS.Timeout;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const stopScanning = () => {
    speak('Scanning stopped.');
    setIsListening(false);
    setDetectedObjects([]);

    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const repeatDescription = () => {
    if (lastDescription) {
      speak(lastDescription);
    } else {
      speak('No recent scan results. Start scanning to hear environment descriptions.');
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera access needed for environment scanning</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          accessible={true}
          accessibilityLabel="Grant camera permission"
          accessibilityRole="button"
        >
          <Text style={styles.permissionButtonText}>Enable Camera</Text>
        </TouchableOpacity>
        {!hasMicPermission && (
          <TouchableOpacity
            style={[styles.permissionButton, { marginTop: 16 }]}
            onPress={requestMicPermission}
            accessible={true}
            accessibilityLabel="Grant microphone permission"
            accessibilityRole="button"
          >
            <Text style={styles.permissionButtonText}>Enable Microphone</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera}>
        {/* Object detection overlays */}
        {detectedObjects.map((object) => (
          <View
            key={object.id}
            style={[
              styles.objectBox,
              {
                left: object.x,
                top: object.y,
                width: object.width,
                height: object.height,
              },
            ]}
          >
            <Text style={styles.objectLabel}>{object.name}</Text>
          </View>
        ))}

        {/* Status indicator */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: isListening ? '#00AA00' : '#666666' }]}>
            <Text style={styles.statusText}>
              {isListening ? 'SCANNING' : 'READY'}
            </Text>
          </View>
        </View>

        {/* Control buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={repeatDescription}
            accessible={true}
            accessibilityLabel="Repeat last description"
            accessibilityRole="button"
          >
            <Volume2 size={24} color="#000000" />
            <Text style={styles.secondaryButtonText}>Repeat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: isListening ? '#FF4444' : '#FFD700' }]}
            onPress={isListening ? stopScanning : startScanning}
            accessible={true}
            accessibilityLabel={isListening ? 'Stop scanning environment' : 'Start scanning environment'}
            accessibilityRole="button"
          >
            {isListening ? (
              <MicOff size={32} color="#FFFFFF" />
            ) : (
              <Scan size={32} color="#000000" />
            )}
            <Text style={[styles.mainButtonText, { color: isListening ? '#FFFFFF' : '#000000' }]}>
              {isListening ? 'Stop' : 'Scan'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => speak('Camera scanner. Use this to identify objects, text, and hazards around you.')}
            accessible={true}
            accessibilityLabel="Get help with scanner"
            accessibilityRole="button"
          >
            <Camera size={24} color="#000000" />
            <Text style={styles.secondaryButtonText}>Help</Text>
          </TouchableOpacity>

        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  permissionButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  objectBox: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
  },
  objectLabel: {
    color: '#000000',
    backgroundColor: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    position: 'absolute',
    top: -32,
    left: 0,
  },
  statusContainer: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  statusIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});