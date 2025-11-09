import { ForestStorage } from '../storage/forestStorage';
import { Tree, WildfireState } from '../types';
import { distance, randomBetween } from '../utils/helpers';

export class WildfireController {
  private static readonly SPREAD_RATE = 0.5; // Base spread rate (faster initial spread)
  private static readonly SPREAD_DISTANCE = 250; // Much larger spread distance to reach nearby trees
  private static readonly ESCALATION_FACTOR = 1.5; // Exponential escalation

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

    // Exponential escalation - fire spreads faster and faster
    const escalationMultiplier = Math.pow(this.ESCALATION_FACTOR, elapsed / 30); // Doubles every 30 seconds
    const newLevel = Math.min(1.0, wildfire.level + (0.02 * escalationMultiplier));
    
    // Exponentially increase spreading rate
    const newSpreadingRate = wildfire.spreadingRate * escalationMultiplier;
    
    console.log(`🔥 Wildfire update: ${elapsed.toFixed(1)}s elapsed, escalation: ${escalationMultiplier.toFixed(2)}x, spread rate: ${newSpreadingRate.toFixed(2)}`);

    // Spread fire to nearby trees (more aggressive)
    await this.spreadFire(state.trees, wildfire.affectedTreeIds, newSpreadingRate);

    // Update burning trees' intensity - burn MUCH faster
    for (const treeId of wildfire.affectedTreeIds) {
      const tree = state.trees.find(t => t.id === treeId);
      if (tree && tree.status === 'burning') {
        // Trees burn faster as wildfire escalates
        const burnRate = 0.05 * escalationMultiplier; // Slower burn rate so trees stay burning longer
        const intensity = Math.min(1.0, (tree.burnIntensity || 0.1) + burnRate);
        
        console.log(`🔥 Tree ${treeId} burning: intensity ${intensity.toFixed(2)}`);
        
        // If intensity reaches 1.0, tree becomes burnt
        if (intensity >= 1.0) {
          await ForestStorage.updateTree(treeId, {
            status: 'burnt',
            burnIntensity: 1.0
          });
          console.log(`💀 Tree ${treeId} fully burnt`);
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

    console.log(`🔥 Spread attempt: ${burningTrees.length} burning trees, ${healthyTrees.length} healthy trees, spread rate: ${spreadingRate.toFixed(2)}`);

    // Track newly ignited trees to update affectedTreeIds in one batch
    const newlyIgnitedIds: string[] = [];

    // Exponential spread - each burning tree can ignite multiple trees
    for (const burningTree of burningTrees) {
      // Sort healthy trees by distance
      const nearbyTrees = healthyTrees
        .map(tree => ({
          tree,
          dist: distance(burningTree.x, burningTree.y, tree.x, tree.y)
        }))
        .filter(({ dist }) => dist <= this.SPREAD_DISTANCE)
        .sort((a, b) => a.dist - b.dist);
      
      console.log(`🔥 Burning tree ${burningTree.id} at (${burningTree.x}, ${burningTree.y}) has ${nearbyTrees.length} nearby trees within ${this.SPREAD_DISTANCE}px`);

      // Each burning tree can spread to multiple nearby trees (exponential)
      const maxSpreadPerTree = Math.ceil(spreadingRate * 5); // Can spread to multiple trees at once
      let spreadCount = 0;

      for (const { tree: healthyTree, dist } of nearbyTrees) {
        if (spreadCount >= maxSpreadPerTree) break;
        
        // Skip if already ignited in this cycle
        if (newlyIgnitedIds.includes(healthyTree.id)) continue;

        // Much higher probability of spreading - exponential growth
        // Base probability starts at 0.8 for closest trees and decreases with distance
        const distanceFactor = (this.SPREAD_DISTANCE - dist) / this.SPREAD_DISTANCE;
        const spreadProbability = Math.min(0.95, 0.5 + (distanceFactor * spreadingRate));
        
        console.log(`🔥 Spread check: tree ${healthyTree.id} at ${dist.toFixed(0)}px, probability: ${(spreadProbability * 100).toFixed(1)}%`);
        
        if (Math.random() < spreadProbability) {
          // Spread fire to this tree
          await ForestStorage.updateTree(healthyTree.id, {
            status: 'burning',
            burnIntensity: 0.2 // Start with higher intensity
          });

          newlyIgnitedIds.push(healthyTree.id);
          spreadCount++;
          console.log(`🔥 Fire spread from tree ${burningTree.id} to ${healthyTree.id} (${spreadCount}/${maxSpreadPerTree})`);
        }
      }
    }

    // Update affectedTreeIds in one batch if any new trees were ignited
    if (newlyIgnitedIds.length > 0) {
      const state = await ForestStorage.getForestState();
      const updatedAffectedIds = [...new Set([...state.wildfire.affectedTreeIds, ...newlyIgnitedIds])];
      await ForestStorage.updateWildfire({
        affectedTreeIds: updatedAffectedIds
      });
      console.log(`🔥 Added ${newlyIgnitedIds.length} newly burning trees. Total burning: ${updatedAffectedIds.length}`);
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

