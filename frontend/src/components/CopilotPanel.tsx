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
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  FlaskConical,
  Trash2,
  RotateCcw
} from 'lucide-react';
import type { ChatMessage, ReasoningTraceStep } from '../types';

interface CopilotPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  hasData: boolean;
  onSendMessage: (text: string, simulateHealing?: boolean) => void;
  geminiApiKey: string;
  onApiKeyChange: (key: string) => void;
  onClearMemory: () => void;
  onLoadOnCanvas?: (msg: ChatMessage) => void;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  messages,
  isLoading,
  hasData,
  onSendMessage,
  geminiApiKey,
  onApiKeyChange,
  onClearMemory,
  onLoadOnCanvas
}) => {
  const [mode, setMode] = useState<'analyst' | 'scientist'>('analyst');
  const [inputText, setInputText] = useState('');
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [showDiff, setShowDiff] = useState<Record<string, boolean>>({});
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(geminiApiKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "🔗 Show revenue by customer segment & product category (Multi-Table JOIN)",
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

  const handleToggleDiff = (msgId: string) => {
    setShowDiff(prev => ({
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

  const getStepIcon = (status: ReasoningTraceStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
      case 'healed':
        return <Wrench className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />;
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
      default:
        return <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />;
    }
  };

  return (
    <aside className="w-[380px] h-full flex flex-col bg-obsidian-900 border-l border-slate-800/80 shrink-0 select-none copilot-panel">
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
              DuckDB Persistent &bull; Self-Healing
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

      {/* Deep Conversational Memory Bar (Smart Summarization & Rolling Window) */}
      <div className="px-3.5 py-1.5 bg-slate-950/70 border-b border-slate-800/70 flex items-center justify-between">
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold cursor-help transition-all ${
            messages.length > 15
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-glow-emerald'
              : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 shadow-glow-indigo'
          }`}
          title={
            messages.length > 15
              ? "Smart Context Optimization Active: Older messages automatically summarized to eliminate token bloat and maintain sub-second response times while retaining the last 10 turns verbatim."
              : "Active persistent DuckDB memory context window (retains up to 100 turns across page reloads & server restarts)."
          }
        >
          <BrainCircuit className={`w-3 h-3 ${messages.length > 15 ? 'text-emerald-400' : 'text-indigo-400'} animate-pulse`} />
          <span>
            {messages.length > 15 
              ? `🧠 Memory Active: ${messages.length} msgs (Smart Compressed)` 
              : `🧠 Memory Active: ${messages.length}/100 msgs`}
          </span>
        </div>

        <button
          type="button"
          onClick={onClearMemory}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-400 hover:text-rose-400 bg-slate-900/60 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 btn-press transition-colors"
          title="Reset conversational context memory in DuckDB"
        >
          <Trash2 className="w-3 h-3 text-slate-400 hover:text-rose-400" />
          <span>Clear Memory</span>
        </button>
      </div>

      {/* MODE 1: AI DATA ANALYST (Active) */}
      {mode === 'analyst' ? (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Chat Stream Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-glow-indigo">
                  <Bot className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-white">NeuroData Copilot</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                  Autonomous Data Analyst with in-memory DuckDB analytical execution & self-healing query repair.
                </p>
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
                        <span>{msg.engine || 'DuckDB Persistent'}</span>
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
                      {/* Multi-Table JOIN Query Badge */}
                      {(msg.is_join || (msg.sql_query && /\bJOIN\b/i.test(msg.sql_query))) && (
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono shadow-glow-indigo">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          <span>
                            <strong>🔗 Multi-Table JOIN Query:</strong> Relational execution across active DuckDB tables
                          </span>
                        </div>
                      )}

                      {/* Self-Healed SQL Telemetry Badge */}
                      {msg.is_healed && (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono shadow-glow-emerald">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>
                              <strong>Self-Healed SQL:</strong> Fixed in {msg.healing_attempts || 1} retry
                            </span>
                          </div>
                          {msg.failed_queries && msg.failed_queries.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleToggleDiff(msg.id)}
                              className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-[10px] text-emerald-200 border border-emerald-500/30 btn-press"
                            >
                              {showDiff[msg.id] ? 'Hide' : 'Inspect'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Expandable Failed Query Inspection */}
                      {showDiff[msg.id] && msg.failed_queries && msg.failed_queries.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] font-mono space-y-1.5">
                          <div className="text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Intercepted DuckDB Error (Attempt #{msg.failed_queries[0].attempt})</span>
                          </div>
                          <pre className="p-2 rounded bg-slate-950/80 text-rose-300 text-[10px] whitespace-pre-wrap overflow-x-auto border border-rose-500/20">
                            {msg.failed_queries[0].sql}
                          </pre>
                          <div className="text-[10px] text-rose-400">
                            <strong>Diagnostic:</strong> {msg.failed_queries[0].error}
                          </div>
                        </div>
                      )}

                      {/* Executive Explanation */}
                      <p className="text-slate-200 leading-relaxed font-sans">{msg.text}</p>

                      {/* Expandable AI Reasoning Steps Accordion */}
                      {((msg.reasoning_trace && msg.reasoning_trace.length > 0) || (msg.reasoning_steps && msg.reasoning_steps.length > 0)) && (
                        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleToggleReasoning(msg.id)}
                            className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-mono text-indigo-300 hover:text-indigo-200 bg-slate-900/40 transition-colors"
                          >
                            <span className="flex items-center gap-1.5 font-semibold">
                              <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                              <span>🧠 AI Reasoning Steps ({(msg.reasoning_trace || msg.reasoning_steps || []).length})</span>
                            </span>
                            {expandedReasoning[msg.id] ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>

                          {expandedReasoning[msg.id] && (
                            <div className="p-3 space-y-2 border-t border-slate-800/60 font-mono text-[10px] leading-relaxed">
                              {msg.reasoning_trace ? (
                                msg.reasoning_trace.map((tStep, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-slate-300">
                                    {getStepIcon(tStep.status)}
                                    <div className="flex-1">
                                      <span className={`font-semibold ${
                                        tStep.status === 'healed' ? 'text-emerald-300' :
                                        tStep.status === 'error' ? 'text-rose-400' :
                                        tStep.status === 'warning' ? 'text-amber-400' :
                                        tStep.status === 'success' ? 'text-emerald-400' : 'text-slate-200'
                                      }`}>
                                        {tStep.step}:{' '}
                                      </span>
                                      <span className="text-slate-400">{tStep.detail}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                msg.reasoning_steps?.map((step, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                                    <span>{step}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Query Execution Telemetry Tag */}
                      {msg.sql_query && (
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Clock className="w-3 h-3" />
                              <span>⚡ DuckDB: {msg.execution_time_ms || 4.2} ms</span>
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className="text-indigo-400 font-medium">🚀 Async Pipeline</span>
                          </div>
                          <span className="text-slate-400">{msg.row_count || 0} rows</span>
                        </div>
                      )}

                      {/* Past Query Action: Load on Canvas */}
                      {msg.sender === 'ai' && (msg.sql_query || msg.chart_config) && onLoadOnCanvas && (
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => onLoadOnCanvas(msg)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-400/50 shadow-glow-indigo btn-press transition-all"
                            title="Re-render this historical query chart and SQL directly onto the Main Canvas"
                          >
                            <RotateCcw className="w-3 h-3 text-indigo-400" />
                            <span>🔄 Load on Canvas</span>
                          </button>
                          <span className="text-[9px] font-mono text-slate-500">Historical Snapshot</span>
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
                  <div className="text-[10px] text-slate-500">Autonomous self-healing loop active</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Controls Area */}
          <div className="p-3 border-t border-slate-800/80 bg-obsidian-950/70 space-y-2.5">
            {/* Dynamic Contextual Follow-Up Prompt Chips */}
            {messages.length > 0 && messages[messages.length - 1].sender === 'ai' && (
              <div className="space-y-1.5 p-2 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                <div className="text-[10px] uppercase font-mono tracking-wider text-indigo-300 font-semibold px-0.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Contextual Follow-Ups</span>
                  </span>
                  <span className="text-[9px] text-indigo-400/70 font-normal">Modifies Previous Query</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "↳ Break this down by region",
                    "↳ Show only Top 3 from this",
                    "↳ Sort by lowest instead",
                    "↳ Exclude the top one"
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSendMessage(chip)}
                      disabled={isLoading || !hasData}
                      className="px-2 py-1 text-[10px] font-mono font-medium text-indigo-200 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700/50 hover:border-indigo-400/60 rounded-md btn-press truncate max-w-full disabled:opacity-40 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Prompt Chips */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold px-1 flex items-center justify-between">
                <span>Suggested Inquiries</span>
                <span className="text-[9px] text-indigo-400 font-normal">Click to Ask</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {/* Special Test Self-Healing Button */}
                <button
                  type="button"
                  onClick={() => onSendMessage("Test Self-Healing: Analyze top product sales", true)}
                  disabled={isLoading || !hasData}
                  className="px-2.5 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg btn-press flex items-center gap-1 shadow-glow-emerald disabled:opacity-40"
                  title="Simulates an intentional query error caught and auto-repaired by DuckDB self-healing agent loop"
                >
                  <FlaskConical className="w-3 h-3 text-emerald-400" />
                  <span>🧪 Test Self-Healing</span>
                </button>

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
        </div>
      )}

      {/* Google Gemini API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-sm p-5 rounded-2xl bg-obsidian-900 border border-slate-700 shadow-2xl space-y-4 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Google Gemini API Key</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your Gemini API key to query Gemini 2.5 Flash directly. If left blank, NeuroData BI runs seamlessly on the offline DuckDB Analytical Engine.
            </p>

            <div>
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Saved securely in browser local storage. Never sent to third parties.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setTempKey(''); onApiKeyChange(''); setShowKeyModal(false); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Clear Key
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-glow-indigo transition-colors"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
