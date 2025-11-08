import { APIConfig, STORAGE_KEYS } from '../types';

export class APIConfigManager {
  static async getConfig(): Promise<APIConfig> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.API_CONFIG);
    return result[STORAGE_KEYS.API_CONFIG] || this.getDefaultConfig();
  }

  static async setConfig(config: APIConfig): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.API_CONFIG]: config });
  }

  static async updateConfig(updates: Partial<APIConfig>): Promise<void> {
    const current = await this.getConfig();
    await this.setConfig({ ...current, ...updates });
  }

  static getDefaultConfig(): APIConfig {
    return {
      provider: 'mock',
      apiKey: undefined,
      baseUrl: undefined,
      useCache: true
    };
  }

  static async setAPIKey(apiKey: string): Promise<void> {
    await this.updateConfig({ apiKey });
  }

  static async setProvider(provider: 'openai' | 'stability' | 'mock'): Promise<void> {
    await this.updateConfig({ provider });
  }
}

