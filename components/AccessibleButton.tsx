import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'emergency';
  disabled?: boolean;
  children?: React.ReactNode;
}

export default function AccessibleButton({
  title,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
  variant = 'primary',
  disabled = false,
  children,
}: AccessibleButtonProps) {
  
  const handlePress = () => {
    if (disabled) return;
    
    // Haptic feedback
    if (Platform.OS !== 'web') {
      const intensity = variant === 'emergency' ? 
        Haptics.ImpactFeedbackStyle.Heavy : 
        Haptics.ImpactFeedbackStyle.Medium;
      Haptics.impactAsync(intensity);
    }
    
    onPress();
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.primaryButton, disabled && styles.disabledButton];
      case 'secondary':
        return [styles.secondaryButton, disabled && styles.disabledButton];
      case 'emergency':
        return [styles.emergencyButton, disabled && styles.disabledButton];
      default:
        return [styles.primaryButton];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.primaryText, disabled && styles.disabledText];
      case 'secondary':
        return [styles.secondaryText, disabled && styles.disabledText];
      case 'emergency':
        return [styles.emergencyText, disabled && styles.disabledText];
      default:
        return [styles.primaryText];
    }
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {children}
      <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  emergencyButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledText: {
    opacity: 0.7,
  },
});