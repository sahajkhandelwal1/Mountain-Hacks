import { APIConfigManager } from './config';

export interface WebsiteClassification {
  url: string;
  domain: string;
  category: 'productive' | 'neutral' | 'distracting';
  score: number; // 0-100, higher = more productive
  reasoning: string;
  timestamp: number;
}

export class WebsiteClassifier {
  private static readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static readonly CACHE_KEY = 'websiteClassifications';

  private static readonly SYSTEM_PROMPT = `You are a productivity analyzer. Classify websites as productive, neutral, or distracting for work/study.

Return JSON with:
- category: "productive", "neutral", or "distracting"
- score: 0-100 (0=very distracting, 50=neutral, 100=very productive)
- reasoning: Brief explanation

Examples:
- github.com: productive (coding/collaboration)
- youtube.com: distracting (entertainment)
- gmail.com: neutral (necessary communication)
- stackoverflow.com: productive (learning/problem-solving)
- twitter.com: distracting (social media)
- notion.so: productive (productivity tool)`;

  static async classifyWebsite(url: string): Promise<WebsiteClassification> {
    const domain = this.extractDomain(url);
    
    // Check cache first
    const cached = await this.getCachedClassification(domain);
    if (cached) {
      return cached;
    }

    const config = await APIConfigManager.getConfig();
    
    if (config.provider === 'mock' || !config.apiKey) {
      return this.getHeuristicClassification(url, domain);
    }

    try {
      if (config.provider === 'openai') {
        const classification = await this.classifyWithOpenAI(url, domain, config.apiKey);
        await this.cacheClassification(classification);
        return classification;
      } else {
        return this.getHeuristicClassification(url, domain);
      }
    } catch (error) {
      console.error('Website classification error:', error);
      return this.getHeuristicClassification(url, domain);
    }
  }

  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  private static async classifyWithOpenAI(
    url: string,
    domain: string,
    apiKey: string
  ): Promise<WebsiteClassification> {
    const prompt = `Classify this website for productivity:

Domain: ${domain}
Full URL: ${url}

Is this website productive, neutral, or distracting for work/study?`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    const analysis = JSON.parse(content);

    return {
      url,
      domain,
      category: analysis.category || 'neutral',
      score: Math.max(0, Math.min(100, analysis.score || 50)),
      reasoning: analysis.reasoning || 'Classification complete',
      timestamp: Date.now()
    };
  }

  private static getHeuristicClassification(url: string, domain: string): WebsiteClassification {
    // Productive sites
    const productivePatterns = [
      'github.com', 'gitlab.com', 'stackoverflow.com', 'stackexchange.com',
      'docs.', 'developer.', 'learn.', 'education', 'coursera', 'udemy',
      'notion.so', 'trello.com', 'asana.com', 'monday.com',
      'google.com/docs', 'google.com/sheets', 'google.com/slides',
      'overleaf.com', 'latex', 'jupyter', 'colab.research.google',
      'medium.com', 'dev.to', 'hackernoon', 'freecodecamp'
    ];

    // Distracting sites
    const distractingPatterns = [
      'youtube.com', 'youtu.be', 'facebook.com', 'fb.com',
      'instagram.com', 'twitter.com', 'x.com', 'tiktok.com',
      'reddit.com', 'twitch.tv', 'netflix.com', 'hulu.com',
      'discord.com', 'snapchat.com', 'pinterest.com',
      'buzzfeed', 'dailymail', 'tmz.com', 'espn.com'
    ];

    // Neutral sites
    const neutralPatterns = [
      'gmail.com', 'outlook.com', 'mail.', 'calendar.',
      'zoom.us', 'meet.google', 'teams.microsoft',
      'slack.com', 'amazon.com', 'google.com/search'
    ];

    const lowerUrl = url.toLowerCase();
    const lowerDomain = domain.toLowerCase();

    if (productivePatterns.some(p => lowerUrl.includes(p) || lowerDomain.includes(p))) {
      return {
        url,
        domain,
        category: 'productive',
        score: 85,
        reasoning: 'Identified as a productive/educational website',
        timestamp: Date.now()
      };
    }

    if (distractingPatterns.some(p => lowerUrl.includes(p) || lowerDomain.includes(p))) {
      return {
        url,
        domain,
        category: 'distracting',
        score: 20,
        reasoning: 'Identified as an entertainment/social media website',
        timestamp: Date.now()
      };
    }

    if (neutralPatterns.some(p => lowerUrl.includes(p) || lowerDomain.includes(p))) {
      return {
        url,
        domain,
        category: 'neutral',
        score: 50,
        reasoning: 'Identified as a necessary communication/utility tool',
        timestamp: Date.now()
      };
    }

    // Default to neutral for unknown sites
    return {
      url,
      domain,
      category: 'neutral',
      score: 55,
      reasoning: 'Unknown website, classified as neutral',
      timestamp: Date.now()
    };
  }

  private static async getCachedClassification(domain: string): Promise<WebsiteClassification | null> {
    try {
      const result = await chrome.storage.local.get(this.CACHE_KEY);
      const cache = result[this.CACHE_KEY] || {};
      const cached = cache[domain];

      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached;
      }
    } catch (error) {
      console.error('Error reading classification cache:', error);
    }
    return null;
  }

  private static async cacheClassification(classification: WebsiteClassification): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.CACHE_KEY);
      const cache = result[this.CACHE_KEY] || {};
      cache[classification.domain] = classification;
      await chrome.storage.local.set({ [this.CACHE_KEY]: cache });
    } catch (error) {
      console.error('Error caching classification:', error);
    }
  }

  static async clearCache(): Promise<void> {
    await chrome.storage.local.remove(this.CACHE_KEY);
  }
}
