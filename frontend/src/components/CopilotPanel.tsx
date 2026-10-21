import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Key, 
  BrainCircuit, 
  Clock, 
  BarChart, 
  TrendingUp, 
  ShieldAlert
} from 'lucide-react';
import type { ChatMessage } from '../types';

interface CopilotPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  hasData: boolean;
  onSendMessage: (text: string) => void;
  geminiApiKey: string;
  onApiKeyChange: (key: string) => void;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  messages,
  isLoading,
  hasData,
  onSendMessage,
  geminiApiKey,
  onApiKeyChange
}) => {
  const [mode, setMode] = useState<'analyst' | 'scientist'>('analyst');
  const [inputText, setInputText] = useState('');
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(geminiApiKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "What is our best-selling product?",
    "Why did sales drop in March?",
    "Show top 5 categories by revenue"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleToggleReasoning = (msgId: string) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleSaveKey = () => {
    onApiKeyChange(tempKey.trim());
    setShowKeyModal(false);
  };

  return (
    <aside className="w-[380px] h-full flex flex-col bg-obsidian-900 border-l border-slate-800/80 shrink-0 select-none">
      {/* Top Segmented Mode Toggle */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <button
            type="button"
            onClick={() => setMode('analyst')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold btn-press transition-all ${
              mode === 'analyst'
                ? 'bg-indigo-600 text-white shadow-glow-indigo'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart className="w-3.5 h-3.5" />
            <span>AI Data Analyst</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('scientist')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold btn-press transition-all ${
              mode === 'scientist'
                ? 'bg-purple-600 text-white shadow-glow-purple'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Data Scientist</span>
          </button>
        </div>
      </div>

      {/* Mode Sub-Header & API Key Status */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mode === 'analyst' ? (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-300">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Phase 1 Active &bull; DuckDB SQL
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              Phase 3 Preview &bull; ML Models
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => { setTempKey(geminiApiKey); setShowKeyModal(true); }}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white btn-press"
          title="Configure Google Gemini API Key"
        >
          <Key className="w-3 h-3 text-indigo-400" />
          <span>{geminiApiKey ? 'API Key Active' : 'Smart Mock Mode'}</span>
        </button>
      </div>

      {/* MODE 1: AI DATA ANALYST (Active Phase 1) */}
      {mode === 'analyst' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-glow-indigo">
                  <Bot className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-white font-sans">NeuroData Copilot Ready</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Ask analytical business questions. The agent synthesizes DuckDB SQL and renders charts reactively.
                </p>
                {!hasData && (
                  <div className="mt-4 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-indigo-300">
                    💡 Click <span className="font-semibold text-white">Load Demo Dataset</span> in the sidebar to start immediately!
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-slate-500">
                    {msg.sender === 'user' ? (
                      <>
                        <span>You</span>
                        <User className="w-3 h-3 text-slate-400" />
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3 text-indigo-400" />
                        <span className="text-indigo-400 font-medium">NeuroData Copilot</span>
                        <span className="text-slate-600">&bull;</span>
                        <span>{msg.engine || 'DuckDB Engine'}</span>
                      </>
                    )}
                  </div>

                  {/* Message Bubble / Card */}
                  {msg.sender === 'user' ? (
                    <div className="max-w-[85%] p-3 rounded-2xl rounded-tr-sm bg-indigo-600 text-white text-xs leading-relaxed shadow-glow-indigo font-sans">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="max-w-[95%] w-full glass-panel-elevated p-3.5 rounded-2xl rounded-tl-sm border border-slate-800 text-xs space-y-3">
                      {/* Executive Explanation */}
                      <p className="text-slate-200 leading-relaxed font-sans">{msg.text}</p>

                      {/* Expandable AI Reasoning Steps Accordion */}
                      {msg.reasoning_steps && msg.reasoning_steps.length > 0 && (
                        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleToggleReasoning(msg.id)}
                            className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-mono text-indigo-300 hover:text-indigo-200 bg-slate-900/40 transition-colors"
                          >
                            <span className="flex items-center gap-1.5 font-semibold">
                              <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                              <span>🧠 AI Reasoning Steps ({msg.reasoning_steps.length})</span>
                            </span>
                            {expandedReasoning[msg.id] ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>

                          {expandedReasoning[msg.id] && (
                            <div className="p-3 space-y-2 border-t border-slate-800/60 font-mono text-[10px] text-slate-400 leading-relaxed">
                              {msg.reasoning_steps.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Query Execution Telemetry Tag */}
                      {msg.sql_query && (
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Clock className="w-3 h-3" />
                            <span>Executed in {msg.execution_time_ms || 8.4} ms</span>
                          </span>
                          <span className="text-slate-400">{msg.row_count || 0} rows</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-indigo-300">
                <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mt-0.5" />
                <div className="space-y-1 font-mono text-[11px]">
                  <div>Analyzing table schema & synthesizing DuckDB SQL...</div>
                  <div className="text-[10px] text-slate-500">Vectorizing in-memory analytical query</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Controls Area */}
          <div className="p-3 border-t border-slate-800/80 bg-obsidian-950/70 space-y-2">
            {/* Quick Prompt Chips */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold px-1">
                Suggested Inquiries
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((promptText, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSendMessage(promptText)}
                    disabled={isLoading || !hasData}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg btn-press text-left truncate max-w-full disabled:opacity-40"
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Field */}
            <form onSubmit={handleFormSubmit} className="relative mt-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={hasData ? "Ask anything about your data..." : "Load dataset to begin querying..."}
                disabled={!hasData || isLoading}
                className="w-full pl-3 pr-10 py-2.5 text-xs font-sans rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || !hasData || isLoading}
                className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-glow-indigo btn-press"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* MODE 2: AI DATA SCIENTIST (ML - Phase 3 Preview) */
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold font-sans">Phase 3: Predictive ML Engine Preview</h4>
            </div>
            <p className="text-[11px] text-purple-300 leading-relaxed">
              Automated Time-Series Forecasting, Customer Churn Prediction, and Anomaly Detection directly on DuckDB tensors.
            </p>
          </div>

          {/* Interactive ML Simulator 1: Time Series Forecasting */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                <span>Q3 2024 Revenue Forecast</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ARIMA + Prophet
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="text-slate-400">Projected July: <span className="text-emerald-400 font-bold">$168,400</span> (+18.2%)</div>
              <div className="text-slate-400">Projected August: <span className="text-emerald-400 font-bold">$182,900</span> (+8.6%)</div>
              <div className="text-slate-400">Confidence Interval: <span className="text-indigo-300">95% (±$4,120)</span></div>
            </div>
            <button
              type="button"
              onClick={() => onSendMessage("Forecast revenue for Q3 based on current growth trajectory")}
              className="w-full py-1.5 text-xs font-medium text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/30 btn-press text-center"
            >
              Simulate Q3 Forecast Run &rarr;
            </button>
          </div>

          {/* Interactive ML Simulator 2: Customer Churn Probability */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Customer Churn Risk Scoring</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                XGBoost Classifier
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">SMB Low-Activity Tier:</span>
                <span className="font-mono text-amber-400 font-semibold">24.5% Risk</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '24.5%' }} />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Enterprise High-Volume:</span>
                <span className="font-mono text-emerald-400 font-semibold">3.8% Risk</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: '3.8%' }} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSendMessage("Which customer segment has the highest retention and churn risk?")}
              className="w-full py-1.5 text-xs font-medium text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/30 btn-press text-center"
            >
              Analyze Churn Drivers &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Gemini API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel-elevated rounded-2xl p-6 border border-slate-700/80 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Google Gemini API Key</h3>
                <p className="text-xs text-slate-400">Optional: Connect your live Gemini 2.5 Flash key</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If left blank, NeuroData BI runs with our <span className="text-indigo-400 font-medium">Smart Mock & Deterministic DuckDB Engine</span>, which generates real SQL queries and visualizations for demo data!
            </p>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">GEMINI_API_KEY</label>
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 btn-press"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-indigo btn-press"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
