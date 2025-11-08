// Session State Types
export interface SessionState {
  active: boolean;
  sessionId: string;
  startTime: number | null;
  endTime: number | null;
  focusScore: number; // 0-100
  focusedMinutes: number;
  distractionCount: number;
  lastActivityTimestamp: number;
  paused: boolean;
}

// Forest State Types
export interface Tree {
  id: string;
  type: string;
  height: number;
  x: number;
  y: number;
  status: 'healthy' | 'burning' | 'burnt' | 'recovering';
  age: number; // in minutes
  assetUrl?: string; // AI-generated asset URL
  burnIntensity?: number; // 0-1 for burning trees
}

export interface Animal {
  id: string;
  type: string;
  x: number;
  y: number;
  status: 'visible' | 'hidden' | 'fleeing';
  assetUrl?: string; // AI-generated asset URL
}

export interface WildfireState {
  active: boolean;
  level: number; // 0-1, intensity
  affectedTreeIds: string[];
  startTime: number | null;
  spreadingRate: number; // trees per minute
}

export interface ForestState {
  trees: Tree[];
  animals: Animal[];
  wildfire: WildfireState;
  sessionActive: boolean;
  focusMinutes: number;
  lastUpdate: number;
}

// Focus Monitoring Types
export interface FocusMetrics {
  activeTabId: number | null;
  activeUrl: string | null;
  windowFocused: boolean;
  tabVisible: boolean;
  lastActivityTimestamp: number;
  currentSiteArrivalTime: number; // When user arrived at current URL
  tabSwitchCount: number;
  distractionScore: number; // 0-1, lower = more distracted
  timeOnDistractingSites: number; // in seconds
  inactivityDuration: number; // in seconds
}

export interface ActivityEvent {
  type: 'keyboard' | 'mouse' | 'scroll' | 'tab_switch' | 'url_change';
  timestamp: number;
  data?: Record<string, any>;
}

// API Asset Types
export interface AssetRequest {
  type: 'tree' | 'animal' | 'decoration';
  category?: string;
  style?: string;
  focusScore?: number;
}

export interface AssetResponse {
  id: string;
  url: string;
  type: string;
  metadata?: Record<string, any>;
}

export interface APIConfig {
  provider: 'openai' | 'stability' | 'mock';
  apiKey?: string;
  baseUrl?: string;
  useCache: boolean;
}

// Stats Types
export interface SessionStats {
  totalDuration: number; // in milliseconds
  focusedMinutes: number;
  treesGrown: number;
  treesBurned: number;
  wildfireEvents: number;
  focusScoreHistory: Array<{ timestamp: number; score: number }>;
  distractionEvents: Array<{ timestamp: number; url: string }>;
}

// Storage Keys
export const STORAGE_KEYS = {
  SESSION_STATE: 'sessionState',
  FOREST_STATE: 'forestState',
  FOCUS_METRICS: 'focusMetrics',
  SESSION_STATS: 'sessionStats',
  DISTRACTION_SITES: 'distractionSites',
  API_CONFIG: 'apiConfig',
  CACHED_ASSETS: 'cachedAssets'
} as const;

// Distraction Sites
export interface DistractionSite {
  domain: string;
  enabled: boolean;
  penalty: number; // 0-1, how much it reduces focus score
}

