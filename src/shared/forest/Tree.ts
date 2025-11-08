import { Tree as TreeType } from '../types';

export class TreeModel {
  static create(data: Partial<TreeType>): TreeType {
    return {
      id: data.id || '',
      type: data.type || 'oak',
      height: data.height || 30,
      x: data.x || 0,
      y: data.y || 0,
      status: data.status || 'healthy',
      age: data.age || 0,
      assetUrl: data.assetUrl,
      burnIntensity: data.burnIntensity
    };
  }

  static grow(tree: TreeType, growthRate: number = 1): TreeType {
    if (tree.status === 'healthy') {
      return {
        ...tree,
        height: Math.min(tree.height + growthRate, 100), // Max height
        age: tree.age + 1
      };
    }
    return tree;
  }

  static getColor(tree: TreeType): string {
    switch (tree.status) {
      case 'healthy':
        return '#228B22'; // Forest green
      case 'burning':
        const intensity = tree.burnIntensity || 0;
        // Interpolate between orange and red based on intensity
        const r = Math.floor(255);
        const g = Math.floor(69 + (255 - 69) * (1 - intensity));
        const b = Math.floor(0);
        return `rgb(${r}, ${g}, ${b})`;
      case 'burnt':
        return '#2F2F2F'; // Dark gray
      case 'recovering':
        return '#8FBC8F'; // Dark sea green
      default:
        return '#228B22';
    }
  }
}

