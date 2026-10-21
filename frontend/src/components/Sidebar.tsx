import React, { useRef } from 'react';
import { 
  Upload, 
  Zap, 
  Database, 
  Table, 
  Hash, 
  Type, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  Layers,
  Sparkles
} from 'lucide-react';
import { Logo } from './Logo';
import type { ColumnInfo } from '../types';

interface SidebarProps {
  hasData: boolean;
  tableName: string;
  totalRecords: number;
  columns: ColumnInfo[];
  isLoading: boolean;
  onUpload: (file: File) => void;
  onLoadDemo: () => void;
  onOpenLiveDbModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  hasData,
  tableName,
  totalRecords,
  columns,
  isLoading,
  onUpload,
  onLoadDemo,
  onOpenLiveDbModal
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const getColumnIcon = (type: string) => {
    switch (type) {
      case 'INTEGER':
        return <Hash className="w-3.5 h-3.5 text-blue-400" />;
      case 'DOUBLE':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case 'DATE':
        return <Calendar className="w-3.5 h-3.5 text-purple-400" />;
      case 'BOOLEAN':
        return <CheckSquare className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Type className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'INTEGER':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'DOUBLE':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'DATE':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'BOOLEAN':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <aside className="w-[260px] h-full flex flex-col bg-obsidian-900 border-r border-slate-800/80 shrink-0 select-none">
      {/* App Logo Header */}
      <div className="p-4 border-b border-slate-800/80">
        <Logo />
      </div>

      {/* Action Buttons: Upload & Data Source Switchers */}
      <div className="p-3 space-y-2 border-b border-slate-800/80">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload Excel / CSV Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800/60 hover:bg-slate-800 hover:text-white rounded-xl border border-slate-700/60 btn-press group"
        >
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            <span>Upload Excel / CSV</span>
          </div>
          <span className="text-[10px] text-slate-400">.csv, .xlsx</span>
        </button>

        {/* Load Demo Dataset Button */}
        <button
          type="button"
          onClick={onLoadDemo}
          disabled={isLoading}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl border border-indigo-500/30 btn-press group shadow-glow-indigo"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400/20 group-hover:scale-110 transition-transform" />
            <span>Load Demo Dataset</span>
          </div>
          <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-[10px] text-indigo-200 font-mono">
            E-COM
          </span>
        </button>

        {/* Connect Live SQL DB (Phase 2) */}
        <button
          type="button"
          onClick={onOpenLiveDbModal}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-transparent hover:bg-slate-900/60 rounded-xl border border-slate-800/80 border-dashed btn-press group"
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
            <span>Connect Live SQL DB</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Phase 2
          </span>
        </button>
      </div>

      {/* Data Schema Tree Explorer */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col">
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 tracking-wide uppercase">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Schema Explorer</span>
          </div>
          {hasData && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              DuckDB Live
            </span>
          )}
        </div>

        {hasData ? (
          <div className="space-y-3 mt-1">
            {/* Table Name Card */}
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold font-mono text-white">{tableName}</span>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                {totalRecords.toLocaleString()} rows
              </span>
            </div>

            {/* Column List */}
            <div className="space-y-1">
              <div className="px-1 py-0.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Columns ({columns.length})
              </div>
              <div className="space-y-1 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
                {columns.map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/40 hover:bg-slate-800/50 border border-slate-800/60 text-xs transition-colors group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getColumnIcon(col.type)}
                      <span className="text-slate-300 font-mono text-xs truncate group-hover:text-white">
                        {col.name}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${getTypeBadgeStyle(
                        col.type
                      )}`}
                    >
                      {col.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center rounded-xl border border-dashed border-slate-800/80 bg-slate-950/30 my-auto">
            <Sparkles className="w-6 h-6 text-slate-600 mb-2" />
            <p className="text-xs text-slate-400 font-medium">No Schema Loaded</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Upload a file or click <span className="text-indigo-400 font-semibold">Load Demo</span> to inspect tables in DuckDB.
            </p>
          </div>
        )}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800/80 bg-obsidian-950/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          DuckDB 1.1 In-Memory
        </span>
        <span className="text-[10px] font-mono text-slate-400">v1.0.0</span>
      </div>
    </aside>
  );
};
