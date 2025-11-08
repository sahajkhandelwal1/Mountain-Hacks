import { FocusMetrics, ActivityEvent } from '../types';
import { APIConfigManager } from './config';
import { WebsiteClassifier } from './websiteClassifier';

export interface FocusAnalysisRequest {
  currentUrl: string;
  tabSwitchCount: number;
  timeOnCurrentSite: number;
  recentUrls: string[];
  userActivity: {
    mouseMovements: number;
    keystrokes: number;
    scrolls: number;
  };
  sessionDuration: number;
  distractionSiteVisits: number;
}

export interface FocusAnalysisResponse {
  focusScore: number; // 0-100
  reasoning: string;
  suggestions: string[];
  distractionLevel: 'low' | 'medium' | 'high';
}

export class LLMFocusAnalyzer {
  private static readonly SYSTEM_PROMPT = `You are a focus and productivity analyzer. Calculate an adaptive focus score (0-100) based on multiple factors.

Return JSON with:
- focusScore (0-100): Adaptive score considering ALL factors
- reasoning: Brief explanation of score calculation
- suggestions: Array of 2-3 actionable tips
- distractionLevel: 'low', 'medium', or 'high'

Scoring factors (weighted):
1. Website type (40%): Productive tools/docs = high, entertainment/social = low
2. Time on site (25%): Longer focused time = higher score
3. Tab switching (20%): Frequent switching = lower score
4. Session context (15%): Overall session behavior

Be adaptive - same site can have different scores based on behavior:
- GitHub with 10min focus + few switches = 90
- GitHub with 30sec + many switches = 60
- YouTube educational with 15min focus = 70
- YouTube entertainment with quick switches = 20`;

  static async analyzeFocus(data: FocusAnalysisRequest): Promise<FocusAnalysisResponse> {
    const config = await APIConfigManager.getConfig();
    
    if (config.provider === 'mock' || !config.apiKey) {
      return await this.getMockAnalysis(data);
    }

    try {
      if (config.provider === 'openai') {
        return await this.analyzeWithOpenAI(data, config.apiKey);
      } else {
        console.warn('Unsupported LLM provider, using mock');
        return await this.getMockAnalysis(data);
      }
    } catch (error) {
      console.error('LLM analysis error:', error);
      return await this.getMockAnalysis(data);
    }
  }

  private static async analyzeWithOpenAI(
    data: FocusAnalysisRequest,
    apiKey: string
  ): Promise<FocusAnalysisResponse> {
    const minutesOnSite = Math.floor(data.timeOnCurrentSite / 1000 / 60);
    const secondsOnSite = Math.floor(data.timeOnCurrentSite / 1000) % 60;
    
    const prompt = `Calculate adaptive focus score:

Current URL: ${data.currentUrl}
Time on current site: ${minutesOnSite}m ${secondsOnSite}s
Tab switches in last hour: ${data.tabSwitchCount}
Total session duration: ${Math.floor(data.sessionDuration / 60000)} minutes
Historical distraction visits: ${data.distractionSiteVisits}

Consider:
- Is this site productive for work/study?
- Is the user staying focused (long time on site)?
- Are they switching tabs frequently (distracted)?
- What's the overall session quality?

Calculate a nuanced score that reflects BOTH the site type AND the user's behavior.`;

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
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    const analysis = JSON.parse(content);

    return {
      focusScore: Math.max(0, Math.min(100, analysis.focusScore || 50)),
      reasoning: analysis.reasoning || 'Analysis complete',
      suggestions: analysis.suggestions || [],
      distractionLevel: analysis.distractionLevel || 'medium'
    };
  }

  private static async getMockAnalysis(data: FocusAnalysisRequest): Promise<FocusAnalysisResponse> {
    // Use website classifier to determine site category
    const classification = await WebsiteClassifier.classifyWebsite(data.currentUrl);
    
    // Start with base score from classification (40% weight)
    let baseScore = classification.score;
    
    // Calculate time-on-site score (25% weight)
    const minutesOnSite = data.timeOnCurrentSite / 60000;
    let timeScore = 50; // neutral
    if (minutesOnSite > 15) {
      timeScore = 95; // Excellent focus
    } else if (minutesOnSite > 10) {
      timeScore = 85;
    } else if (minutesOnSite > 5) {
      timeScore = 75;
    } else if (minutesOnSite > 2) {
      timeScore = 60;
    } else if (minutesOnSite > 0.5) {
      timeScore = 45;
    } else {
      timeScore = 30; // Just arrived
    }
    
    // Calculate tab switching score (20% weight)
    // Be more lenient - only penalize excessive switching
    let switchScore = 90; // Start very high
    if (data.tabSwitchCount > 30) {
      switchScore = 30; // Extremely distracted
    } else if (data.tabSwitchCount > 20) {
      switchScore = 50;
    } else if (data.tabSwitchCount > 15) {
      switchScore = 65;
    } else if (data.tabSwitchCount > 10) {
      switchScore = 75;
    }
    // 0-10 switches = 90 (normal productive work)
    
    // Calculate session quality score (15% weight)
    let sessionScore = 70;
    const sessionMinutes = data.sessionDuration / 60000;
    if (sessionMinutes > 30 && data.distractionSiteVisits < 3) {
      sessionScore = 90; // Great session
    } else if (data.distractionSiteVisits > 5) {
      sessionScore = 40; // Lots of distractions
    }
    
    // Weighted average
    const score = Math.round(
      baseScore * 0.40 +
      timeScore * 0.25 +
      switchScore * 0.20 +
      sessionScore * 0.15
    );
    
    const finalScore = Math.max(0, Math.min(100, score));

    const distractionLevel = finalScore > 70 ? 'low' : finalScore > 40 ? 'medium' : 'high';

    // Generate contextual suggestions
    const suggestions = [];
    
    if (minutesOnSite < 2 && classification.category === 'productive') {
      suggestions.push('Good site choice! Try to stay focused here for at least 5 minutes.');
    } else if (minutesOnSite > 10 && classification.category === 'productive') {
      suggestions.push('Excellent deep focus! You\'re in the zone.');
    }
    
    if (data.tabSwitchCount > 20) {
      suggestions.push(`${data.tabSwitchCount} tab switches is quite high. Try to focus on fewer tasks.`);
    } else if (data.tabSwitchCount > 15) {
      suggestions.push('Moderate tab switching detected. Consider focusing on one task at a time.');
    } else if (data.tabSwitchCount < 5) {
      suggestions.push('Great focus stability with minimal tab switching!');
    }
    
    if (classification.category === 'distracting' && minutesOnSite > 5) {
      suggestions.push(`You've been on ${classification.domain} for ${Math.floor(minutesOnSite)} minutes. Consider refocusing.`);
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Maintain your current focus level.');
    }

    // Build detailed reasoning
    const reasoning = `Site: ${classification.category} (${baseScore}/100). Time: ${Math.floor(minutesOnSite)}m (${timeScore}/100). Switches: ${data.tabSwitchCount} (${switchScore}/100). Overall: ${finalScore}/100`;

    return {
      focusScore: finalScore,
      reasoning,
      suggestions: suggestions.slice(0, 3),
      distractionLevel
    };
  }

  static async getRealtimeFocusScore(metrics: FocusMetrics): Promise<number> {
    const data: FocusAnalysisRequest = {
      currentUrl: metrics.activeUrl || '',
      tabSwitchCount: metrics.tabSwitchCount || 0,
      timeOnCurrentSite: Date.now() - (metrics.lastActivityTimestamp || Date.now()),
      recentUrls: [], // Could track this
      userActivity: {
        mouseMovements: 0,
        keystrokes: 0,
        scrolls: 0
      },
      sessionDuration: 0,
      distractionSiteVisits: 0
    };

    const analysis = await this.analyzeFocus(data);
    return analysis.focusScore;
  }
}
