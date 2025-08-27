import { speak } from './voice';
import { Platform } from 'react-native';

export enum ErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  LOCATION_ERROR = 'LOCATION_ERROR',
  VOICE_ERROR = 'VOICE_ERROR',
  CAMERA_ERROR = 'CAMERA_ERROR',
  NAVIGATION_ERROR = 'NAVIGATION_ERROR',
  EMERGENCY_ERROR = 'EMERGENCY_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  timestamp: number;
  context?: string;
  retryable: boolean;
}

class ErrorHandler {
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  logError(
    type: ErrorType,
    message: string,
    userMessage?: string,
    context?: string,
    retryable = true
  ): AppError {
    const error: AppError = {
      type,
      message,
      userMessage: userMessage || this.getDefaultUserMessage(type),
      timestamp: Date.now(),
      context,
      retryable,
    };

    this.errorLog.push(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console in development
    if (__DEV__) {
      console.error(`[${type}] ${message}`, { context, timestamp: error.timestamp });
    }

    return error;
  }

  handleError(error: AppError, speakToUser = true): void {
    if (speakToUser) {
      speak(error.userMessage);
    }

    // Platform-specific error handling
    if (Platform.OS === 'web') {
      // Web-specific error handling
      this.handleWebError(error);
    } else {
      // Mobile-specific error handling
      this.handleMobileError(error);
    }
  }

  private handleWebError(error: AppError): void {
    switch (error.type) {
      case ErrorType.VOICE_ERROR:
        // Web Speech API specific handling
        if (error.message.includes('not supported')) {
          speak('Voice recognition is not supported in this browser. Please use a modern browser or mobile app.');
        }
        break;
      case ErrorType.LOCATION_ERROR:
        // Web Geolocation API specific handling
        if (error.message.includes('permission')) {
          speak('Location access denied. Please allow location access in your browser settings.');
        }
        break;
      default:
        break;
    }
  }

  private handleMobileError(error: AppError): void {
    switch (error.type) {
      case ErrorType.PERMISSION_DENIED:
        // Guide user to settings
        speak('Please go to your device settings and enable the required permissions for BrailleWalk.');
        break;
      case ErrorType.LOCATION_ERROR:
        // Location-specific guidance
        speak('Unable to access location. Please check your location settings and try again.');
        break;
      case ErrorType.VOICE_ERROR:
        // Voice recognition specific guidance
        speak('Voice recognition error. Please check your microphone permissions and try again.');
        break;
      case ErrorType.CAMERA_ERROR:
        // Camera-specific guidance
        speak('Camera access error. Please check your camera permissions and try again.');
        break;
      default:
        break;
    }
  }

  private getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.PERMISSION_DENIED:
        return 'Permission denied. Please check your device settings.';
      case ErrorType.NETWORK_ERROR:
        return 'Network connection error. Please check your internet connection.';
      case ErrorType.LOCATION_ERROR:
        return 'Location service error. Please try again.';
      case ErrorType.VOICE_ERROR:
        return 'Voice recognition error. Please try again.';
      case ErrorType.CAMERA_ERROR:
        return 'Camera error. Please try again.';
      case ErrorType.NAVIGATION_ERROR:
        return 'Navigation error. Please try again.';
      case ErrorType.EMERGENCY_ERROR:
        return 'Emergency service error. Please try again or contact emergency services directly.';
      case ErrorType.UNKNOWN_ERROR:
        return 'An unexpected error occurred. Please try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  getRecentErrors(limit = 10): AppError[] {
    return this.errorLog.slice(-limit);
  }

  getErrorsByType(type: ErrorType): AppError[] {
    return this.errorLog.filter(error => error.type === type);
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }

  // Utility methods for common error scenarios
  handlePermissionError(permission: string, context?: string): void {
    const error = this.logError(
      ErrorType.PERMISSION_DENIED,
      `Permission denied for ${permission}`,
      `Please enable ${permission} access in your device settings.`,
      context,
      false
    );
    this.handleError(error);
  }

  handleNetworkError(context?: string): void {
    const error = this.logError(
      ErrorType.NETWORK_ERROR,
      'Network connection failed',
      'Please check your internet connection and try again.',
      context,
      true
    );
    this.handleError(error);
  }

  handleLocationError(message: string, context?: string): void {
    const error = this.logError(
      ErrorType.LOCATION_ERROR,
      message,
      'Unable to access location services. Please check your location settings.',
      context,
      true
    );
    this.handleError(error);
  }

  handleVoiceError(message: string, context?: string): void {
    const error = this.logError(
      ErrorType.VOICE_ERROR,
      message,
      'Voice recognition error. Please try again.',
      context,
      true
    );
    this.handleError(error);
  }
}

export const errorHandler = new ErrorHandler();
