import { ForestStorage } from '../storage/forestStorage';
import { Tree, WildfireState } from '../types';
import { distance, randomBetween } from '../utils/helpers';

export class WildfireController {
  private static readonly SPREAD_RATE = 0.1; // Base spread rate (trees per second)
  private static readonly SPREAD_DISTANCE = 50; // Maximum distance for fire to spread
  private static readonly ESCALATION_FACTOR = 1.5; // How much faster fire spreads over time

  static async startWildfire(): Promise<void> {
    const state = await ForestStorage.getForestState();
    
    if (state.wildfire.active) {
      return; // Already active
    }

    // Find a random tree to start the fire
    const healthyTrees = state.trees.filter(t => t.status === 'healthy');
    if (healthyTrees.length === 0) {
      return; // No trees to burn
    }

    const startTree = healthyTrees[Math.floor(Math.random() * healthyTrees.length)];
    
    const wildfire: WildfireState = {
      active: true,
      level: 0.1,
      affectedTreeIds: [startTree.id],
      startTime: Date.now(),
      spreadingRate: this.SPREAD_RATE
    };

    // Set the starting tree to burning
    await ForestStorage.updateTree(startTree.id, {
      status: 'burning',
      burnIntensity: 0.1
    });

    await ForestStorage.updateWildfire(wildfire);

    // Send notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: '🔥 Wildfire Alert!',
      message: 'A wildfire has started in your forest! Refocus to save your trees!'
    });
  }

  static async updateWildfire(): Promise<void> {
    const state = await ForestStorage.getForestState();
    
    if (!state.wildfire.active) {
      return;
    }

    const wildfire = state.wildfire;
    const now = Date.now();
    const elapsed = (now - (wildfire.startTime || now)) / 1000; // seconds

    // Increase wildfire level over time (exponential escalation)
    const newLevel = Math.min(1.0, wildfire.level + (0.01 * this.ESCALATION_FACTOR ** (elapsed / 60)));
    
    // Increase spreading rate over time
    const newSpreadingRate = wildfire.spreadingRate * (1 + elapsed / 300); // Faster over 5 minutes

    // Spread fire to nearby trees
    await this.spreadFire(state.trees, wildfire.affectedTreeIds, newSpreadingRate);

    // Update burning trees' intensity
    for (const treeId of wildfire.affectedTreeIds) {
      const tree = state.trees.find(t => t.id === treeId);
      if (tree && tree.status === 'burning') {
        const intensity = Math.min(1.0, (tree.burnIntensity || 0.1) + 0.05);
        
        // If intensity reaches 1.0, tree becomes burnt
        if (intensity >= 1.0) {
          await ForestStorage.updateTree(treeId, {
            status: 'burnt',
            burnIntensity: 1.0
          });
        } else {
          await ForestStorage.updateTree(treeId, {
            burnIntensity: intensity
          });
        }
      }
    }

    // Update wildfire state
    await ForestStorage.updateWildfire({
      level: newLevel,
      spreadingRate: newSpreadingRate
    });
  }

  static async spreadFire(trees: Tree[], affectedIds: string[], spreadingRate: number): Promise<void> {
    const burningTrees = trees.filter(t => affectedIds.includes(t.id) && t.status === 'burning');
    const healthyTrees = trees.filter(t => t.status === 'healthy');

    for (const burningTree of burningTrees) {
      for (const healthyTree of healthyTrees) {
        const dist = distance(burningTree.x, burningTree.y, healthyTree.x, healthyTree.y);
        
        // Check if tree is within spread distance
        if (dist <= this.SPREAD_DISTANCE) {
          // Probability of spreading based on distance and spreading rate
          const spreadProbability = (this.SPREAD_DISTANCE - dist) / this.SPREAD_DISTANCE * spreadingRate;
          
          if (Math.random() < spreadProbability) {
            // Spread fire to this tree
            await ForestStorage.updateTree(healthyTree.id, {
              status: 'burning',
              burnIntensity: 0.1
            });

            // Add to affected list
            const state = await ForestStorage.getForestState();
            if (!state.wildfire.affectedTreeIds.includes(healthyTree.id)) {
              await ForestStorage.updateWildfire({
                affectedTreeIds: [...state.wildfire.affectedTreeIds, healthyTree.id]
              });
            }
          }
        }
      }
    }
  }

  static async stopWildfire(): Promise<void> {
    const state = await ForestStorage.getForestState();
    
    if (!state.wildfire.active) {
      return;
    }

    // Stop the wildfire
    await ForestStorage.updateWildfire({
      active: false,
      level: 0,
      spreadingRate: 0.1
    });

    // Start recovery for burning trees
    const burningTrees = state.trees.filter(t => t.status === 'burning');
    for (const tree of burningTrees) {
      // Trees can recover if fire is stopped early
      if ((tree.burnIntensity || 0) < 0.7) {
        await ForestStorage.updateTree(tree.id, {
          status: 'recovering',
          burnIntensity: 0
        });
      }
    }

    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: '🌲 Fire Contained!',
      message: 'The wildfire has been stopped. Your forest is recovering!'
    });
  }

  static async recoverTrees(): Promise<void> {
    const state = await ForestStorage.getForestState();
    const recoveringTrees = state.trees.filter(t => t.status === 'recovering');

    for (const tree of recoveringTrees) {
      // Gradually recover trees
      const newHeight = Math.min(tree.height * 1.1, tree.height + 2); // Grow back slowly
      
      if (newHeight >= tree.height * 0.9) {
        // Tree has recovered
        await ForestStorage.updateTree(tree.id, {
          status: 'healthy',
          height: newHeight,
          burnIntensity: 0
        });
      } else {
        await ForestStorage.updateTree(tree.id, {
          height: newHeight
        });
      }
    }
  }
}

