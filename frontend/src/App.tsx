import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardCanvas } from './components/DashboardCanvas';
import { CopilotPanel } from './components/CopilotPanel';
import { LiveDbModal } from './components/LiveDbModal';
import { DataSanitizerModal } from './components/DataSanitizerModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { AgentationWrapper } from './components/AgentationWrapper';
import type { DataProfile, ChartConfig, ChatMessage, KPIData, CleaningReport, FailedQuery, WorkspaceTable, TableRelationship } from './types';

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

  // Multi-Table Workspace State
  const [workspaceTables, setWorkspaceTables] = useState<WorkspaceTable[]>([]);
  const [relationships, setRelationships] = useState<TableRelationship[]>([]);

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
          if (data.workspace_tables) {
            setWorkspaceTables(data.workspace_tables);
          }
          if (data.relationships) {
            setRelationships(data.relationships);
          }
          if (data.profile.default_chart) {
            setChartConfig(data.profile.default_chart);
            setSqlQuery(data.profile.default_chart.sql_query || '');
          }
          if (data.profile.preview_rows) {
            setTableData(data.profile.preview_rows);
          }

          if (data.chat_history && data.chat_history.length > 0) {
            setMessages(data.chat_history);
          } else {
            const tableCount = data.workspace_tables?.length || 1;
            const restoreMsg: ChatMessage = {
              id: `msg-restore-${Date.now()}`,
              sender: 'ai',
              text: `🔄 Relational workspace restored from persistent DuckDB storage (${tableCount} table${tableCount > 1 ? 's' : ''}, ${data.profile.total_records.toLocaleString()} records). Auto-JOIN detection and schemas are live.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              engine: 'DuckDB Persistent Engine',
            };
            setMessages([restoreMsg]);
          }
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
      if (result.workspace_tables) {
        setWorkspaceTables(result.workspace_tables);
      }
      if (result.relationships) {
        setRelationships(result.relationships);
      }

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
        text: `✨ Successfully ingested and auto-sanitized "${file.name}" into DuckDB table "${profile.table_name}" (${profile.total_records.toLocaleString()} records).\n\n• ETL Pipeline normalized ${colsNormalized} column names to SQL-safe identifiers.\n• ${rowsTrimmed} empty/corrupted rows trimmed.\n• Data health score: ${health}%.\n• Workspace now has ${result.workspace_tables?.length || 1} active table(s) ready for multi-table JOIN queries.\n\nAsk me any business question across your tables or pick a prompt below!`,
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

  // 2. Load Demo Dataset Handler (3 Relational Tables: orders, customers, products)
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
      if (result.workspace_tables) {
        setWorkspaceTables(result.workspace_tables);
      }
      if (result.relationships) {
        setRelationships(result.relationships);
      }

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
        text: `✨ Loaded & auto-cleaned Relational E-Commerce Demo Dataset with 3 interconnected tables into persistent DuckDB:\n• 📦 orders (${profile.total_records.toLocaleString()} rows: revenue, quantity, region)\n• 👥 customers (85 rows: segment, lifetime_value)\n• 🏷️ products (26 rows: category, cost_price, profit_margin)\n\n🔗 Auto-detected join keys: orders.customer_id ↔ customers.customer_id and orders.product_id ↔ products.product_id.\n\nTry asking: "Show revenue by customer segment & product category" to test multi-table SQL JOIN queries!`,
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

  // 3. Switch Active Preview Table Handler
  const handleSelectTable = async (tableName: string) => {
    try {
      const res = await fetch(`${API_BASE}/tables/active/${tableName}?session_id=${sessionId}`, {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
        },
      });
      if (!res.ok) throw new Error('Failed to switch active table');
      const data = await res.json();
      if (data.profile) {
        setDataProfile(data.profile);
        if (data.profile.preview_rows) {
          setTableData(data.profile.preview_rows);
        }
        if (data.profile.default_chart) {
          setChartConfig(data.profile.default_chart);
          setSqlQuery(data.profile.default_chart.sql_query || '');
        }
      }
      if (data.workspace_tables) {
        setWorkspaceTables(data.workspace_tables);
      }
    } catch (err: any) {
      console.error('Error switching active table:', err);
    }
  };

  // 4. Delete Table from Workspace Handler
  const handleDeleteTable = async (tableName: string) => {
    if (!confirm(`Are you sure you want to remove table "${tableName}" from the workspace?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/tables/${tableName}?session_id=${sessionId}`, {
        method: 'DELETE',
        headers: {
          'X-Session-ID': sessionId,
        },
      });
      if (!res.ok) throw new Error('Failed to delete table');
      const data = await res.json();
      if (data.workspace_tables) {
        setWorkspaceTables(data.workspace_tables);
      }
      if (data.relationships) {
        setRelationships(data.relationships);
      }
      if (data.profile) {
        setDataProfile(data.profile);
        setTableData(data.profile.preview_rows || []);
      } else {
        setDataProfile(null);
        setTableData([]);
        setChartConfig(null);
        setSqlQuery('');
      }
      const deleteMsg: ChatMessage = {
        id: `msg-delete-${Date.now()}`,
        sender: 'ai',
        text: `🗑️ Table "${tableName}" was removed from the workspace. Active tables: ${data.workspace_tables?.length || 0}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: 'DuckDB Workspace Registry',
      };
      setMessages((prev) => [...prev, deleteMsg]);
    } catch (err: any) {
      alert(`Failed to delete table: ${err.message}`);
    }
  };

  // 5. Ask Copilot Handler (with Autonomous Self-Healing & Async Background Summary Support)
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
          session_id: sessionId,
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
        id: analysis.ai_message_id || `ai-${Date.now()}`,
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
        is_join: analysis.is_join,
        execution_metrics: analysis.execution_metrics,
        chart_config: analysis.chart_config,
        engine: analysis.engine,
        context_strategy: analysis.context_strategy,
        context_summary: analysis.context_summary,
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

  // 4. Clear Conversational Memory Handler
  const handleClearMemory = async () => {
    try {
      await fetch(`${API_BASE}/chat/clear?session_id=${sessionId}`, {
        method: 'DELETE',
        headers: {
          'X-Session-ID': sessionId,
        },
      });
      setMessages([
        {
          id: `msg-cleared-${Date.now()}`,
          sender: 'ai',
          text: '🧹 Conversational memory cleared. The 100-message context window has been reset for a fresh analysis.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          engine: 'DuckDB Memory Manager',
        }
      ]);
    } catch (err: any) {
      alert(`Failed to clear memory: ${err.message}`);
    }
  };

  // 5. Load Past AI Message on Canvas
  const handleLoadOnCanvas = (msg: ChatMessage) => {
    if (msg.chart_config) {
      setChartConfig(msg.chart_config);
      if (msg.chart_config.data && msg.chart_config.data.length > 0) {
        setTableData(msg.chart_config.data);
      }
    }
    if (msg.sql_query) {
      setSqlQuery(msg.sql_query);
    }
    if (msg.execution_time_ms !== undefined) {
      setExecutionTimeMs(msg.execution_time_ms);
    }
    if (msg.is_healed !== undefined) {
      setIsHealed(msg.is_healed);
    }
    if (msg.healing_attempts !== undefined) {
      setHealingAttempts(msg.healing_attempts);
    }
    if (msg.failed_queries) {
      setFailedQueries(msg.failed_queries);
    }
    if (msg.text) {
      setLatestAiExplanation(msg.text);
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
        workspaceTables={workspaceTables}
        relationships={relationships}
        isLoading={isLoading}
        cleaningReport={cleaningReport}
        onUpload={handleUpload}
        onLoadDemo={handleLoadDemo}
        onSelectTable={handleSelectTable}
        onDeleteTable={handleDeleteTable}
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
        onClearMemory={handleClearMemory}
        onLoadOnCanvas={handleLoadOnCanvas}
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
