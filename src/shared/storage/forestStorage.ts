import { ForestState, Tree, Animal, WildfireState, STORAGE_KEYS } from '../types';

export class ForestStorage {
  static async getForestState(): Promise<ForestState> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.FOREST_STATE);
    return result[STORAGE_KEYS.FOREST_STATE] || this.getDefaultForestState();
  }

  static async setForestState(state: ForestState): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.FOREST_STATE]: state });
  }

  static async updateForestState(updates: Partial<ForestState>): Promise<void> {
    const current = await this.getForestState();
    await this.setForestState({ ...current, ...updates });
  }

  static async addTree(tree: Tree): Promise<void> {
    const state = await this.getForestState();
    state.trees.push(tree);
    state.lastUpdate = Date.now();
    await this.setForestState(state);
  }

  static async updateTree(treeId: string, updates: Partial<Tree>): Promise<void> {
    const state = await this.getForestState();
    const index = state.trees.findIndex(t => t.id === treeId);
    if (index !== -1) {
      state.trees[index] = { ...state.trees[index], ...updates };
      state.lastUpdate = Date.now();
      await this.setForestState(state);
    }
  }

  static async removeTree(treeId: string): Promise<void> {
    const state = await this.getForestState();
    state.trees = state.trees.filter(t => t.id !== treeId);
    state.lastUpdate = Date.now();
    await this.setForestState(state);
  }

  static async addAnimal(animal: Animal): Promise<void> {
    const state = await this.getForestState();
    state.animals.push(animal);
    state.lastUpdate = Date.now();
    await this.setForestState(state);
  }

  static async updateAnimal(animalId: string, updates: Partial<Animal>): Promise<void> {
    const state = await this.getForestState();
    const index = state.animals.findIndex(a => a.id === animalId);
    if (index !== -1) {
      state.animals[index] = { ...state.animals[index], ...updates };
      state.lastUpdate = Date.now();
      await this.setForestState(state);
    }
  }

  static async updateWildfire(wildfire: Partial<WildfireState>): Promise<void> {
    const state = await this.getForestState();
    state.wildfire = { ...state.wildfire, ...wildfire };
    state.lastUpdate = Date.now();
    await this.setForestState(state);
  }

  static async initializeForest(): Promise<void> {
    const state = this.getDefaultForestState();
    state.sessionActive = true;
    await this.setForestState(state);
  }

  static async clearForest(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.FOREST_STATE);
  }

  static getDefaultForestState(): ForestState {
    return {
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

  static async getTreeCount(): Promise<number> {
    const state = await this.getForestState();
    return state.trees.filter(t => t.status === 'healthy').length;
  }

  static async getBurnedTreeCount(): Promise<number> {
    const state = await this.getForestState();
    return state.trees.filter(t => t.status === 'burnt').length;
  }

  static async getBurningTreeCount(): Promise<number> {
    const state = await this.getForestState();
    return state.trees.filter(t => t.status === 'burning').length;
  }
}

