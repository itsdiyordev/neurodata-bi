import React, { useRef, useState } from 'react';
import { 
  Upload, 
  Plus,
  Zap, 
  Database, 
  Table, 
  Hash, 
  Type, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  Layers,
  Sparkles,
  HardDrive,
  Link2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Package,
  Users,
  Tag
} from 'lucide-react';
import { Logo } from './Logo';
import type { ColumnInfo, CleaningReport, WorkspaceTable, TableRelationship } from '../types';

interface SidebarProps {
  hasData: boolean;
  tableName: string;
  totalRecords: number;
  columns: ColumnInfo[];
  workspaceTables?: WorkspaceTable[];
  relationships?: TableRelationship[];
  isLoading: boolean;
  cleaningReport?: CleaningReport | null;
  onUpload: (file: File) => void;
  onLoadDemo: () => void;
  onSelectTable?: (tableName: string) => void;
  onDeleteTable?: (tableName: string) => void;
  onOpenLiveDbModal: () => void;
  onOpenSanitizerModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  hasData,
  tableName,
  totalRecords,
  columns,
  workspaceTables = [],
  relationships = [],
  isLoading,
  cleaningReport,
  onUpload,
  onLoadDemo,
  onSelectTable,
  onDeleteTable,
  onOpenLiveDbModal,
  onOpenSanitizerModal
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>(() => ({
    [tableName]: true
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
      e.target.value = ''; // reset so same file can be re-uploaded if needed
    }
  };

  const toggleTableExpand = (tName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTables(prev => ({
      ...prev,
      [tName]: !prev[tName]
    }));
  };

  const getTableIcon = (name: string) => {
    const l = name.toLowerCase();
    if (l.includes('order') || l.includes('sale') || l.includes('trans')) {
      return <Package className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
    if (l.includes('cust') || l.includes('user') || l.includes('client')) {
      return <Users className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    if (l.includes('prod') || l.includes('item') || l.includes('sku')) {
      return <Tag className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    return <Table className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const getColumnIcon = (type: string) => {
    switch (type) {
      case 'INTEGER':
        return <Hash className="w-3 h-3 text-blue-400 shrink-0" />;
      case 'DOUBLE':
        return <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" />;
      case 'DATE':
        return <Calendar className="w-3 h-3 text-purple-400 shrink-0" />;
      case 'BOOLEAN':
        return <CheckSquare className="w-3 h-3 text-amber-400 shrink-0" />;
      default:
        return <Type className="w-3 h-3 text-slate-400 shrink-0" />;
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

  const healthScore = cleaningReport?.data_health_score ?? 99.4;

  // Fallback single-table list if workspaceTables is empty
  const activeTablesList: WorkspaceTable[] = workspaceTables.length > 0
    ? workspaceTables
    : (hasData ? [{
        table_name: tableName,
        original_filename: `${tableName}.csv`,
        row_count: totalRecords,
        columns: columns,
        columns_count: columns.length,
        is_active: true
      }] : []);

  return (
    <aside className="w-[270px] h-full flex flex-col bg-obsidian-900 border-r border-slate-800/80 shrink-0 select-none">
      {/* App Logo Header */}
      <div className="p-4 border-b border-slate-800/80">
        <Logo />
      </div>

      {/* Action Buttons: Upload & Demo Dataset */}
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
            {hasData ? (
              <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            ) : (
              <Upload className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            )}
            <span>{hasData ? 'Add Another Table' : 'Upload Excel / CSV'}</span>
          </div>
          <span className="text-[10px] text-slate-400">.csv, .xlsx</span>
        </button>

        {/* Load Demo Dataset Button (3 Relational Tables) */}
        <button
          type="button"
          onClick={onLoadDemo}
          disabled={isLoading}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl border border-indigo-500/30 btn-press group shadow-glow-indigo"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400/20 group-hover:scale-110 transition-transform" />
            <span>Load Demo Workspace</span>
          </div>
          <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-[10px] text-indigo-200 font-mono">
            3 TABLES
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

      {/* Data Schema Tree Explorer with Multi-Table Accordion */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 tracking-wide uppercase">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Tables ({activeTablesList.length})</span>
          </div>
          {hasData && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              DuckDB Relational
            </span>
          )}
        </div>

        {hasData ? (
          <div className="space-y-2">
            {/* AI Data Sanitizer Badge Button */}
            <button
              type="button"
              onClick={onOpenSanitizerModal}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold btn-press transition-all group shadow-glow-emerald"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
                <span>✨ Auto-Cleaned ETL</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/25 px-1.5 py-0.5 rounded border border-emerald-500/30">
                {healthScore}%
              </span>
            </button>

            {/* Multi-Table Cards Accordion */}
            <div className="space-y-1.5">
              {activeTablesList.map((tbl) => {
                const isActive = tbl.table_name === tableName;
                const isExpanded = expandedTables[tbl.table_name] ?? isActive;

                return (
                  <div
                    key={tbl.table_name}
                    className={`rounded-xl border transition-all ${
                      isActive
                        ? 'bg-slate-800/80 border-indigo-500/60 shadow-glow-indigo'
                        : 'bg-slate-900/50 hover:bg-slate-800/50 border-slate-800/80'
                    }`}
                  >
                    {/* Table Card Header (Click switches active preview) */}
                    <div
                      onClick={() => onSelectTable && onSelectTable(tbl.table_name)}
                      className="p-2.5 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {getTableIcon(tbl.table_name)}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-semibold font-mono truncate ${
                              isActive ? 'text-indigo-200' : 'text-slate-200 group-hover:text-white'
                            }`}>
                              {tbl.table_name}
                            </span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-glow-emerald" />
                            )}
                          </div>
                          <span className="text-[10px] font-mono tabular-nums text-slate-400 block">
                            {tbl.row_count.toLocaleString()} rows
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Delete Table Button (if more than 1 table) */}
                        {activeTablesList.length > 1 && onDeleteTable && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Remove table '${tbl.table_name}' from DuckDB workspace?`)) {
                                onDeleteTable(tbl.table_name);
                              }
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title={`Delete ${tbl.table_name}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}

                        {/* Expand / Collapse Chevron */}
                        <button
                          type="button"
                          onClick={(e) => toggleTableExpand(tbl.table_name, e)}
                          className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Table Columns List (Collapsible) */}
                    {isExpanded && (
                      <div className="px-2 pb-2.5 pt-0.5 space-y-1 border-t border-slate-800/60">
                        <div className="px-1 py-1 text-[9px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center justify-between">
                          <span>Columns ({tbl.columns?.length || 0})</span>
                          <span className="text-[9px] text-slate-600">DuckDB Schema</span>
                        </div>
                        <div className="space-y-0.5 max-h-[160px] overflow-y-auto pr-1">
                          {(tbl.columns || []).map((col) => {
                            const isRenamed = col.original_name && col.original_name !== col.name;
                            return (
                              <div
                                key={col.name}
                                title={isRenamed ? `Normalized from '${col.original_name}'` : undefined}
                                className="flex items-center justify-between px-2 py-1 rounded bg-slate-950/40 border border-slate-800/40 text-[11px] group/col"
                              >
                                <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                                  {getColumnIcon(col.type)}
                                  <span className="text-slate-300 font-mono text-[11px] truncate group-hover/col:text-white">
                                    {col.name}
                                  </span>
                                </div>
                                <span className={`text-[8px] font-mono px-1 py-0.2 rounded border uppercase shrink-0 ${getTypeBadgeStyle(col.type)}`}>
                                  {col.type}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Auto-Detected Foreign Key Relationships Card */}
            {relationships && relationships.length > 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                    <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>🔗 Detected Relations</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {relationships.length} Auto-JOINs
                  </span>
                </div>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {relationships.map((rel, i) => (
                    <div
                      key={i}
                      className="p-1.5 rounded-lg bg-slate-900/70 border border-slate-800/80 font-mono text-[10px] text-slate-300"
                    >
                      <div className="text-indigo-300 font-semibold flex items-center justify-between">
                        <span>{rel.source_table} ↔ {rel.target_table}</span>
                        <span className="text-[8px] text-slate-500 uppercase">{rel.relationship_type || 'JOIN'}</span>
                      </div>
                      <div className="text-slate-400 text-[9px] truncate mt-0.5">
                        ON {rel.join_clause}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center rounded-xl border border-dashed border-slate-800/80 bg-slate-950/30 my-auto">
            <Sparkles className="w-6 h-6 text-slate-600 mb-2" />
            <p className="text-xs text-slate-400 font-medium">No Schema Loaded</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Upload files or click <span className="text-indigo-400 font-semibold">Load Demo</span> to inspect multi-table relations in DuckDB.
            </p>
          </div>
        )}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800/80 bg-obsidian-950/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <HardDrive className="w-3 h-3 text-slate-400" />
          DuckDB Relational
        </span>
        <span className="text-[10px] font-mono text-slate-400">v1.2.0</span>
      </div>
    </aside>
  );
};
