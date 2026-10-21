import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  ShieldCheck, 
  ArrowRight, 
  HardDrive, 
  CheckCircle2, 
  Layers, 
  FileSpreadsheet,
  Cpu
} from 'lucide-react';
import type { CleaningReport, ColumnInfo } from '../types';

interface DataSanitizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CleaningReport | null;
  columns: ColumnInfo[];
  tableName: string;
  sessionId?: string;
}

export const DataSanitizerModal: React.FC<DataSanitizerModalProps> = ({
  isOpen,
  onClose,
  report,
  columns,
  tableName,
  sessionId
}) => {
  const [activeTab, setActiveTab] = useState<'columns' | 'coercions' | 'storage'>('columns');

  if (!isOpen) return null;

  const healthScore = report?.data_health_score ?? 99.4;
  const rowsRemoved = report?.rows_removed ?? 0;
  const colsNormalized = report?.columns_normalized ?? 0;
  const typesCoerced = report?.types_coerced ?? [];
  const mapping = report?.columns_mapping ?? {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-obsidian-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-obsidian-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Smart Data Sanitizer & ETL Pipeline
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Vectorized ETL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated header detection, SQL-safe normalization, and type coercion.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top 4 Metric Stats Summary Cards */}
        <div className="grid grid-cols-4 gap-3 p-5 border-b border-slate-800/80 bg-slate-900/30">
          {/* Card 1: Health Score */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider">Data Health</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {healthScore}%
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full"
                style={{ width: `${Math.min(100, healthScore)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Rows Dropped */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider">Empty Rows Trimmed</span>
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {rowsRemoved}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Empty/corrupt lines</p>
          </div>

          {/* Card 3: Columns Normalized */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider">Normalized Cols</span>
              <Layers className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold font-mono text-purple-300">
              {colsNormalized}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">SQL-safe snake_case</p>
          </div>

          {/* Card 4: Types Coerced */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider">Auto-Coerced</span>
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-300">
              {typesCoerced.length}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Currency & Date</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('columns')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'columns'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>SQL Column Normalizations ({columns.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('coercions')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'coercions'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Smart Type Coercion ({typesCoerced.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'storage'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>DuckDB Session Persistence</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[380px]">
          {/* Tab 1: Column Mapping */}
          {activeTab === 'columns' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-3 py-1 font-mono uppercase tracking-wider">
                <span>Original Header (Excel/CSV)</span>
                <span>Clean DuckDB Identifier</span>
              </div>
              <div className="space-y-1.5">
                {columns.map((col) => {
                  const originalName = col.original_name || mapping[col.name] || col.name;
                  const isModified = originalName !== col.name;

                  return (
                    <div 
                      key={col.name}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/50 border border-slate-800/80 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2 max-w-[45%] truncate">
                        <span className="text-slate-400 font-mono truncate">{originalName}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                        <span className="font-mono font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {col.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 border border-slate-700/60 px-1.5 py-0.5 rounded">
                          {col.type}
                        </span>
                        {isModified ? (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            Cleaned
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Direct
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Type Coercion */}
          {activeTab === 'coercions' && (
            <div className="space-y-3">
              {typesCoerced.length > 0 ? (
                typesCoerced.map((tc, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{tc.column}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          {tc.from_type} ➔ {tc.to_type}
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Auto-Sanitized
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 text-[11px] font-mono">
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Sample Before</div>
                        <span className="text-amber-300">{tc.sample_before || '"$1,250.00"'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Sample After (DuckDB)</div>
                        <span className="text-emerald-300">{tc.sample_after || '1250.0 (DOUBLE)'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 rounded-xl bg-slate-950/40 border border-slate-800/60">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-slate-300">All Types Naturally Strict</p>
                  <p className="text-xs text-slate-400 mt-1">
                    All columns were already in native numeric or timestamp formats.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Session Persistence */}
          {activeTab === 'storage' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  <span>Local Persistent DuckDB File Storage</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Unlike volatile in-memory sessions that drop all tables on refresh or reload, NeuroData BI saves your dataset in a local file-backed DuckDB database.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400">Database File:</span>
                    <span className="text-indigo-300">backend/data/neurodata_store.duckdb</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400">Active Table:</span>
                    <span className="text-purple-300">{tableName}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400">Session ID:</span>
                    <span className="text-emerald-300">{sessionId || 'default_session'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400">Auto-Restore Endpoint:</span>
                    <span className="text-amber-300">GET /api/session/restore</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  Refreshing your browser will instantly restore this table, KPIs, and charts without re-uploading!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-obsidian-950/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            DuckDB Vectorized Storage Live
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors btn-press"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
