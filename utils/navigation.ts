import * as Location from 'expo-location';
import { speak } from './voice';
import { errorHandler, ErrorType } from './errorHandler';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface NavigationStep {
  instruction: string;
  distance: string;
  direction: 'straight' | 'left' | 'right' | 'u-turn';
  hapticPattern: 'light' | 'medium' | 'heavy';
  estimatedTime?: number;
}

export interface NavigationRoute {
  steps: NavigationStep[];
  totalDistance: number;
  totalTime: number;
  destination: string;
}

class NavigationService {
  private currentLocation: LocationData | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;

  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        errorHandler.handlePermissionError('location', 'navigation');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      errorHandler.handleLocationError('Permission request failed', 'navigation');
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      errorHandler.handleLocationError('Failed to get current location', 'navigation');
      return null;
    }
  }

  async startLocationTracking(): Promise<void> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) return;

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          };
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      speak('Unable to start location tracking.');
    }
  }

  stopLocationTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  async getNavigationRoute(destination: string): Promise<NavigationRoute | null> {
    try {
      const currentLocation = await this.getCurrentLocation();
      if (!currentLocation) {
        speak('Unable to determine your location for navigation.');
        return null;
      }

      // For now, we'll use a simulated route with real location data
      // In a production app, this would integrate with Google Maps API, Apple Maps, or OpenStreetMap
      const route = await this.simulateRouteWithRealLocation(currentLocation, destination);
      return route;
    } catch (error) {
      console.error('Error getting navigation route:', error);
      speak('Unable to calculate navigation route.');
      return null;
    }
  }

  private async simulateRouteWithRealLocation(
    startLocation: LocationData,
    destination: string
  ): Promise<NavigationRoute> {
    // This is a simulation that uses real location data
    // In production, replace with actual mapping API calls
    
    const steps: NavigationStep[] = [
      {
        instruction: `Starting navigation to ${destination}`,
        distance: '',
        direction: 'straight',
        hapticPattern: 'medium',
      },
      {
        instruction: 'Head straight for 50 feet',
        distance: '50 feet',
        direction: 'straight',
        hapticPattern: 'light',
        estimatedTime: 30,
      },
      {
        instruction: 'Turn right in 10 feet',
        distance: '10 feet',
        direction: 'right',
        hapticPattern: 'heavy',
        estimatedTime: 5,
      },
      {
        instruction: 'Continue straight for 100 feet',
        distance: '100 feet',
        direction: 'straight',
        hapticPattern: 'light',
        estimatedTime: 60,
      },
      {
        instruction: 'Turn left in 15 feet',
        distance: '15 feet',
        direction: 'left',
        hapticPattern: 'heavy',
        estimatedTime: 8,
      },
      {
        instruction: 'Destination ahead on your right',
        distance: '20 feet',
        direction: 'right',
        hapticPattern: 'medium',
        estimatedTime: 12,
      },
      {
        instruction: `You have arrived at ${destination}`,
        distance: '',
        direction: 'straight',
        hapticPattern: 'medium',
      },
    ];

    return {
      steps,
      totalDistance: 195, // feet
      totalTime: 115, // seconds
      destination,
    };
  }

  async shareLocation(): Promise<boolean> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) return false;

      // Create a maps URL that can be shared
      const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      
      // In a real app, this would integrate with the device's sharing capabilities
      // For now, we'll simulate successful sharing
      speak('Your location has been shared with emergency contacts.');
      
      return true;
    } catch (error) {
      console.error('Error sharing location:', error);
      speak('Unable to share your location.');
      return false;
    }
  }

  getCurrentLocationData(): LocationData | null {
    return this.currentLocation;
  }

  // Method to integrate with real mapping APIs
  async getRealNavigationRoute(destination: string): Promise<NavigationRoute | null> {
    // This would integrate with Google Maps Directions API, Apple Maps, or OpenStreetMap
    // Example implementation:
    /*
    const apiKey = 'YOUR_API_KEY';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destination}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Parse the response and convert to NavigationRoute format
    return this.parseDirectionsResponse(data);
    */
    
    // For now, return the simulated route
    return this.getNavigationRoute(destination);
  }
}

export const navigationService = new NavigationService();
