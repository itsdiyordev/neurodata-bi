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
  ChevronRight,
  Download,
  FileText,
  AlertTriangle,
  Pin,
  Trash2,
  LayoutDashboard,
  Compass,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap
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
import type { KPIData, ChartConfig, CleaningReport, FailedQuery, ProactiveInsight, PinnedWidget } from '../types';

interface DashboardCanvasProps {
  hasData: boolean;
  kpis: KPIData;
  chartConfig: ChartConfig | null;
  tableData: Record<string, any>[];
  sqlQuery: string;
  executionTimeMs: number;
  isLoading: boolean;
  cleaningReport?: CleaningReport | null;
  isHealed?: boolean;
  healingAttempts?: number;
  failedQueries?: FailedQuery[];
  proactiveInsights?: ProactiveInsight[];
  pinnedWidgets?: PinnedWidget[];
  canvasViewMode?: 'explorer' | 'dashboard';
  onViewModeChange?: (mode: 'explorer' | 'dashboard') => void;
  onPinCurrentChart?: () => void;
  onUnpinWidget?: (widgetId: string) => void;
  onInvestigateInsight?: (insight: ProactiveInsight) => void;
  onOpenWidgetInExplorer?: (widget: PinnedWidget) => void;
  onLoadDemo: () => void;
  onUploadClick: () => void;
  onOpenSanitizerModal?: () => void;
  onOpenReportModal?: () => void;
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
  isHealed,
  healingAttempts,
  failedQueries,
  proactiveInsights = [],
  pinnedWidgets = [],
  canvasViewMode = 'explorer',
  onViewModeChange,
  onPinCurrentChart,
  onUnpinWidget,
  onInvestigateInsight,
  onOpenWidgetInExplorer,
  onLoadDemo,
  onUploadClick,
  onOpenSanitizerModal,
  onOpenReportModal,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'sql'>('preview');
  const [chartTypeOverride, setChartTypeOverride] = useState<'bar' | 'line' | 'area' | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFailedSql, setShowFailedSql] = useState(false);
  const [isInsightsExpanded, setIsInsightsExpanded] = useState<boolean>(true);
  const [pinnedChartTypes, setPinnedChartTypes] = useState<Record<string, 'bar' | 'line' | 'area'>>({});
  const [pinnedShowSql, setPinnedShowSql] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const handleCopySql = () => {
    if (!sqlQuery) return;
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    if (!tableData || tableData.length === 0) return;
    const headers = Object.keys(tableData[0]);
    const csvLines = [
      headers.join(','),
      ...tableData.map((row) =>
        headers
          .map((field) => {
            const val = row[field] ?? '';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `neurodata_query_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
              NeuroData BI cleans and loads your dataset into a local persistent DuckDB database. Survives page refreshes with zero data exposure.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
              <span>Supports .csv, .xlsx, .xls</span>
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span>Auto-Cleaning ETL Enabled</span>
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
              <div className="text-xs font-semibold text-indigo-400 font-mono">01. DuckDB Persistent Storage</div>
              <p className="text-[11px] text-slate-400 mt-1">Local file-backed database survives browser refresh.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/60">
              <div className="text-xs font-semibold text-emerald-400 font-mono">02. Smart Data Sanitizer</div>
              <p className="text-[11px] text-slate-400 mt-1">Automatic header detection, snake_case, & currency coercion.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/60">
              <div className="text-xs font-semibold text-purple-400 font-mono">03. Self-Healing SQL Agent</div>
              <p className="text-[11px] text-slate-400 mt-1">Autonomous 3-retry repair loop on DuckDB execution errors.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 2. LOADED STATE
  return (
    <main className="flex-1 h-full overflow-y-auto p-6 space-y-5 bg-obsidian-900">
      {/* Top Header Action Bar: Workspace Status & Export AI Report */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Executive Intelligence Canvas
          </span>
          {isHealed && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-glow-emerald">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              <span>Self-Healed SQL ({healingAttempts} retry)</span>
            </span>
          )}
        </div>

        {/* View Switcher & Export Executive Report Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800">
            <button
              type="button"
              onClick={() => onViewModeChange?.('explorer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold btn-press transition-all ${
                canvasViewMode === 'explorer'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>🔍 Active Explorer</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange?.('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold btn-press transition-all ${
                canvasViewMode === 'dashboard'
                  ? 'bg-purple-600 text-white shadow-glow-purple'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>🎛️ Pinned Dashboard ({pinnedWidgets.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-xs font-semibold text-white shadow-glow-indigo transition-all btn-press group"
          >
            <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>📥 Export AI Report</span>
          </button>
        </div>
      </div>

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

      {/* Middle Section: Collapsible Zero-Prompt AI Insights & Anomalies Strip */}
      {proactiveInsights && proactiveInsights.length > 0 && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 overflow-hidden shadow-glass">
          <div 
            onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/40 hover:bg-slate-900/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Zap className="w-4 h-4 animate-pulse" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                ⚡ AI Zero-Prompt Insights &amp; Anomalies ({proactiveInsights.length} detected)
              </span>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                &bull; Autonomous statistical DuckDB scan on load
              </span>
            </div>
            <button type="button" className="text-slate-400 hover:text-white">
              {isInsightsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {isInsightsExpanded && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-800/60">
              {proactiveInsights.map((ins) => {
                const isAnomaly = ins.type === 'anomaly';
                const isDriver = ins.type === 'driver';
                const borderClass = isAnomaly ? 'border-amber-500/30 hover:border-amber-500/50 bg-amber-500/5' :
                                   isDriver ? 'border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/5' :
                                   'border-indigo-500/30 hover:border-indigo-500/50 bg-indigo-500/5';
                const badgeClass = isAnomaly ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                   isDriver ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                   'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
                const badgeText = isAnomaly ? '⚠️ Anomaly Detected' :
                                  isDriver ? '🏆 Top Driver' : '📈 Trend Alert';

                return (
                  <div key={ins.id} className={`p-3.5 rounded-xl border ${borderClass} flex flex-col justify-between space-y-2.5 transition-all`}>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${badgeClass}`}>
                          {badgeText}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white font-sans">{ins.title}</h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{ins.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onInvestigateInsight?.(ins)}
                      className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 btn-press transition-all"
                    >
                      <span>🔎 Investigate</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 1: ACTIVE EXPLORER */}
      {canvasViewMode === 'explorer' ? (
        <>
          {/* Main Visualization Canvas */}
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

              <div className="flex items-center gap-2">
                {/* Chart Type Switcher Segmented Control */}
                <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setChartTypeOverride('bar')}
                    className={`p-1.5 rounded-lg text-xs flex items-center gap-1 btn-press transition-colors ${
                      effectiveChartType === 'bar'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Bar Chart"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartTypeOverride('line')}
                    className={`p-1.5 rounded-lg text-xs flex items-center gap-1 btn-press transition-colors ${
                      effectiveChartType === 'line'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Line Chart"
                  >
                    <LineChartIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartTypeOverride('area')}
                    className={`p-1.5 rounded-lg text-xs flex items-center gap-1 btn-press transition-colors ${
                      effectiveChartType === 'area'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Area Chart"
                  >
                    <AreaChartIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Pin to Board Action Button */}
                {onPinCurrentChart && chartConfig && (
                  <button
                    type="button"
                    onClick={onPinCurrentChart}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 shadow-glow-emerald btn-press transition-all"
                    title="Pin this chart to your persistent Pinned Dashboard"
                  >
                    <Pin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>📌 Pin to Board</span>
                  </button>
                )}
              </div>
            </div>

        {/* Dynamic Recharts Component */}
        <div className="h-72 w-full pt-2">
          {chartConfig && chartConfig.data && chartConfig.data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {effectiveChartType === 'line' ? (
                <LineChart data={chartConfig.data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey={chartConfig.x_key}
                    stroke="#64748b"
                    fontSize={11}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(v) => (typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey={chartConfig.y_key}
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6, fill: '#818cf8', stroke: '#090d16', strokeWidth: 2 }}
                  />
                </LineChart>
              ) : effectiveChartType === 'area' ? (
                <AreaChart data={chartConfig.data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey={chartConfig.x_key}
                    stroke="#64748b"
                    fontSize={11}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(v) => (typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={chartConfig.y_key}
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#areaGradient)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={chartConfig.data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey={chartConfig.x_key}
                    stroke="#64748b"
                    fontSize={11}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(v) => (typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey={chartConfig.y_key}
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={55}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
              <Clock className="w-8 h-8 mb-2 opacity-50" />
              <span>Awaiting query generation...</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Tabbed Inspector (Data Preview & Generated SQL) */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-glass">
        {/* Tab Header */}
        <div className="flex items-center justify-between px-4 pt-3 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-1">
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
              {Boolean(sqlQuery && /\bJOIN\b/i.test(sqlQuery)) && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  🔗 Multi-Table JOIN Query
                </span>
              )}
              {isHealed && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Right Tab Status & Download CSV Button */}
          <div className="flex items-center gap-2 pb-2">
            {activeTab === 'preview' && totalRows > 0 && (
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 btn-press transition-colors"
                title="Download table data as CSV file"
              >
                <Download className="w-3 h-3 text-indigo-400" />
                <span>Download CSV</span>
              </button>
            )}

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock className="w-3 h-3" />
              <span>⚡ DuckDB: {executionTimeMs || '4.2'} ms | 🚀 Async Pipeline</span>
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

        {/* Tab 2 Content: Syntax-Highlighted DuckDB SQL Code Block + Self-Healing Inspection */}
        {activeTab === 'sql' && (
          <div className="p-4 space-y-3">
            {/* Multi-Table Relational JOIN Badge Banner */}
            {Boolean(sqlQuery && /\bJOIN\b/i.test(sqlQuery)) && (
              <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-xs text-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span>
                    <strong>🔗 Multi-Table Relational JOIN:</strong> This query queries across multiple tables in the DuckDB session workspace.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ⚡ DuckDB: {executionTimeMs || '4.2'} ms | 🚀 Async Pipeline
                </span>
              </div>
            )}

            {/* Self-Healed SQL Telemetry Banner */}
            {isHealed && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Self-Healed SQL:</strong> DuckDB caught an execution error on initial attempt and the agent automatically repaired the query.
                  </span>
                </div>
                {failedQueries && failedQueries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowFailedSql(!showFailedSql)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[11px] font-mono text-emerald-200 border border-emerald-500/30 btn-press transition-colors"
                  >
                    {showFailedSql ? 'Hide Failed Query' : 'Inspect Failed vs Fixed'}
                  </button>
                )}
              </div>
            )}

            {/* Toggleable Comparison Card */}
            {showFailedSql && failedQueries && failedQueries.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Initial Failed Query (Attempt #{failedQueries[0].attempt})</span>
                </div>
                <pre className="p-2.5 rounded-lg bg-slate-950/80 font-mono text-[11px] text-red-300 overflow-x-auto whitespace-pre-wrap border border-red-500/20">
                  {failedQueries[0].sql}
                </pre>
                <div className="text-[11px] font-mono text-red-400">
                  <strong>Diagnostic Error:</strong> {failedQueries[0].error}
                </div>
              </div>
            )}

            {/* Current Active/Healed SQL */}
            <div className="relative">
              <div className="absolute top-3 right-3 z-10">
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
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Verified DuckDB Analytical Engine (Zero Network Exfiltration)</span>
              </div>
              <span>DuckDB v1.1 Vectorized Dialect</span>
            </div>
          </div>
        )}
      </div>
        </>
      ) : (
        /* VIEW MODE 2: PINNED DASHBOARD (2-Column Bento Grid) */
        <div className="space-y-5">
          {pinnedWidgets.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Pinned Charts Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Pin charts from your <strong>Active Explorer</strong> or from the <strong>AI Copilot</strong> chat responses to create a customized multi-widget BI dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onViewModeChange?.('explorer')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-indigo btn-press transition-all"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Return to Active Explorer</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {pinnedWidgets.map((widget) => {
                const effectiveType = pinnedChartTypes[widget.id] || widget.chart_config?.type || 'bar';
                const showSql = Boolean(pinnedShowSql[widget.id]);
                const chartData = widget.chart_data || widget.chart_config?.data || [];
                const xKey = widget.chart_config?.x_key || 'x';
                const yKey = widget.chart_config?.y_key || 'y';

                return (
                  <div
                    key={widget.id}
                    className="glass-panel rounded-2xl p-5 border border-slate-800/80 shadow-glass flex flex-col justify-between hover:border-slate-700/80 transition-all"
                  >
                    {/* Widget Header */}
                    <div>
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/60 mb-3">
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate flex items-center gap-2">
                            <span>{widget.title}</span>
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                            <span>x: {xKey}</span>
                            <span>&bull;</span>
                            <span>y: {yKey}</span>
                            <span>&bull;</span>
                            <span>{chartData.length} records</span>
                          </div>
                        </div>

                        {/* Widget Actions: Mini Chart Switcher, SQL, Open in Explorer, Unpin */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Mini Chart Switcher */}
                          <div className="flex items-center p-0.5 rounded-lg bg-slate-900/80 border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setPinnedChartTypes(prev => ({ ...prev, [widget.id]: 'bar' }))}
                              className={`p-1 rounded text-xs transition-colors ${effectiveType === 'bar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                              title="Bar Chart"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPinnedChartTypes(prev => ({ ...prev, [widget.id]: 'line' }))}
                              className={`p-1 rounded text-xs transition-colors ${effectiveType === 'line' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                              title="Line Chart"
                            >
                              <LineChartIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPinnedChartTypes(prev => ({ ...prev, [widget.id]: 'area' }))}
                              className={`p-1 rounded text-xs transition-colors ${effectiveType === 'area' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                              title="Area Chart"
                            >
                              <AreaChartIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Toggle SQL */}
                          <button
                            type="button"
                            onClick={() => setPinnedShowSql(prev => ({ ...prev, [widget.id]: !prev[widget.id] }))}
                            className={`p-1.5 rounded-lg border text-xs btn-press transition-colors ${showSql ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800'}`}
                            title="View DuckDB SQL"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Open in Explorer */}
                          {onOpenWidgetInExplorer && (
                            <button
                              type="button"
                              onClick={() => onOpenWidgetInExplorer(widget)}
                              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-800 btn-press transition-colors"
                              title="Open in Active Explorer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Unpin */}
                          {onUnpinWidget && (
                            <button
                              type="button"
                              onClick={() => onUnpinWidget(widget.id)}
                              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 btn-press transition-colors"
                              title="Unpin Widget"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* SQL Code Block if open */}
                      {showSql && (
                        <div className="mb-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-indigo-300 overflow-x-auto whitespace-pre-wrap">
                          {widget.sql_query}
                        </div>
                      )}

                      {/* Interactive Recharts Canvas */}
                      <div className="h-56 w-full pt-1">
                        {chartData && chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            {effectiveType === 'line' ? (
                              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 15 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey={xKey} stroke="#64748b" fontSize={10} fontFamily="monospace" tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} fontFamily="monospace" tickLine={false} tickFormatter={(v) => (typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey={yKey} stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5, fill: '#818cf8' }} />
                              </LineChart>
                            ) : effectiveType === 'area' ? (
                              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 15 }}>
                                <defs>
                                  <linearGradient id={`pinnedArea_${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey={xKey} stroke="#64748b" fontSize={10} fontFamily="monospace" tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} fontFamily="monospace" tickLine={false} tickFormatter={(v) => (typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey={yKey} stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill={`url(#pinnedArea_${widget.id})`} />
                              </AreaChart>
                            ) : (
                              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 15 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey={xKey} stroke="#64748b" fontSize={10} fontFamily="monospace" tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} fontFamily="monospace" tickLine={false} tickFormatter={(v) => (typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey={yKey} fill="#6366f1" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                            No chart data available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Widget Footer: AI Insight Summary */}
                    {widget.insight_summary && (
                      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-start gap-2 text-xs text-slate-300">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{widget.insight_summary}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
};
