import { DistractionSite, STORAGE_KEYS } from '../types';

export class DistractionDetector {
  private static defaultDistractionSites: DistractionSite[] = [
    { domain: 'youtube.com', enabled: true, penalty: 0.15 },
    { domain: 'facebook.com', enabled: true, penalty: 0.12 },
    { domain: 'instagram.com', enabled: true, penalty: 0.12 },
    { domain: 'twitter.com', enabled: true, penalty: 0.10 },
    { domain: 'x.com', enabled: true, penalty: 0.10 },
    { domain: 'reddit.com', enabled: true, penalty: 0.08 },
    { domain: 'tiktok.com', enabled: true, penalty: 0.15 },
    { domain: 'netflix.com', enabled: true, penalty: 0.20 },
    { domain: 'twitch.tv', enabled: true, penalty: 0.12 },
    { domain: 'discord.com', enabled: true, penalty: 0.08 }
  ];

  static async getDistractionSites(): Promise<DistractionSite[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.DISTRACTION_SITES);
    return result[STORAGE_KEYS.DISTRACTION_SITES] || this.defaultDistractionSites;
  }

  static async setDistractionSites(sites: DistractionSite[]): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.DISTRACTION_SITES]: sites });
  }

  static async isDistractionSite(url: string): Promise<{ isDistraction: boolean; penalty: number }> {
    if (!url) return { isDistraction: false, penalty: 0 };
    
    try {
      const urlObj = new URL(url);
      const sites = await this.getDistractionSites();
      
      for (const site of sites) {
        if (site.enabled && urlObj.hostname.includes(site.domain)) {
          return { isDistraction: true, penalty: site.penalty };
        }
      }
    } catch (e) {
      // Invalid URL
      return { isDistraction: false, penalty: 0 };
    }
    
    return { isDistraction: false, penalty: 0 };
  }

  static async getFocusPenalty(url: string): Promise<number> {
    const { penalty } = await this.isDistractionSite(url);
    return penalty;
  }

  static async addDistractionSite(domain: string, penalty: number = 0.1): Promise<void> {
    const sites = await this.getDistractionSites();
    if (!sites.find(s => s.domain === domain)) {
      sites.push({ domain, enabled: true, penalty });
      await this.setDistractionSites(sites);
    }
  }

  static async removeDistractionSite(domain: string): Promise<void> {
    const sites = await this.getDistractionSites();
    const filtered = sites.filter(s => s.domain !== domain);
    await this.setDistractionSites(filtered);
  }

  static async toggleDistractionSite(domain: string, enabled: boolean): Promise<void> {
    const sites = await this.getDistractionSites();
    const site = sites.find(s => s.domain === domain);
    if (site) {
      site.enabled = enabled;
      await this.setDistractionSites(sites);
    }
  }
}

