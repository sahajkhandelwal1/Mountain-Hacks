import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { ForestStorage } from '../shared/storage/forestStorage';
import { SessionStorage } from '../shared/storage/sessionStorage';
import { ForestState, SessionState } from '../shared/types';
import { ImageForestRenderer } from '../shared/forest/ImageForestRenderer';

export function NewTab() {
  const [forestState, setForestState] = useState<ForestState | null>(null);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [controlsExpanded, setControlsExpanded] = useState(true);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [bgImage1, setBgImage1] = useState('');
  const [bgImage2, setBgImage2] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ImageForestRenderer | null>(null);

  // Load image URLs
  useEffect(() => {
    setBgImage1(chrome.runtime.getURL('images/misty-forest-main-bg.png'));
    setBgImage2(chrome.runtime.getURL('images/misty-forest-bg.png'));
  }, []);

  // Initialize canvas renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      rendererRef.current = new ImageForestRenderer(canvas);
      
      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (rendererRef.current && forestState) {
          rendererRef.current.setForestState(forestState);
          rendererRef.current.draw();
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Render forest when state changes
  useEffect(() => {
    if (forestState && rendererRef.current) {
      rendererRef.current.setForestState(forestState);
      rendererRef.current.draw();
    }
  }, [forestState]);

  // Load state from storage
  useEffect(() => {
    const loadState = async () => {
      const forest = await ForestStorage.getForestState();
      const session = await SessionStorage.getSessionState();
      console.log('Forest state loaded:', forest.trees.length, 'trees');
      setForestState(forest);
      setSessionState(session);
      
      if (session.active) {
        setSessionStarted(true);
      }
    };

    loadState();

    // Poll for updates every second
    const interval = setInterval(loadState, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fade background when session starts
  useEffect(() => {
    if (sessionStarted && backgroundOpacity > 0) {
      const duration = 30000; // 30 seconds
      const steps = 60;
      const interval = duration / steps;
      let currentStep = 0;

      const fadeInterval = setInterval(() => {
        currentStep++;
        const newOpacity = 1 - currentStep / steps;
        setBackgroundOpacity(Math.max(0, newOpacity));

        if (currentStep >= steps) {
          clearInterval(fadeInterval);
        }
      }, interval);

      return () => clearInterval(fadeInterval);
    }
  }, [sessionStarted]);

  // Snap scroll behavior
  useEffect(() => {
    let isScrolling = false;

    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) return;

      const scrollingDown = e.deltaY > 0;
      const scrollingUp = e.deltaY < 0;
      const currentScroll = window.scrollY;
      const viewportHeight = window.innerHeight;

      if (scrollingDown && currentScroll < viewportHeight * 0.5) {
        e.preventDefault();
        isScrolling = true;
        window.scrollTo({
          top: viewportHeight,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isScrolling = false;
        }, 800);
      } else if (scrollingUp && currentScroll >= viewportHeight * 0.5) {
        e.preventDefault();
        isScrolling = true;
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isScrolling = false;
        }, 800);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const url =
        searchQuery.includes('.') || searchQuery.startsWith('http')
          ? searchQuery.startsWith('http')
            ? searchQuery
            : `https://${searchQuery}`
          : `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

      window.open(url, '_blank');
    }
  };

  const handleStartSession = async () => {
    chrome.runtime.sendMessage({ type: 'START_SESSION' });
    setSessionStarted(true);
  };

  const handlePauseSession = async () => {
    chrome.runtime.sendMessage({ type: 'PAUSE_SESSION' });
  };

  const handleEndSession = async () => {
    chrome.runtime.sendMessage({ type: 'END_SESSION' });
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sessionTime = sessionState?.startTime 
    ? Math.floor((Date.now() - sessionState.startTime) / 1000)
    : 0;

  const healthyTrees = forestState?.trees.filter(t => t.status === 'healthy').length || 0;
  const burningTrees = forestState?.trees.filter(t => t.status === 'burning').length || 0;
  const burntTrees = forestState?.trees.filter(t => t.status === 'burnt').length || 0;
  const totalTrees = forestState?.trees.length || 0;
  const focusScore = Math.round(sessionState?.focusScore || 100);

  return (
    <div className="min-h-screen text-white overflow-y-auto relative">
      {/* Main Hero Section */}
      <div className="h-screen flex flex-col items-center justify-center overflow-hidden relative">
        {/* Background Images */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: bgImage1 ? `url(${bgImage1})` : 'none',
            opacity: backgroundOpacity,
          }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{
            backgroundImage: bgImage2 ? `url(${bgImage2})` : 'none',
            opacity: 1 - backgroundOpacity,
            filter: `blur(${(1 - backgroundOpacity) * 3}px)`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-8 px-8 max-w-5xl -translate-y-[12.5vh]">
          <div className="text-center space-y-1">
            <div className="flex items-start justify-center gap-3">
              <h1 className="font-serif text-[11rem] leading-none tracking-tight text-white drop-shadow-2xl">
                verdant
              </h1>
              <span className="font-serif text-3xl text-white/90 mt-6">focus</span>
            </div>
          </div>

          <form onSubmit={handleSearch} className="w-[700px] mt-8">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Google or type a URL"
                className="w-full pl-14 pr-6 py-5 bg-white/10 backdrop-blur-md text-white rounded-full text-base font-medium placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 shadow-xl border border-white/20 transition-all"
              />
            </div>
          </form>
        </div>

        {/* Forest Canvas - positioned below search bar */}
        <div className="absolute bottom-0 left-0 right-0 z-[5]" style={{ pointerEvents: 'none', height: '40vh' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />
        </div>

        {/* Controls */}
        <div className="absolute top-8 right-8 z-20 flex flex-col gap-2">
          <button
            onClick={() => setControlsExpanded(!controlsExpanded)}
            className="self-end px-4 py-2 rounded-full bg-white/10 text-white/80 border border-white/30 hover:bg-white/20 transition-all backdrop-blur-sm flex items-center gap-2"
          >
            {controlsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="text-sm font-medium">Controls</span>
          </button>

          {controlsExpanded && (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {!sessionState?.active ? (
                <button
                  onClick={handleStartSession}
                  className="px-6 py-3 rounded-full font-medium transition-all border backdrop-blur-sm bg-emerald-500/90 text-white border-emerald-400 shadow-lg hover:bg-emerald-600/90"
                >
                  Start Session
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePauseSession}
                    className={`px-6 py-3 rounded-full font-medium transition-all border backdrop-blur-sm ${
                      sessionState.paused
                        ? 'bg-gray-500/90 text-white border-gray-400 shadow-lg'
                        : 'bg-white/10 text-white/80 border-white/30 hover:bg-white/20'
                    }`}
                  >
                    {sessionState.paused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="px-6 py-3 rounded-full font-medium transition-all border backdrop-blur-sm bg-red-500/90 text-white border-red-400 shadow-lg hover:bg-red-600/90"
                  >
                    End Session
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: bgImage1 ? `url(${bgImage1})` : 'none',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 w-full py-20 px-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Top row - Session Time and Focus Score */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center">
                <div className="text-white/70 text-sm font-medium mb-3">Session Time</div>
                <div className="text-white text-5xl font-bold">{formatTime(sessionTime)}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center">
                <div className="text-white/70 text-sm font-medium mb-3">Focus Score</div>
                <div className="text-white text-5xl font-bold">{focusScore}%</div>
              </div>
            </div>

            {/* Second row - Trees Grown and Focused Minutes */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center">
                <div className="text-white/70 text-sm font-medium mb-3">Trees Grown</div>
                <div className="text-white text-5xl font-bold">{totalTrees}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center">
                <div className="text-white/70 text-sm font-medium mb-3">Focused Minutes</div>
                <div className="text-white text-5xl font-bold">{sessionState?.focusedMinutes || 0}</div>
              </div>
            </div>

            {/* Forest Status */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8">
              <div className="text-white font-semibold text-xl mb-4">Forest Status</div>
              <div className="space-y-2 text-white/90 text-lg">
                <div className="flex justify-between">
                  <span>Healthy Trees:</span>
                  <span className="font-bold text-green-400">{healthyTrees}</span>
                </div>
                <div className="flex justify-between">
                  <span>Burning Trees:</span>
                  <span className="font-bold text-orange-400">{burningTrees}</span>
                </div>
                <div className="flex justify-between">
                  <span>Burnt Trees:</span>
                  <span className="font-bold text-red-400">{burntTrees}</span>
                </div>
              </div>
              
              {/* Wildfire Level */}
              {forestState?.wildfire.active && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/70">Wildfire Level:</span>
                    <span className="text-white font-bold">{Math.round((forestState.wildfire.level || 0) * 100)}%</span>
                  </div>
                  <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                      style={{ width: `${(forestState.wildfire.level || 0) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* AI Focus Insights */}
            <AIInsightsSection />
          </div>
        </div>
      </div>
    </div>
  );
}

// AI Insights Section Component
function AIInsightsSection() {
  const [analysis, setAnalysis] = React.useState<any>(null);

  React.useEffect(() => {
    const loadAnalysis = async () => {
      const result = await chrome.storage.local.get(['lastFocusAnalysis', 'lastAnalysisTime']);
      if (result.lastFocusAnalysis) {
        setAnalysis(result.lastFocusAnalysis);
      }
    };

    loadAnalysis();
    const interval = setInterval(loadAnalysis, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8">
      <div className="text-white font-semibold text-xl mb-4">🤖 AI Focus Analysis</div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70">Current Focus Score</span>
          <span className={`text-3xl font-bold ${getScoreColor(analysis.focusScore)}`}>
            {Math.round(analysis.focusScore)}%
          </span>
        </div>
      </div>

      {analysis.reasoning && (
        <div className="bg-black/20 rounded-lg p-4 mb-4">
          <div className="text-white/90 text-sm leading-relaxed">{analysis.reasoning}</div>
        </div>
      )}

      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <div>
          <div className="text-white/80 font-medium mb-2">💡 Suggestions:</div>
          <div className="space-y-2">
            {analysis.suggestions.map((suggestion: string, index: number) => (
              <div key={index} className="bg-white/5 rounded-lg p-3 text-white/80 text-sm">
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.websiteCategory && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm">Current Site Category:</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-white/90 text-sm capitalize">
              {analysis.websiteCategory}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
