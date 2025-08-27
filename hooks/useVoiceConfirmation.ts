import { useState, useCallback } from 'react';
import { speak } from '../utils/voice';

interface ConfirmationOptions {
  message: string;
  confirmPhrases?: string[];
  cancelPhrases?: string[];
  timeout?: number;
}

export function useVoiceConfirmation() {
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requestConfirmation = useCallback((
    action: () => void,
    options: ConfirmationOptions
  ) => {
    const {
      message,
      confirmPhrases = ['yes', 'confirm', 'okay', 'proceed'],
      cancelPhrases = ['no', 'cancel', 'stop', 'abort'],
      timeout = 10000 // 10 seconds default
    } = options;

    setPendingAction(() => action);
    setIsAwaitingConfirmation(true);
    
    speak(message);
    speak('Say yes to confirm or no to cancel.');

    // Auto-cancel after timeout
    const timeoutId = setTimeout(() => {
      if (isAwaitingConfirmation) {
        cancelConfirmation();
        speak('Confirmation timed out. Action cancelled.');
      }
    }, timeout);

    return {
      confirm: () => {
        clearTimeout(timeoutId);
        executeAction();
      },
      cancel: () => {
        clearTimeout(timeoutId);
        cancelConfirmation();
      },
      checkPhrase: (phrase: string) => {
        const lowerPhrase = phrase.toLowerCase();
        if (confirmPhrases.some(p => lowerPhrase.includes(p))) {
          clearTimeout(timeoutId);
          executeAction();
          return true;
        }
        if (cancelPhrases.some(p => lowerPhrase.includes(p))) {
          clearTimeout(timeoutId);
          cancelConfirmation();
          return true;
        }
        return false;
      }
    };
  }, [isAwaitingConfirmation]);

  const executeAction = useCallback(() => {
    if (pendingAction) {
      pendingAction();
    }
    setIsAwaitingConfirmation(false);
    setPendingAction(null);
  }, [pendingAction]);

  const cancelConfirmation = useCallback(() => {
    setIsAwaitingConfirmation(false);
    setPendingAction(null);
    speak('Action cancelled.');
  }, []);

  return {
    isAwaitingConfirmation,
    requestConfirmation,
    cancelConfirmation
  };
}
