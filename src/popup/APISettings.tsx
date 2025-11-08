import React, { useState, useEffect } from 'react';
import { APIConfigManager } from '../shared/api/config';

export const APISettings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'mock'>('mock');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const config = await APIConfigManager.getConfig();
    setApiKey(config.apiKey || '');
    setProvider(config.provider as 'openai' | 'mock');
  };

  const handleSave = async () => {
    await APIConfigManager.updateConfig({
      apiKey: apiKey || undefined,
      provider
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <details className="api-settings">
      <summary>⚙️ AI Settings</summary>
      <div className="settings-content">
        <label>
          Provider:
          <select value={provider} onChange={(e) => setProvider(e.target.value as 'openai' | 'mock')}>
            <option value="mock">Mock (Heuristics)</option>
            <option value="openai">OpenAI GPT-4</option>
          </select>
        </label>

        {provider === 'openai' && (
          <label>
            API Key:
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </label>
        )}

        <button onClick={handleSave} className="btn-save">
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>

        <p className="settings-note">
          {provider === 'mock' 
            ? 'Using rule-based focus analysis' 
            : 'Using AI for intelligent focus analysis'}
        </p>
      </div>
    </details>
  );
};
