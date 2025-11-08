import { ForestState, Tree, Animal } from '../types';
import { TreeModel } from './Tree';
import { AnimalModel } from './Animal';

export class CanvasForestRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private forestState: ForestState;
  private groundY: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    // Calculate groundY as 5/6 of canvas height (works for any size)
    this.groundY = Math.floor(canvas.height * 0.83);
    this.forestState = {
      trees: [],
      animals: [],
      wildfire: {
        active: false,
        level: 0,
        affectedTreeIds: [],
        startTime: null,
        spreadingRate: 0.1
      },
      sessionActive: false,
      focusMinutes: 0,
      lastUpdate: Date.now()
    };
  }

  setForestState(state: ForestState): void {
    this.forestState = state;
  }

  draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawSky();
    this.drawGround();

    // Debug info
    this.ctx.fillStyle = '#000';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Trees: ${this.forestState.trees.length}`, 10, 25);
    this.ctx.fillText(`Canvas: ${this.canvas.width}x${this.canvas.height}`, 10, 50);
    this.ctx.fillText(`GroundY: ${this.groundY}`, 10, 75);

    // Draw trees
    if (this.forestState.trees.length > 0) {
      this.ctx.fillText(`Drawing ${this.forestState.trees.length} trees...`, 10, 100);
      this.drawTrees();
    } else {
      this.ctx.fillText('No trees yet!', 10, 100);
    }

    this.drawWildfire();
  }

  private drawSky(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.groundY);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#B0E0E6');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.groundY);
  }

  private drawGround(): void {
    this.ctx.fillStyle = '#90EE90';
    this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
  }

  private drawTrees(): void {
    for (const tree of this.forestState.trees) {
      this.drawTree(tree);
    }
  }

  private drawTree(tree: Tree): void {
    const treeColor = TreeModel.getColor(tree);

    // Adjust tree position to current canvas size
    // Trees are stored with x in 0-800 range, scale to actual canvas width
    const scaledX = (tree.x / 800) * this.canvas.width;
    const treeY = this.groundY;

    if (tree.status === 'burnt') {
      this.ctx.fillStyle = '#2F2F2F';
      this.ctx.fillRect(scaledX - 3, treeY - tree.height * 0.3, 6, tree.height * 0.3);
      return;
    }

    // Trunk
    this.ctx.fillStyle = '#8B4513';
    const trunkWidth = 8;
    const trunkHeight = tree.height * 0.4;
    this.ctx.fillRect(scaledX - trunkWidth / 2, treeY - trunkHeight, trunkWidth, trunkHeight);

    // Foliage
    if (tree.status === 'healthy' || tree.status === 'recovering') {
      this.ctx.fillStyle = treeColor;
      const foliageSize = tree.height * 0.6;
      this.ctx.beginPath();
      this.ctx.arc(scaledX, treeY - trunkHeight - foliageSize / 2, foliageSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(scaledX - foliageSize * 0.3, treeY - trunkHeight - foliageSize * 0.3, foliageSize * 0.35, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(scaledX + foliageSize * 0.3, treeY - trunkHeight - foliageSize * 0.3, foliageSize * 0.35, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (tree.status === 'burning') {
      const intensity = tree.burnIntensity || 0.5;

      // Fire
      this.ctx.fillStyle = `rgb(255, ${Math.floor(165 * (1 - intensity))}, 0)`;
      const fireHeight = trunkHeight * 0.5 * intensity;
      this.ctx.beginPath();
      this.ctx.moveTo(scaledX - trunkWidth / 2, treeY - trunkHeight);
      this.ctx.lineTo(scaledX - trunkWidth / 2 - 5, treeY - trunkHeight - fireHeight);
      this.ctx.lineTo(scaledX, treeY - trunkHeight - fireHeight * 1.2);
      this.ctx.lineTo(scaledX + trunkWidth / 2 + 5, treeY - trunkHeight - fireHeight);
      this.ctx.lineTo(scaledX + trunkWidth / 2, treeY - trunkHeight);
      this.ctx.closePath();
      this.ctx.fill();

      // Charred trunk
      this.ctx.fillStyle = '#2F2F2F';
      this.ctx.fillRect(tree.x - trunkWidth / 2, tree.y - trunkHeight, trunkWidth, trunkHeight);
    }
  }


  private drawAnimal(animal: Animal): void {
    const animalColor = AnimalModel.getColor(animal);
    this.ctx.fillStyle = animalColor;

    if (animal.type === 'deer') {
      this.ctx.beginPath();
      this.ctx.ellipse(animal.x, animal.y, 7.5, 5, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.ellipse(animal.x + 8, animal.y - 3, 4, 3, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillRect(animal.x - 5, animal.y + 5, 2, 6);
      this.ctx.fillRect(animal.x + 3, animal.y + 5, 2, 6);
    } else if (animal.type === 'rabbit') {
      this.ctx.beginPath();
      this.ctx.ellipse(animal.x, animal.y, 5, 4, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.ellipse(animal.x + 5, animal.y - 2, 3, 2.5, 0, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (animal.type === 'bird') {
      this.ctx.beginPath();
      this.ctx.ellipse(animal.x, animal.y, 4, 3, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.ellipse(animal.x - 3, animal.y, 2, 4, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.ellipse(animal.x + 3, animal.y, 2, 4, 0, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      this.ctx.beginPath();
      this.ctx.ellipse(animal.x, animal.y, 6, 4, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawWildfire(): void {
    if (!this.forestState.wildfire.active) return;

    const burningTrees = this.forestState.trees.filter(
      t => t.status === 'burning' && this.forestState.wildfire.affectedTreeIds.includes(t.id)
    );

    for (const tree of burningTrees) {
      this.drawFireParticles(tree.x, tree.y - tree.height * 0.4, tree.burnIntensity || 0.5);
      this.drawSmokeParticles(tree.x, tree.y - tree.height * 0.6, tree.burnIntensity || 0.5);
    }
  }

  private drawFireParticles(x: number, y: number, intensity: number): void {
    const particleCount = Math.floor(10 * intensity);

    for (let i = 0; i < particleCount; i++) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = -Math.random() * 15;
      const size = Math.random() * 3 + 1;

      const colors = ['#FFFF00', '#FFA500', '#FF4500'];
      this.ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      this.ctx.beginPath();
      this.ctx.arc(x + offsetX, y + offsetY, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawSmokeParticles(x: number, y: number, intensity: number): void {
    const particleCount = Math.floor(5 * intensity);

    for (let i = 0; i < particleCount; i++) {
      const offsetX = (Math.random() - 0.5) * 30;
      const offsetY = -Math.random() * 30 - 10;
      const size = Math.random() * 8 + 5;
      const alpha = (Math.random() * 100 + 50) / 255;

      this.ctx.fillStyle = `rgba(105, 105, 105, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(x + offsetX, y + offsetY, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}
