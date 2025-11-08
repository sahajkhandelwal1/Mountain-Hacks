import { Animal as AnimalType } from '../types';
import { randomBetween } from '../utils/helpers';

export class AnimalModel {
  static create(data: Partial<AnimalType>): AnimalType {
    return {
      id: data.id || '',
      type: data.type || 'deer',
      x: data.x || 0,
      y: data.y || 0,
      status: data.status || 'visible',
      assetUrl: data.assetUrl
    };
  }

  static updatePosition(animal: AnimalType, canvasWidth: number, canvasHeight: number): AnimalType {
    // Simple movement - animals wander slowly
    const speed = 0.5;
    const newX = animal.x + randomBetween(-speed, speed);
    const newY = animal.y + randomBetween(-speed, speed);
    
    // Keep animals within bounds
    const clampedX = Math.max(50, Math.min(canvasWidth - 50, newX));
    const clampedY = Math.max(200, Math.min(canvasHeight - 50, newY));

    return {
      ...animal,
      x: clampedX,
      y: clampedY
    };
  }

  static reactToWildfire(animal: AnimalType, wildfireActive: boolean): AnimalType {
    if (wildfireActive && animal.status !== 'fleeing') {
      return {
        ...animal,
        status: 'fleeing'
      };
    } else if (!wildfireActive && animal.status === 'fleeing') {
      return {
        ...animal,
        status: 'visible'
      };
    }
    return animal;
  }

  static getColor(animal: AnimalType): string {
    const colors: Record<string, string> = {
      deer: '#8B4513',
      rabbit: '#F5F5DC',
      bird: '#4169E1',
      squirrel: '#A0522D',
      fox: '#FF4500'
    };
    return colors[animal.type] || '#8B4513';
  }
}

