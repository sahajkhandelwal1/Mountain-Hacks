import { SessionStorage } from '../shared/storage/sessionStorage';
import { ForestStorage } from '../shared/storage/forestStorage';
import { FocusMonitor } from '../shared/monitoring/focusMonitor';
import { AIAssetGenerator } from '../shared/api/aiAssets';
import { generateId } from '../shared/utils/helpers';
import { Tree, Animal } from '../shared/types';
import { getRandomTreeType, getRandomAnimalType, randomBetween } from '../shared/utils/helpers';

export class SessionManager {
  // Utility to reposition all trees to center
  static async repositionTreesToCenter(): Promise<void> {
    const forest = await ForestStorage.getForestState();
    const groundY = 200;
    const centerX = 960;
    const spread = 500;
    
    for (let i = 0; i < forest.trees.length; i++) {
      const tree = forest.trees[i];
      await ForestStorage.updateTree(tree.id, {
        x: centerX - spread/2 + randomBetween(0, spread),
        y: groundY
      });
    }
    console.log('Repositioned', forest.trees.length, 'trees to center');
  }

  static async startSession(): Promise<string> {
    const sessionId = generateId();
    
    console.log('🌱 Starting new session:', sessionId);
    
    // Initialize session state
    await SessionStorage.startSession(sessionId);
    
    // Clear old forest and create fresh one
    await this.createInitialForest();
    
    // Mark forest as active
    await ForestStorage.updateForestState({ sessionActive: true });
    
    // Reset focus metrics
    await FocusMonitor.clearFocusMetrics();
    const defaultMetrics = FocusMonitor.getDefaultFocusMetrics();
    await FocusMonitor.setFocusMetrics(defaultMetrics);
    
    // Generate starter assets
    try {
      const assets = await AIAssetGenerator.generateStarterAssets();
      console.log('Generated starter assets:', assets.length);
    } catch (error) {
      console.error('Error generating starter assets:', error);
    }
    
    return sessionId;
  }

  static async endSession(): Promise<void> {
    await SessionStorage.endSession();
    
    // Optionally clear forest or keep it for visualization
    // await ForestStorage.clearForest();
  }

  static async resumeSession(): Promise<boolean> {
    const session = await SessionStorage.resumeSession();
    if (session) {
      // Restore focus monitoring
      const metrics = await FocusMonitor.getFocusMetrics();
      if (!metrics.activeTabId) {
        // Restore default metrics if needed
        await FocusMonitor.setFocusMetrics(FocusMonitor.getDefaultFocusMetrics());
      }
      return true;
    }
    return false;
  }

  static async createInitialForest(): Promise<void> {
    // Clear any existing forest first
    await ForestStorage.clearForest();
    
    // Create a few starter trees (small saplings)
    const treeCount = 5;
    // Position trees in the CENTER of the screen
    // Canvas is 40vh tall (~400px) and full width (~1920px)
    const groundY = 200; // Higher up in canvas
    const centerX = 960; // Center of typical 1920px screen
    const spread = 600; // Spread them out even more
    
    for (let i = 0; i < treeCount; i++) {
      const tree: Tree = {
        id: generateId(),
        type: getRandomTreeType(),
        height: randomBetween(80, 180), // Varied heights for visual interest
        x: centerX - spread/2 + randomBetween(0, spread),
        y: groundY,
        status: 'healthy',
        age: 0,
        growthStage: 2 // Start at mature stage
      };
      console.log('Creating tree:', tree);
      await ForestStorage.addTree(tree);
    }
    
    const forest = await ForestStorage.getForestState();
    console.log('Forest after creation:', forest.trees.length, 'trees');
  }

  static async addTreeOnFocusTick(focusScore: number): Promise<void> {
    // Grow existing trees first
    await this.growExistingTrees();
    
    // Add new sapling every tick
    const groundY = 200; // Higher up in canvas
    const centerX = 960; // Center of screen
    const spread = 600; // Spread them out even more
    
    const tree: Tree = {
      id: generateId(),
      type: getRandomTreeType(),
      height: randomBetween(80, 180), // Varied heights for visual interest
      x: centerX - spread/2 + randomBetween(0, spread),
      y: groundY,
      status: 'healthy',
      age: 0,
      growthStage: 2 // Start at mature stage
    };
    
    console.log('Adding new sapling:', tree);
    
    // Try to generate AI asset for the tree
    try {
      const asset = await AIAssetGenerator.generateDynamicAsset(focusScore, 'tree');
      tree.assetUrl = asset.url;
    } catch (error) {
      console.error('Error generating tree asset:', error);
    }
    
    await ForestStorage.addTree(tree);
  }

  static async growExistingTrees(): Promise<void> {
    const forest = await ForestStorage.getForestState();
    
    for (const tree of forest.trees) {
      if (tree.status === 'healthy' || tree.status === 'recovering') {
        // Increment age
        tree.age = (tree.age || 0) + 1;
        
        // Grow tree based on age
        const maxHeight = 200; // Increased max size
        const growthRate = 5; // Faster growth for demo
        
        if (tree.height < maxHeight) {
          tree.height = Math.min(maxHeight, tree.height + growthRate);
        }
        
        // Update growth stage
        if (tree.height < 30) {
          tree.growthStage = 0; // Sapling
        } else if (tree.height < 50) {
          tree.growthStage = 1; // Young
        } else if (tree.height < 75) {
          tree.growthStage = 2; // Mature
        } else {
          tree.growthStage = 3; // Full grown
        }
        
        await ForestStorage.updateTree(tree.id, { 
          height: tree.height, 
          age: tree.age,
          growthStage: tree.growthStage 
        });
      }
    }
  }

  static async addAnimal(focusScore: number): Promise<void> {
    const groundY = 200;
    const centerX = 960;
    const spread = 600;
    const animal: Animal = {
      id: generateId(),
      type: getRandomAnimalType(),
      x: centerX - spread/2 + randomBetween(0, spread),
      y: groundY - 10,
      status: 'visible'
    };
    
    // Try to generate AI asset for the animal
    try {
      const asset = await AIAssetGenerator.generateDynamicAsset(focusScore, 'animal');
      animal.assetUrl = asset.url;
    } catch (error) {
      console.error('Error generating animal asset:', error);
    }
    
    await ForestStorage.addAnimal(animal);
  }
}

