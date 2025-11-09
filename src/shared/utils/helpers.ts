export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatTime(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomIntBetween(min: number, max: number): number {
  return Math.floor(randomBetween(min, max));
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function getRandomTreeType(): string {
  const types = [
    'row-1-column-1', 'row-1-column-2', 'row-1-column-3', 'row-1-column-4', 
    'row-1-column-5', 'row-1-column-6', 'row-1-column-7',
    'row-3-column-2', 'row-3-column-3', 'row-4-column-1'
  ];
  return types[randomIntBetween(0, types.length)];
}

export function getRandomAnimalType(): string {
  const types = ['deer', 'rabbit', 'bird', 'squirrel', 'fox'];
  return types[randomIntBetween(0, types.length)];
}

