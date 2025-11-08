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
    
    // Create initial trees (optional - can start empty)
    // await this.createInitialForest();
    
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
    // Create a few starter trees
    const treeCount = 3;
    for (let i = 0; i < treeCount; i++) {
      const tree: Tree = {
        id: generateId(),
        type: getRandomTreeType(),
        height: randomBetween(20, 40),
        x: randomBetween(50, 350),
        y: randomBetween(200, 280),
        status: 'healthy',
        age: 0
      };
      await ForestStorage.addTree(tree);
    }
  }

  static async addTreeOnFocusTick(focusScore: number): Promise<void> {
    // Add a tree based on focus score
    // Higher focus score = better tree
    const shouldAddTree = focusScore > 0.5 && Math.random() > 0.3; // 70% chance if focused
    
    if (shouldAddTree) {
      const tree: Tree = {
        id: generateId(),
        type: getRandomTreeType(),
        height: randomBetween(15, 35) * (focusScore),
        x: randomBetween(50, 350),
        y: randomBetween(200, 280),
        status: 'healthy',
        age: 0
      };
      
      // Try to generate AI asset for the tree
      try {
        const asset = await AIAssetGenerator.generateDynamicAsset(focusScore, 'tree');
        tree.assetUrl = asset.url;
      } catch (error) {
        console.error('Error generating tree asset:', error);
      }
      
      await ForestStorage.addTree(tree);
      
      // Add animal every 5 trees
      const treeCount = await ForestStorage.getTreeCount();
      if (treeCount > 0 && treeCount % 5 === 0) {
        await this.addAnimal(focusScore);
      }
    }
  }

  static async addAnimal(focusScore: number): Promise<void> {
    const animal: Animal = {
      id: generateId(),
      type: getRandomAnimalType(),
      x: randomBetween(100, 300),
      y: randomBetween(220, 270),
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

