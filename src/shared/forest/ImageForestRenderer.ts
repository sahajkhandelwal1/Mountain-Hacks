import { ForestState, Tree } from '../types';

export class ImageForestRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private forestState: ForestState;
  private treeImages: Map<string, HTMLImageElement> = new Map();
  private imagesLoaded = 0;
  private totalImages = 10;

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
    // Load all new tree assets (PNG with transparency) - shuffled order
    const treeTypes = [
      'row-3-column-2', 'row-1-column-7', 'row-4-column-1', 'row-1-column-3',
      'row-1-column-5', 'row-3-column-3', 'row-1-column-1', 'row-1-column-6',
      'row-1-column-4', 'row-1-column-2'
    ];

    treeTypes.forEach(type => {
      const img = new Image();
      img.onload = () => {
        this.imagesLoaded++;
        if (this.imagesLoaded === this.totalImages) {
          console.log('Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
          console.log('All new trees loaded (PNG with transparency)');
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

    // Draw ground
    this.drawGround();

    const sortedTrees = [...this.forestState.trees].sort((a, b) => a.y - b.y);

    sortedTrees.forEach((tree, index) => {
      const depthFactor = index / Math.max(1, sortedTrees.length);
      this.drawTree(tree, wildfireLevel, depthFactor);
    });
  }

  private drawGround(): void {
    const groundY = this.canvas.height / 2 + 50; // Slightly below center
    const groundHeight = this.canvas.height - groundY;

    // Solid brown ground - no gradient, no texture
    this.ctx.fillStyle = 'rgb(60, 40, 25)';
    this.ctx.fillRect(0, groundY, this.canvas.width, groundHeight);
  }

  private drawTree(tree: Tree, wildfireLevel: number, depthFactor: number): void {
    const treeImage = this.treeImages.get(tree.type) || this.treeImages.get('row-1-column-1');
    if (!treeImage) {
      console.log('Tree image not loaded yet:', tree.type);
      return;
    }

    const { height, status } = tree;

    // FORCE trees to center of canvas regardless of stored position
    const canvasCenterX = this.canvas.width / 2;
    const canvasCenterY = this.canvas.height / 2;

    // Use tree's stored X as an offset from center
    // Logo + search bar area is roughly 700-800px wide
    // Spread trees across that full width
    const forestWidth = 1000; // Increased spread width
    const offsetX = (tree.x - 960) * (forestWidth / 400); // Even wider spread
    const x = canvasCenterX + offsetX - 900; // Shift left to center better
    const y = canvasCenterY;

    // Scale based on tree maturity (height represents growth)
    // Max height is now 200, scale accordingly
    const maturityScale = Math.min(height / 200, 1.0);
    const depthScale = 0.5 + depthFactor * 0.5;

    // Calculate scale - stretch vertically to make trees taller
    const targetHeight = maturityScale * depthScale * 600; // Much taller trees
    const aspectRatio = treeImage.width / treeImage.height;
    const displayHeight = targetHeight;
    const displayWidth = displayHeight * aspectRatio * 0.7; // Narrower width (70% of proportional)
    const alpha = 0.7 + depthFactor * 0.3; // Good opacity

    console.log(`Tree: ${tree.type}, Original: ${treeImage.width}x${treeImage.height}, Aspect: ${aspectRatio.toFixed(2)}, Display: ${displayWidth.toFixed(0)}x${displayHeight.toFixed(0)}`);

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.filter = 'brightness(0.85) contrast(1.1)'; // Darker trees with subtle contrast

    if (status === 'healthy') {
      this.ctx.drawImage(
        treeImage,
        x - displayWidth / 2,
        y - displayHeight / 2,
        displayWidth,
        displayHeight
      );
    } else if (status === 'burning') {
      // Fade out the tree as it burns
      const burningAlpha = alpha * 0.6; // Tree becomes more transparent
      this.ctx.globalAlpha = burningAlpha;
      this.ctx.filter = 'brightness(0.6) contrast(1.1)'; // Darker, charred look

      this.ctx.drawImage(
        treeImage,
        x - displayWidth / 2,
        y - displayHeight / 2,
        displayWidth,
        displayHeight
      );

      // Fire animation with multiple flames on the tree
      const time = Date.now() / 200;
      const flicker = Math.sin(time) * 10;

      // Main fire at top of tree
      this.ctx.globalAlpha = 0.8;
      this.ctx.filter = 'none';
      this.ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
      this.ctx.beginPath();
      this.ctx.ellipse(
        x,
        y - displayHeight * 0.3 + flicker,
        displayWidth * 0.15,
        displayHeight * 0.12,
        0,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      // Secondary flames
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
