import { ForestState, Tree } from '../types';

export class ImageForestRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private forestState: ForestState;
  private treeImages: Map<string, HTMLImageElement> = new Map();
  private imagesLoaded = 0;
  private totalImages = 6;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
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

    this.loadTreeImages();
  }

  private loadTreeImages(): void {
    const treeTypes = ['tree1', 'tree2', 'tree3', 'tree4', 'tree5', 'tree6'];
    
    treeTypes.forEach(type => {
      const img = new Image();
      img.onload = () => {
        this.imagesLoaded++;
        if (this.imagesLoaded === this.totalImages) {
          console.log('Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
          this.draw();
        }
      };
      img.onerror = () => {
        console.error(`Failed to load tree image: ${type}`);
      };
      img.src = chrome.runtime.getURL(`images/${type}.png`);
      this.treeImages.set(type, img);
    });
  }

  setForestState(state: ForestState): void {
    this.forestState = state;
  }

  draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.imagesLoaded < this.totalImages) {
      return;
    }

    const wildfireLevel = this.forestState.wildfire.level || 0;
    const sortedTrees = [...this.forestState.trees].sort((a, b) => a.y - b.y);

    sortedTrees.forEach((tree, index) => {
      const depthFactor = index / Math.max(1, sortedTrees.length);
      this.drawTree(tree, wildfireLevel, depthFactor);
    });

    if (wildfireLevel > 0.3) {
      this.ctx.fillStyle = `rgba(255, 100, 0, ${wildfireLevel * 0.3})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private drawTree(tree: Tree, wildfireLevel: number, depthFactor: number): void {
    const treeImage = this.treeImages.get(tree.type) || this.treeImages.get('tree1');
    if (!treeImage) {
      console.log('No tree image for type:', tree.type);
      return;
    }

    const { x, y, height, status } = tree;
    // Scale based on tree maturity (height represents growth)
    // Max height is now 200, scale accordingly
    const maturityScale = Math.min(height / 200, 1.0);
    const depthScale = 0.5 + depthFactor * 0.5;
    const scale = maturityScale * depthScale * 2.5; // Much bigger base scale
    const displayWidth = treeImage.width * scale;
    const displayHeight = treeImage.height * scale;
    const alpha = 0.4 + depthFactor * 0.3; // Reduced opacity
    
    console.log(`Drawing tree at (${x}, ${y}) height:${height} scale:${scale.toFixed(2)} size:${displayWidth.toFixed(0)}x${displayHeight.toFixed(0)}`);

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.filter = 'brightness(0.8)'; // Slightly darker to blend better

    if (status === 'healthy') {
      this.ctx.drawImage(
        treeImage,
        x - displayWidth / 2,
        y - displayHeight / 2,
        displayWidth,
        displayHeight
      );
    } else if (status === 'burning') {
      this.ctx.drawImage(
        treeImage,
        x - displayWidth / 2,
        y - displayHeight / 2,
        displayWidth,
        displayHeight
      );
      
      this.ctx.globalCompositeOperation = 'multiply';
      this.ctx.fillStyle = 'rgba(255, 100, 50, 0.7)';
      this.ctx.fillRect(
        x - displayWidth / 2,
        y - displayHeight / 2,
        displayWidth,
        displayHeight
      );
      this.ctx.globalCompositeOperation = 'source-over';

      const time = Date.now() / 200;
      const flicker = Math.sin(time) * 10;
      this.ctx.globalAlpha = 0.7;
      this.ctx.fillStyle = 'rgba(255, 50, 0, 0.7)';
      this.ctx.beginPath();
      this.ctx.ellipse(
        x,
        y - displayHeight * 0.2 + flicker,
        displayWidth * 0.2,
        displayHeight * 0.15,
        0,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    } else if (status === 'burnt') {
      this.ctx.globalAlpha = alpha * 0.6;
      this.ctx.filter = 'grayscale(100%) brightness(0.3)';
      this.ctx.drawImage(
        treeImage,
        x - (displayWidth * 0.7) / 2,
        y - (displayHeight * 0.5) / 2,
        displayWidth * 0.7,
        displayHeight * 0.5
      );
      this.ctx.filter = 'brightness(0.8)';
    }

    this.ctx.restore();
  }
}
