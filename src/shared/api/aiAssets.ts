import { AssetRequest, AssetResponse, APIConfig, STORAGE_KEYS } from '../types';
import { APIConfigManager } from './config';

export class AIAssetGenerator {
  private static async getCachedAsset(key: string): Promise<AssetResponse | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CACHED_ASSETS);
    const cached = result[STORAGE_KEYS.CACHED_ASSETS] || {};
    return cached[key] || null;
  }

  private static async cacheAsset(key: string, asset: AssetResponse): Promise<void> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CACHED_ASSETS);
    const cached = result[STORAGE_KEYS.CACHED_ASSETS] || {};
    cached[key] = asset;
    await chrome.storage.local.set({ [STORAGE_KEYS.CACHED_ASSETS]: cached });
  }

  private static generateCacheKey(request: AssetRequest): string {
    return `${request.type}_${request.category || 'default'}_${request.style || 'default'}_${request.focusScore || 100}`;
  }

  static async generateAsset(request: AssetRequest): Promise<AssetResponse> {
    const config = await APIConfigManager.getConfig();
    const cacheKey = this.generateCacheKey(request);

    // Check cache first if enabled
    if (config.useCache) {
      const cached = await this.getCachedAsset(cacheKey);
      if (cached) {
        return cached;
      }
    }

    let asset: AssetResponse;

    switch (config.provider) {
      case 'openai':
        asset = await this.generateOpenAIAsset(request, config);
        break;
      case 'stability':
        asset = await this.generateStabilityAsset(request, config);
        break;
      case 'mock':
      default:
        asset = await this.generateMockAsset(request);
        break;
    }

    // Cache the asset
    if (config.useCache) {
      await this.cacheAsset(cacheKey, asset);
    }

    return asset;
  }

  private static async generateMockAsset(request: AssetRequest): Promise<AssetResponse> {
    // Mock implementation - returns placeholder data
    // In a real implementation, this would generate or fetch actual images
    
    const id = `mock_${request.type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Generate a data URL for a simple colored rectangle as placeholder
    // In production, this would be replaced with actual AI-generated images
    // Note: In service worker context, we can't use document.createElement
    // For now, return a placeholder URL that components can handle
    let dataUrl = 'data:image/svg+xml;base64,';
    
    // Create a simple SVG as placeholder
    const svg = request.type === 'tree' 
      ? '<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect fill="#228B22" x="10" y="30" width="44" height="34"/><rect fill="#8B4513" x="27" y="50" width="10" height="14"/></svg>'
      : request.type === 'animal'
      ? '<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><ellipse fill="#8B4513" cx="32" cy="32" rx="20" ry="15"/></svg>'
      : '<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect fill="#FFD700" x="20" y="20" width="24" height="24"/></svg>';
    
    dataUrl += btoa(svg);

    return {
      id,
      url: dataUrl,
      type: request.type,
      metadata: {
        generated: Date.now(),
        provider: 'mock',
        category: request.category || 'default',
        style: request.style || 'default'
      }
    };
  }

  private static async generateOpenAIAsset(request: AssetRequest, config: APIConfig): Promise<AssetResponse> {
    // Real OpenAI DALL-E integration structure
    // This is ready for implementation when API key is provided
    
    if (!config.apiKey) {
      console.warn('OpenAI API key not set, falling back to mock');
      return this.generateMockAsset(request);
    }

    try {
      // TODO: Implement OpenAI DALL-E API call
      // const response = await fetch('https://api.openai.com/v1/images/generations', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${config.apiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     model: 'dall-e-3',
      //     prompt: this.buildPrompt(request),
      //     n: 1,
      //     size: '256x256'
      //   })
      // });
      // const data = await response.json();
      // return {
      //   id: data.data[0].id,
      //   url: data.data[0].url,
      //   type: request.type,
      //   metadata: { ... }
      // };

      // For now, fall back to mock
      return this.generateMockAsset(request);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.generateMockAsset(request);
    }
  }

  private static async generateStabilityAsset(request: AssetRequest, config: APIConfig): Promise<AssetResponse> {
    // Real Stability AI integration structure
    // This is ready for implementation when API key is provided
    
    if (!config.apiKey) {
      console.warn('Stability AI API key not set, falling back to mock');
      return this.generateMockAsset(request);
    }

    try {
      // TODO: Implement Stability AI API call
      // const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${config.apiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     text_prompts: [{ text: this.buildPrompt(request) }],
      //     cfg_scale: 7,
      //     height: 512,
      //     width: 512,
      //     steps: 30
      //   })
      // });
      // const data = await response.json();
      // return {
      //   id: data.id,
      //   url: data.artifacts[0].base64,
      //   type: request.type,
      //   metadata: { ... }
      // };

      // For now, fall back to mock
      return this.generateMockAsset(request);
    } catch (error) {
      console.error('Stability AI API error:', error);
      return this.generateMockAsset(request);
    }
  }

  private static buildPrompt(request: AssetRequest): string {
    const typeDescriptions: Record<string, string> = {
      tree: 'a beautiful tree',
      animal: 'a forest animal',
      decoration: 'a forest decoration'
    };

    const focusDescriptions: Record<number, string> = {
      100: 'vibrant and healthy',
      80: 'healthy and growing',
      60: 'moderate health',
      40: 'struggling',
      20: 'damaged'
    };

    const focusScore = request.focusScore || 100;
    const focusDesc = focusDescriptions[Math.floor(focusScore / 20) * 20] || 'healthy';
    const typeDesc = typeDescriptions[request.type] || 'forest element';

    return `${focusDesc} ${typeDesc}, 2D pixel art style, simple and clean, forest theme`;
  }

  static async generateStarterAssets(): Promise<AssetResponse[]> {
    const requests: AssetRequest[] = [
      { type: 'tree', category: 'oak', focusScore: 100 },
      { type: 'tree', category: 'pine', focusScore: 100 },
      { type: 'animal', category: 'deer', focusScore: 100 },
      { type: 'decoration', category: 'flower', focusScore: 100 }
    ];

    return Promise.all(requests.map(req => this.generateAsset(req)));
  }

  static async generateDynamicAsset(focusScore: number, type: 'tree' | 'animal' | 'decoration'): Promise<AssetResponse> {
    return this.generateAsset({
      type,
      focusScore,
      category: type === 'tree' ? 'dynamic' : type === 'animal' ? 'wildlife' : 'natural'
    });
  }
}

