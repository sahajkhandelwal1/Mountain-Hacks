import { SessionStorage } from '../shared/storage/sessionStorage';
import { ForestStorage } from '../shared/storage/forestStorage';
import { FocusMonitor } from '../shared/monitoring/focusMonitor';
import { AIAssetGenerator } from '../shared/api/aiAssets';
import { generateId } from '../shared/utils/helpers';
import { Tree, Animal } from '../shared/types';
import { getRandomTreeType, getRandomAnimalType, randomBetween } from '../shared/utils/helpers';

export class SessionManager {
  static async startSession(): Promise<string> {
    const sessionId = generateId();
    
    // Initialize session state
    await SessionStorage.startSession(sessionId);
    
    // Initialize forest
    await ForestStorage.initializeForest();
    
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
    
    // Create initial trees
    await this.createInitialForest();
    
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
    const groundY = 500; // Match canvas groundY
    
    for (let i = 0; i < treeCount; i++) {
      const tree: Tree = {
        id: generateId(),
        type: getRandomTreeType(),
        height: randomBetween(10, 20), // Start small
        x: randomBetween(100, 700),
        y: groundY,
        status: 'healthy',
        age: 0,
        growthStage: 0 // 0 = sapling, 1 = young, 2 = mature, 3 = full grown
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
    const groundY = 500;
    
    const tree: Tree = {
      id: generateId(),
      type: getRandomTreeType(),
      height: randomBetween(10, 20), // Start as small sapling
      x: randomBetween(100, 700),
      y: groundY,
      status: 'healthy',
      age: 0,
      growthStage: 0
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
        const maxHeight = 100;
        const growthRate = 2; // pixels per tick
        
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
    const groundY = 500;
    const animal: Animal = {
      id: generateId(),
      type: getRandomAnimalType(),
      x: randomBetween(150, 650),
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

