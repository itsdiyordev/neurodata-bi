import React, { useState } from 'react';
import { X, Database, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LiveDbModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveDbModal: React.FC<LiveDbModalProps> = ({ isOpen, onClose }) => {
  const [dbType, setDbType] = useState<'postgres' | 'mysql' | 'snowflake'>('postgres');
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);

  if (!isOpen) return null;

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setTested(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg glass-panel-elevated rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">Connect Live SQL Database</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Phase 2 Roadmap
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Stream direct tables into in-memory DuckDB analytical engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 btn-press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Database Selector */}
        <div className="mt-5 space-y-4">
          <label className="block text-xs font-medium text-slate-300">Database Provider</label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'postgres', name: 'PostgreSQL', port: '5432' },
              { id: 'mysql', name: 'MySQL', port: '3306' },
              { id: 'snowflake', name: 'Snowflake', port: '443' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setDbType(item.id as any); setTested(false); }}
                className={`p-3 rounded-xl border text-left btn-press transition-colors ${
                  dbType === item.id
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-medium text-xs text-white">{item.name}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">Default: :{item.port}</div>
              </button>
            ))}
          </div>

          {/* Connection Parameters Form */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Host / Endpoint</label>
              <input
                type="text"
                readOnly
                defaultValue="db.production.us-east-1.aws.rds.com"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Port</label>
                <input
                  type="text"
                  readOnly
                  defaultValue={dbType === 'postgres' ? '5432' : dbType === 'mysql' ? '3306' : '443'}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Database Name</label>
                <input
                  type="text"
                  readOnly
                  defaultValue="analytics_dw"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Username</label>
                <input
                  type="text"
                  readOnly
                  defaultValue="read_only_analyst"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  readOnly
                  defaultValue="••••••••••••••••"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Security Banner */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>DuckDB TLS 1.3 encrypted zero-trust connection pool. Read-only session.</span>
          </div>

          {tested && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Connection handshake simulated successfully! Scheduled for Phase 2 rollout.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 btn-press"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-indigo btn-press flex items-center gap-1.5"
          >
            {testing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Testing Connection...</span>
              </>
            ) : (
              <span>Test Handshake</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
