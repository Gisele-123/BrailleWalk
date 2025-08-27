import { useRouter } from 'expo-router';
import { useNavigationContext } from '../context/NavigationContext';
import { speak } from '../utils/voice';

export function useGlobalNavigation() {
  const router = useRouter();
  const { setCurrentScreen } = useNavigationContext();

  const navigateToScreen = (screen: string) => {
    switch (screen.toLowerCase()) {
      case 'scanner':
      case 'scan':
      case 'scanning':
        router.replace('/(tabs)');
        setCurrentScreen('scanner');
        speak('Navigating to Environment Scanner.');
        break;
      case 'navigation':
      case 'navigate':
      case 'gps':
        router.replace('/(tabs)/navigate');
        setCurrentScreen('navigation');
        speak('Navigating to GPS Navigation.');
        break;
      case 'emergency':
      case 'sos':
        router.replace('/(tabs)/emergency');
        setCurrentScreen('emergency');
        speak('Navigating to Emergency screen.');
        break;
      case 'settings':
      case 'setting':
        router.replace('/(tabs)/settings');
        setCurrentScreen('settings');
        speak('Navigating to Settings.');
        break;
      default:
        speak(`Unknown screen: ${screen}. Available screens are scanner, navigation, emergency, and settings.`);
    }
  };

  const getCurrentScreenInfo = () => {
    const { currentScreen, getScreenInstructions } = useNavigationContext();
    const instructions = getScreenInstructions(currentScreen);
    speak(`You are currently on the ${currentScreen} screen. ${instructions}`);
  };

  const listAvailableScreens = () => {
    speak('Available screens: Scanner for environment detection, Navigation for GPS guidance, Emergency for safety features, and Settings for app customization.');
  };

  return {
    navigateToScreen,
    getCurrentScreenInfo,
    listAvailableScreens,
  };
}
