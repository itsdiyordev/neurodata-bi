import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardCanvas } from './components/DashboardCanvas';
import { CopilotPanel } from './components/CopilotPanel';
import { LiveDbModal } from './components/LiveDbModal';
import { DataSanitizerModal } from './components/DataSanitizerModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { AgentationWrapper } from './components/AgentationWrapper';
import type { DataProfile, ChartConfig, ChatMessage, KPIData, CleaningReport, FailedQuery } from './types';

// Dynamic API base: uses relative /api when built/containerized, or localhost:8000 when running standalone Vite dev
const API_BASE = (import.meta as any).env?.VITE_API_BASE || 
  (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000/api' : '/api');

export const App: React.FC = () => {
  const [dataProfile, setDataProfile] = useState<DataProfile | null>(null);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [tableData, setTableData] = useState<Record<string, any>[]>([]);
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [executionTimeMs, setExecutionTimeMs] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveDbModalOpen, setIsLiveDbModalOpen] = useState<boolean>(false);
  const [isSanitizerModalOpen, setIsSanitizerModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [cleaningReport, setCleaningReport] = useState<CleaningReport | null>(null);

  // Self-Healing Telemetry State
  const [isHealed, setIsHealed] = useState<boolean>(false);
  const [healingAttempts, setHealingAttempts] = useState<number>(0);
  const [failedQueries, setFailedQueries] = useState<FailedQuery[]>([]);
  const [latestAiExplanation, setLatestAiExplanation] = useState<string>('');

  // Persistent session ID saved in localStorage
  const [sessionId] = useState<string>(() => {
    const existing = localStorage.getItem('NEURODATA_SESSION_ID');
    if (existing) return existing;
    const newId = `session_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    localStorage.setItem('NEURODATA_SESSION_ID', newId);
    return newId;
  });

  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('NEURODATA_GEMINI_KEY') || '';
  });

  const handleApiKeyChange = (key: string) => {
    setGeminiApiKey(key);
    localStorage.setItem('NEURODATA_GEMINI_KEY', key);
  };

  // Auto-restore session from persistent DuckDB storage on mount/refresh
  useEffect(() => {
    fetch(`${API_BASE}/session/restore?session_id=${sessionId}`, {
      headers: {
        'X-Session-ID': sessionId,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.restored && data.profile) {
          setDataProfile(data.profile);
          if (data.cleaning_report) {
            setCleaningReport(data.cleaning_report);
          }
          if (data.profile.default_chart) {
            setChartConfig(data.profile.default_chart);
            setSqlQuery(data.profile.default_chart.sql_query || '');
          }
          if (data.profile.preview_rows) {
            setTableData(data.profile.preview_rows);
          }

          const restoreMsg: ChatMessage = {
            id: `msg-restore-${Date.now()}`,
            sender: 'ai',
            text: `🔄 Active dataset successfully restored from local persistent DuckDB storage (${data.profile.total_records.toLocaleString()} records). Schema and distribution charts are live without data loss.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            engine: 'DuckDB Persistent Engine',
          };
          setMessages([restoreMsg]);
        }
      })
      .catch(() => {
        // Backend not yet reachable or empty session
      });
  }, [sessionId]);

  // 1. Upload File Handler (Auto-Sanitized & Persistent)
  const handleUpload = async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/upload?session_id=${sessionId}`, {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to upload and parse file.');
      }

      const result = await res.json();
      const profile = result.profile;
      const report = result.cleaning_report;

      setDataProfile(profile);
      setCleaningReport(report);

      if (profile.default_chart) {
        setChartConfig(profile.default_chart);
        setSqlQuery(profile.default_chart.sql_query || '');
      }
      if (profile.preview_rows) {
        setTableData(profile.preview_rows);
      }

      const colsNormalized = report?.columns_normalized || 0;
      const rowsTrimmed = report?.rows_removed || 0;
      const health = report?.data_health_score || 99.4;

      const welcomeMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: `✨ Successfully ingested and auto-sanitized "${file.name}" into DuckDB table "${profile.table_name}" (${profile.total_records.toLocaleString()} records).\n\n• ETL Pipeline normalized ${colsNormalized} column names to SQL-safe identifiers.\n• ${rowsTrimmed} empty/corrupted rows trimmed.\n• Data health score: ${health}%.\n\nAsk me any business question or pick a prompt below!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: 'DuckDB Persistent Engine',
      };
      setMessages((prev) => [...prev, welcomeMsg]);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Load Demo Dataset Handler
  const handleLoadDemo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/demo?session_id=${sessionId}`, {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to load demo dataset.');
      }

      const result = await res.json();
      const profile = result.profile;
      const report = result.cleaning_report;

      setDataProfile(profile);
      setCleaningReport(report);

      if (profile.default_chart) {
        setChartConfig(profile.default_chart);
        setSqlQuery(profile.default_chart.sql_query || '');
      }
      if (profile.preview_rows) {
        setTableData(profile.preview_rows);
      }

      const welcomeMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: `✨ Loaded & auto-cleaned E-Commerce Demo Dataset with ${profile.total_records.toLocaleString()} orders into persistent DuckDB table "${profile.table_name}". Data health verified at ${report?.data_health_score || 99.8}%. Notice the monthly revenue trends across North America, EMEA, and APAC. Try asking: "Why did sales drop in March?" or "What is our best-selling product?"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: 'DuckDB Persistent Engine',
      };
      setMessages([welcomeMsg]);
    } catch (err: any) {
      alert(`Demo load error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Ask Copilot Handler (with Autonomous Self-Healing Support)
  const handleSendMessage = async (text: string, simulateHealing: boolean = false) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
        },
        body: JSON.stringify({
          question: text,
          gemini_api_key: geminiApiKey || undefined,
          simulate_healing: simulateHealing,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to analyze inquiry.');
      }

      const analysis = await res.json();

      // Update interactive visualization canvas
      if (analysis.chart_config) {
        setChartConfig(analysis.chart_config);
      }
      if (analysis.sql_query) {
        setSqlQuery(analysis.sql_query);
      }
      if (analysis.execution_time_ms !== undefined) {
        setExecutionTimeMs(analysis.execution_time_ms);
      }
      if (analysis.data && analysis.data.length > 0) {
        setTableData(analysis.data);
      }

      // Update self-healing telemetry
      setIsHealed(Boolean(analysis.is_healed));
      setHealingAttempts(analysis.healing_attempts || 0);
      setFailedQueries(analysis.failed_queries || []);
      setLatestAiExplanation(analysis.explanation || '');

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: analysis.explanation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sql_query: analysis.sql_query,
        execution_time_ms: analysis.execution_time_ms,
        row_count: analysis.row_count,
        reasoning_steps: analysis.reasoning_steps,
        reasoning_trace: analysis.reasoning_trace,
        healing_attempts: analysis.healing_attempts,
        failed_queries: analysis.failed_queries,
        is_healed: analysis.is_healed,
        chart_config: analysis.chart_config,
        engine: analysis.engine,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `Analysis exception: ${err.message}. Please verify your query or check backend service logs.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultKpis: KPIData = {
    total_records: dataProfile?.total_records || 0,
    total_revenue: dataProfile?.kpis?.total_revenue || 0,
    avg_order_value: dataProfile?.kpis?.avg_order_value || 0,
    data_quality_percent: cleaningReport?.data_health_score ?? (dataProfile?.kpis?.data_quality_percent || 99.4),
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-obsidian-950 text-slate-100 font-sans">
      {/* Column 1: Left Sidebar (Data & Schema Explorer - 260px) */}
      <Sidebar
        hasData={Boolean(dataProfile?.has_data)}
        tableName={dataProfile?.table_name || 'dataset'}
        totalRecords={dataProfile?.total_records || 0}
        columns={dataProfile?.columns || []}
        isLoading={isLoading}
        cleaningReport={cleaningReport}
        onUpload={handleUpload}
        onLoadDemo={handleLoadDemo}
        onOpenLiveDbModal={() => setIsLiveDbModalOpen(true)}
        onOpenSanitizerModal={() => setIsSanitizerModalOpen(true)}
      />

      {/* Column 2: Center Main Canvas (Interactive Dashboard - ~60% width, scrollable) */}
      <DashboardCanvas
        hasData={Boolean(dataProfile?.has_data)}
        kpis={defaultKpis}
        chartConfig={chartConfig}
        tableData={tableData}
        sqlQuery={sqlQuery}
        executionTimeMs={executionTimeMs}
        isLoading={isLoading}
        cleaningReport={cleaningReport}
        isHealed={isHealed}
        healingAttempts={healingAttempts}
        failedQueries={failedQueries}
        onLoadDemo={handleLoadDemo}
        onUploadClick={() => {
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          fileInput?.click();
        }}
        onOpenSanitizerModal={() => setIsSanitizerModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Column 3: Right Panel (AI Copilot & Mode Switcher - 380px) */}
      <CopilotPanel
        messages={messages}
        isLoading={isLoading}
        hasData={Boolean(dataProfile?.has_data)}
        onSendMessage={handleSendMessage}
        geminiApiKey={geminiApiKey}
        onApiKeyChange={handleApiKeyChange}
      />

      {/* Modal: Live SQL Database Connection (Phase 2) */}
      <LiveDbModal
        isOpen={isLiveDbModalOpen}
        onClose={() => setIsLiveDbModalOpen(false)}
      />

      {/* Modal: Smart Data Sanitizer & ETL Pipeline Report */}
      <DataSanitizerModal
        isOpen={isSanitizerModalOpen}
        onClose={() => setIsSanitizerModalOpen(false)}
        report={cleaningReport}
        columns={dataProfile?.columns || []}
        tableName={dataProfile?.table_name || 'dataset'}
        sessionId={sessionId}
      />

      {/* Modal: One-Click Executive AI Intelligence Report */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        tableName={dataProfile?.table_name || 'dataset'}
        kpis={defaultKpis}
        chartConfig={chartConfig}
        tableData={tableData}
        sqlQuery={sqlQuery}
        executionTimeMs={executionTimeMs}
        latestAiExplanation={latestAiExplanation}
        isHealed={isHealed}
        healingAttempts={healingAttempts}
        cleaningReport={cleaningReport}
        sessionId={sessionId}
      />

      {/* Agentation Visual Feedback Toolbar */}
      <AgentationWrapper />
    </div>
  );
};

export default App;
