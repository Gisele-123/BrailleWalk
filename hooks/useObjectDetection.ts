import { useState, useEffect, useRef } from 'react';

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
  isHazard: boolean;
}

interface ObjectDetectionHook {
  detectedObjects: DetectedObject[];
  isDetecting: boolean;
  startDetection: () => void;
  stopDetection: () => void;
  getAudioDescription: () => string;
}

export function useObjectDetection(): ObjectDetectionHook {
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);

  const objectTypes = [
    { name: 'table', isHazard: false },
    { name: 'chair', isHazard: false },
    { name: 'door', isHazard: false },
    { name: 'stairs', isHazard: true },
    { name: 'wet floor', isHazard: true },
    { name: 'person', isHazard: false },
    { name: 'wall', isHazard: false },
    { name: 'pillar', isHazard: true },
    { name: 'curb', isHazard: true },
    { name: 'sign', isHazard: false },
  ];

  const directions = ['ahead', 'to your left', 'to your right', 'behind you', 'ahead and left', 'ahead and right'];
  const distances = ['1 foot', '2 feet', '3 feet', '5 feet', '8 feet', '10 feet'];

  const simulateDetection = () => {
    const numObjects = Math.floor(Math.random() * 4) + 1;
    const newObjects: DetectedObject[] = [];

    for (let i = 0; i < numObjects; i++) {
      const objectType = objectTypes[Math.floor(Math.random() * objectTypes.length)];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const distance = distances[Math.floor(Math.random() * distances.length)];

      newObjects.push({
        id: `obj_${Date.now()}_${i}`,
        name: objectType.name,
        confidence: Math.random() * 0.3 + 0.7,
        x: Math.random() * 250,
        y: Math.random() * 400 + 100,
        width: 60 + Math.random() * 40,
        height: 60 + Math.random() * 40,
        distance,
        direction,
        isHazard: objectType.isHazard,
      });
    }

    setDetectedObjects(newObjects);
  };

  const startDetection = () => {
    setIsDetecting(true);
    simulateDetection();
    detectionInterval.current = setInterval(simulateDetection, 3000) as unknown as NodeJS.Timeout;
  };

  const stopDetection = () => {
    setIsDetecting(false);
    setDetectedObjects([]);
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
  };

  const getAudioDescription = (): string => {
    if (detectedObjects.length === 0) {
      return 'No objects detected in this area.';
    }

    const hazards = detectedObjects.filter(obj => obj.isHazard);
    const regular = detectedObjects.filter(obj => !obj.isHazard);

    let description = '';

    if (hazards.length > 0) {
      description += 'Warning: ';
      description += hazards.map(obj => `${obj.name} ${obj.distance} ${obj.direction}`).join(', ');
      description += '. ';
    }

    if (regular.length > 0) {
      description += 'I can see: ';
      description += regular.map(obj => `${obj.name} ${obj.distance} ${obj.direction}`).join(', ');
    }

    return description;
  };

  useEffect(() => {
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, []);

  return {
    detectedObjects,
    isDetecting,
    startDetection,
    stopDetection,
    getAudioDescription,
  };
}