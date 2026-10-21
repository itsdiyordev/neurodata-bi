import React, { useState } from 'react';
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  AreaChart as AreaChartIcon, 
  Table as TableIcon, 
  Code2, 
  Copy, 
  Check, 
  Database, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import type { KPIData, ChartConfig, CleaningReport } from '../types';

interface DashboardCanvasProps {
  hasData: boolean;
  kpis: KPIData;
  chartConfig: ChartConfig | null;
  tableData: Record<string, any>[];
  sqlQuery: string;
  executionTimeMs: number;
  isLoading: boolean;
  cleaningReport?: CleaningReport | null;
  onLoadDemo: () => void;
  onUploadClick: () => void;
  onOpenSanitizerModal?: () => void;
}

export const DashboardCanvas: React.FC<DashboardCanvasProps> = ({
  hasData,
  kpis,
  chartConfig,
  tableData,
  sqlQuery,
  executionTimeMs,
  isLoading,
  cleaningReport,
  onLoadDemo,
  onUploadClick,
  onOpenSanitizerModal,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'sql'>('preview');
  const [chartTypeOverride, setChartTypeOverride] = useState<'bar' | 'line' | 'area' | null>(null);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const handleCopySql = () => {
    if (!sqlQuery) return;
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const effectiveChartType = chartTypeOverride || chartConfig?.type || 'bar';

  // Table pagination
  const totalRows = tableData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const paginatedData = tableData.slice((page - 1) * pageSize, page * pageSize);
  const tableColumns = tableData.length > 0 ? Object.keys(tableData[0]) : [];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Custom Recharts Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel-elevated p-3 rounded-xl border border-slate-700/80 shadow-2xl text-xs space-y-1">
          <div className="font-semibold text-white font-mono">{label}</div>
          <div className="text-indigo-300 font-mono flex items-center justify-between gap-4">
            <span className="text-slate-400">{payload[0].name || 'Value'}:</span>
            <span className="font-bold text-indigo-400">
              {typeof payload[0].value === 'number'
                ? formatNumber(payload[0].value)
                : payload[0].value}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // 1. EMPTY STATE
  if (!hasData) {
    return (
      <main className="flex-1 h-full overflow-y-auto p-8 flex flex-col items-center justify-center bg-obsidian-900 select-none">
        <div className="max-w-2xl w-full text-center space-y-6">
          {/* Glowing Animated Drag & Drop Zone */}
          <div
            onClick={onUploadClick}
            className="group relative p-10 rounded-2xl border-2 border-dashed border-slate-700/80 hover:border-indigo-500/80 bg-slate-900/40 hover:bg-slate-900/70 transition-all duration-300 cursor-pointer shadow-glow-indigo"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
              <Database className="w-8 h-8 text-indigo-400" />
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight font-sans">
              Drag & Drop your Excel or CSV File Here
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
              NeuroData BI loads your dataset into an ultra-fast in-memory DuckDB engine. No data leaves your secure session.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
              <span>Supports .csv, .xlsx, .xls</span>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span>Up to 50 MB</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-slate-800" />
            <span className="text-xs uppercase tracking-widest text-slate-500 font-mono font-semibold">
              OR TEST INSTANTLY
            </span>
            <div className="h-px w-16 bg-slate-800" />
          </div>

          {/* Prominent Launch Demo Data Button */}
          <div>
            <button
              type="button"
              onClick={onLoadDemo}
              disabled={isLoading}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-glow-indigo btn-press group"
            >
              <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
              <span>Launch with E-Commerce Demo Data (380+ Records)</span>
            </button>
            <p className="text-xs text-slate-500 mt-2">
              Pre-loaded with product categories, customer segments, regional margins, and a March supply anomaly.
            </p>
          </div>

          {/* Architecture Feature Badges */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800/80 text-left">
            <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/60">
              <div className="text-xs font-semibold text-indigo-400 font-mono">01. DuckDB In-Memory</div>
              <p className="text-[11px] text-slate-400 mt-1">Sub-10ms analytical queries vectorized on column stores.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/60">
              <div className="text-xs font-semibold text-purple-400 font-mono">02. Schema-Only LLM</div>
              <p className="text-[11px] text-slate-400 mt-1">Zero data exposure. Only table metadata is passed to Gemini.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/60">
              <div className="text-xs font-semibold text-emerald-400 font-mono">03. Reactive Recharts</div>
              <p className="text-[11px] text-slate-400 mt-1">Visualizations morph automatically from natural language prompts.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 2. LOADED STATE
  return (
    <main className="flex-1 h-full overflow-y-auto p-6 space-y-6 bg-obsidian-900">
      {/* Top Row: 4 KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* KPI 1: Total Records */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Records</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {kpis.total_records.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400 font-medium">100% active</span>
            <span>in DuckDB</span>
          </div>
        </div>

        {/* KPI 2: Total Revenue */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Revenue</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {formatCurrency(kpis.total_revenue)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-medium">B2B + Enterprise</span>
          </div>
        </div>

        {/* KPI 3: Avg Order Value */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Order Value</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {formatCurrency(kpis.avg_order_value)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
            <span className="text-purple-400 font-medium">High margin tier</span>
          </div>
        </div>

        {/* KPI 4: Data Quality & Auto-Cleaned ETL */}
        <div 
          onClick={onOpenSanitizerModal}
          className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/60 transition-all cursor-pointer group shadow-glow-emerald"
          title="Click to view full AI Data Sanitizer & ETL Pipeline report"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider group-hover:text-emerald-300 transition-colors">
              Data Quality
            </span>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 group-hover:scale-105 transition-transform">
                <Sparkles className="w-2.5 h-2.5" />
                Auto-Cleaned
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums flex items-baseline justify-between">
            <span>{cleaningReport?.data_health_score ?? kpis.data_quality_percent}%</span>
            <span className="text-[10px] font-sans font-normal text-slate-400 group-hover:text-emerald-400 transition-colors underline decoration-dotted">
              View ETL Report ➔
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate">
              {cleaningReport ? `${cleaningReport.columns_normalized} cols normalized • ${cleaningReport.rows_removed} rows trimmed` : 'DuckDB Vectorized Clean'}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Main Visualization Canvas */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 shadow-glass">
        {/* Card Header & Chart Switcher */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <span>{chartConfig?.title || 'Interactive Visualization Canvas'}</span>
              {executionTimeMs > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {executionTimeMs} ms
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Plotting <span className="font-mono text-indigo-300">{chartConfig?.y_key}</span> against{' '}
              <span className="font-mono text-slate-300">{chartConfig?.x_key}</span>
            </p>
          </div>

          {/* Chart Type Switcher Segmented Control */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            <button
              type="button"
              onClick={() => setChartTypeOverride('bar')}
              title="Bar Chart"
              className={`p-1.5 rounded-lg text-xs font-medium btn-press transition-colors ${
                effectiveChartType === 'bar'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setChartTypeOverride('line')}
              title="Line Chart"
              className={`p-1.5 rounded-lg text-xs font-medium btn-press transition-colors ${
                effectiveChartType === 'line'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LineChartIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setChartTypeOverride('area')}
              title="Area Chart"
              className={`p-1.5 rounded-lg text-xs font-medium btn-press transition-colors ${
                effectiveChartType === 'area'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AreaChartIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chart Rendering Area */}
        <div className="h-[280px] w-full pt-2">
          {chartConfig && chartConfig.data && chartConfig.data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {effectiveChartType === 'bar' ? (
                <BarChart data={chartConfig.data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey={chartConfig.x_key}
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => (typeof val === 'number' && val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={chartConfig.y_key} fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : effectiveChartType === 'line' ? (
                <LineChart data={chartConfig.data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey={chartConfig.x_key}
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => (typeof val === 'number' && val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey={chartConfig.y_key}
                    stroke="#818CF8"
                    strokeWidth={3}
                    dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#A855F7' }}
                  />
                </LineChart>
              ) : (
                <AreaChart data={chartConfig.data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818CF8" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey={chartConfig.x_key}
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => (typeof val === 'number' && val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={chartConfig.y_key}
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#areaGradient)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Waiting for analytical query execution...
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Tabbed Data & SQL Inspector */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-glass">
        {/* Inspector Tabs */}
        <div className="flex items-center justify-between px-4 pt-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-semibold border-b-2 btn-press transition-colors ${
                activeTab === 'preview'
                  ? 'border-indigo-500 text-white bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>📋 Data Preview ({totalRows} rows)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sql')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-semibold border-b-2 btn-press transition-colors ${
                activeTab === 'sql'
                  ? 'border-indigo-500 text-white bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>&lt;/&gt; Generated SQL (DuckDB)</span>
            </button>
          </div>

          {/* Right Tab Status Badge */}
          <div className="flex items-center gap-2 pb-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock className="w-3 h-3" />
              <span>Executed in {executionTimeMs || '6.2'} ms</span>
            </span>
          </div>
        </div>

        {/* Tab 1 Content: Clean Paginated Data Table */}
        {activeTab === 'preview' && (
          <div className="p-4 space-y-3">
            <div className="overflow-x-auto rounded-xl border border-slate-800/80 max-h-[260px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider sticky top-0 backdrop-blur-md">
                    {tableColumns.map((col) => (
                      <th key={col} className="p-2.5 font-semibold whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {paginatedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      {tableColumns.map((col) => (
                        <td key={col} className="p-2.5 whitespace-nowrap tabular-nums text-slate-300">
                          {typeof row[col] === 'number'
                            ? row[col] % 1 !== 0
                              ? row[col].toFixed(2)
                              : row[col]
                            : String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 px-1">
              <span>
                Showing <span className="font-mono text-slate-200">{(page - 1) * pageSize + 1}</span> to{' '}
                <span className="font-mono text-slate-200">{Math.min(page * pageSize, totalRows)}</span> of{' '}
                <span className="font-mono text-slate-200">{totalRows}</span> rows
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 disabled:opacity-30 hover:bg-slate-800 text-slate-300 btn-press"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-xs text-slate-300">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 disabled:opacity-30 hover:bg-slate-800 text-slate-300 btn-press"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 Content: Syntax-Highlighted DuckDB SQL Code Block */}
        {activeTab === 'sql' && (
          <div className="p-4 relative">
            <div className="absolute top-6 right-6">
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg btn-press"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied SQL' : 'Copy'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-obsidian-950 border border-slate-800/80 font-mono text-xs text-indigo-300 overflow-x-auto leading-relaxed shadow-inner">
              <code>{sqlQuery || 'SELECT * FROM dataset LIMIT 10;'}</code>
            </pre>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Sandbox DuckDB Analytical Engine (Zero Network Exfiltration)</span>
              </div>
              <span>DuckDB v1.1 Dialect</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
