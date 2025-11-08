import p5 from 'p5';
import { ForestState, Tree, Animal } from '../types';
import { TreeModel } from './Tree';
import { AnimalModel } from './Animal';

export class ForestRenderer {
  private p: p5;
  private forestState: ForestState;
  private groundY: number;
  private skyGradient: p5.Color[];

  constructor(p: p5, canvasWidth: number, canvasHeight: number) {
    this.p = p;
    this.groundY = canvasHeight - 100;
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

    // Create sky gradient colors
    this.skyGradient = [
      this.p.color(135, 206, 250), // Sky blue (top)
      this.p.color(176, 224, 230)  // Powder blue (bottom)
    ];
  }

  setForestState(state: ForestState): void {
    this.forestState = state;
  }

  setup(): void {
    this.p.noStroke();
  }

  draw(): void {
    this.drawSky();
    this.drawGround();
    this.drawTrees();
    this.drawAnimals();
    this.drawWildfire();
    this.drawSmoke();
  }

  private drawSky(): void {
    // Draw gradient sky using rectangles for better performance
    const steps = 50;
    for (let i = 0; i < steps; i++) {
      const y = (i / steps) * this.groundY;
      const inter = i / steps;
      const c = this.p.lerpColor(this.skyGradient[0], this.skyGradient[1], inter);
      this.p.fill(c);
      this.p.noStroke();
      this.p.rect(0, y, this.p.width, this.groundY / steps + 1);
    }
  }

  private drawGround(): void {
    // Draw ground
    this.p.fill(144, 238, 144); // Light green
    this.p.rect(0, this.groundY, this.p.width, this.p.height - this.groundY);
    
    // Draw grass texture
    this.p.fill(34, 139, 34); // Forest green
    for (let i = 0; i < this.p.width; i += 5) {
      if (Math.random() > 0.7) {
        this.p.rect(i, this.groundY, 2, 3);
      }
    }
  }

  private drawTrees(): void {
    for (const tree of this.forestState.trees) {
      this.drawTree(tree);
    }
  }

  private drawTree(tree: Tree): void {
    const treeColor = TreeModel.getColor(tree);
    
    if (tree.status === 'burnt') {
      // Draw burnt tree (simplified)
      this.p.fill(47, 47, 47); // Dark gray
      this.p.rect(tree.x - 3, tree.y - tree.height * 0.3, 6, tree.height * 0.3);
      return;
    }

    // Draw trunk
    this.p.fill(139, 69, 19); // Brown
    const trunkWidth = 8;
    const trunkHeight = tree.height * 0.4;
    this.p.rect(tree.x - trunkWidth / 2, tree.y - trunkHeight, trunkWidth, trunkHeight);

    // Draw foliage
    if (tree.status === 'healthy' || tree.status === 'recovering') {
      this.p.fill(treeColor);
      // Draw foliage as circles
      const foliageSize = tree.height * 0.6;
      this.p.ellipse(tree.x, tree.y - trunkHeight - foliageSize / 2, foliageSize, foliageSize);
      this.p.ellipse(tree.x - foliageSize * 0.3, tree.y - trunkHeight - foliageSize * 0.3, foliageSize * 0.7, foliageSize * 0.7);
      this.p.ellipse(tree.x + foliageSize * 0.3, tree.y - trunkHeight - foliageSize * 0.3, foliageSize * 0.7, foliageSize * 0.7);
    } else if (tree.status === 'burning') {
      // Draw burning tree with fire effect
      const intensity = tree.burnIntensity || 0.5;
      
      // Draw fire
      this.p.fill(255, Math.floor(165 * (1 - intensity)), 0); // Orange to red
      const fireHeight = trunkHeight * 0.5 * intensity;
      this.p.beginShape();
      this.p.vertex(tree.x - trunkWidth / 2, tree.y - trunkHeight);
      this.p.vertex(tree.x - trunkWidth / 2 - 5, tree.y - trunkHeight - fireHeight);
      this.p.vertex(tree.x, tree.y - trunkHeight - fireHeight * 1.2);
      this.p.vertex(tree.x + trunkWidth / 2 + 5, tree.y - trunkHeight - fireHeight);
      this.p.vertex(tree.x + trunkWidth / 2, tree.y - trunkHeight);
      this.p.endShape(this.p.CLOSE);
      
      // Draw charred trunk
      this.p.fill(47, 47, 47);
      this.p.rect(tree.x - trunkWidth / 2, tree.y - trunkHeight, trunkWidth, trunkHeight);
    }
  }

  private drawAnimals(): void {
    for (const animal of this.forestState.animals) {
      if (animal.status === 'visible' || animal.status === 'fleeing') {
        this.drawAnimal(animal);
      }
    }
  }

  private drawAnimal(animal: Animal): void {
    const animalColor = AnimalModel.getColor(animal);
    this.p.fill(animalColor);
    
    // Draw simple animal shape
    if (animal.type === 'deer') {
      // Draw deer body
      this.p.ellipse(animal.x, animal.y, 15, 10);
      // Draw head
      this.p.ellipse(animal.x + 8, animal.y - 3, 8, 6);
      // Draw legs
      this.p.rect(animal.x - 5, animal.y + 5, 2, 6);
      this.p.rect(animal.x + 3, animal.y + 5, 2, 6);
    } else if (animal.type === 'rabbit') {
      this.p.ellipse(animal.x, animal.y, 10, 8);
      this.p.ellipse(animal.x + 5, animal.y - 2, 6, 5);
    } else if (animal.type === 'bird') {
      this.p.ellipse(animal.x, animal.y, 8, 6);
      // Draw wings
      this.p.ellipse(animal.x - 3, animal.y, 4, 8);
      this.p.ellipse(animal.x + 3, animal.y, 4, 8);
    } else {
      // Generic animal
      this.p.ellipse(animal.x, animal.y, 12, 8);
    }
  }

  private drawWildfire(): void {
    if (!this.forestState.wildfire.active) {
      return;
    }

    const burningTrees = this.forestState.trees.filter(
      t => t.status === 'burning' && this.forestState.wildfire.affectedTreeIds.includes(t.id)
    );

    // Draw fire particles around burning trees
    for (const tree of burningTrees) {
      this.drawFireParticles(tree.x, tree.y - tree.height * 0.4, tree.burnIntensity || 0.5);
    }
  }

  private drawFireParticles(x: number, y: number, intensity: number): void {
    const particleCount = Math.floor(10 * intensity);
    
    for (let i = 0; i < particleCount; i++) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = -Math.random() * 15;
      const size = Math.random() * 3 + 1;
      
      // Fire color gradient
      const fireColors = [
        this.p.color(255, 255, 0),   // Yellow
        this.p.color(255, 165, 0),   // Orange
        this.p.color(255, 69, 0)     // Red-orange
      ];
      const color = fireColors[Math.floor(Math.random() * fireColors.length)];
      
      this.p.fill(color);
      this.p.noStroke();
      this.p.ellipse(x + offsetX, y + offsetY, size, size);
    }
  }

  private drawSmoke(): void {
    if (!this.forestState.wildfire.active) {
      return;
    }

    const burningTrees = this.forestState.trees.filter(
      t => t.status === 'burning' && this.forestState.wildfire.affectedTreeIds.includes(t.id)
    );

    for (const tree of burningTrees) {
      this.drawSmokeParticles(tree.x, tree.y - tree.height * 0.6, tree.burnIntensity || 0.5);
    }
  }

  private drawSmokeParticles(x: number, y: number, intensity: number): void {
    const particleCount = Math.floor(5 * intensity);
    
    for (let i = 0; i < particleCount; i++) {
      const offsetX = (Math.random() - 0.5) * 30;
      const offsetY = -Math.random() * 30 - 10;
      const size = Math.random() * 8 + 5;
      const alpha = Math.random() * 100 + 50;
      
      this.p.fill(105, 105, 105, alpha); // Gray smoke
      this.p.noStroke();
      this.p.ellipse(x + offsetX, y + offsetY, size, size);
    }
  }
}

