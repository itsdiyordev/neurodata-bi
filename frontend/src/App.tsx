import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardCanvas } from './components/DashboardCanvas';
import { CopilotPanel } from './components/CopilotPanel';
import { LiveDbModal } from './components/LiveDbModal';
import { AgentationWrapper } from './components/AgentationWrapper';
import type { DataProfile, ChartConfig, ChatMessage, KPIData } from './types';

const API_BASE = 'http://localhost:8000/api';

export const App: React.FC = () => {
  const [dataProfile, setDataProfile] = useState<DataProfile | null>(null);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [tableData, setTableData] = useState<Record<string, any>[]>([]);
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [executionTimeMs, setExecutionTimeMs] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveDbModalOpen, setIsLiveDbModalOpen] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('NEURODATA_GEMINI_KEY') || '';
  });

  const handleApiKeyChange = (key: string) => {
    setGeminiApiKey(key);
    localStorage.setItem('NEURODATA_GEMINI_KEY', key);
  };

  // Check health and existing session on mount
  useEffect(() => {
    fetch(`${API_BASE}/profile`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.has_data) {
          setDataProfile(data);
          if (data.default_chart) {
            setChartConfig(data.default_chart);
            setSqlQuery(data.default_chart.sql_query || '');
          }
          if (data.preview_rows) {
            setTableData(data.preview_rows);
          }
        }
      })
      .catch(() => {
        // Backend not yet reachable or empty session
      });
  }, []);

  // 1. Upload File Handler
  const handleUpload = async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to upload and parse file.');
      }

      const result = await res.json();
      const profile = result.profile;
      setDataProfile(profile);

      if (profile.default_chart) {
        setChartConfig(profile.default_chart);
        setSqlQuery(profile.default_chart.sql_query || '');
      }
      if (profile.preview_rows) {
        setTableData(profile.preview_rows);
      }

      // Add welcome message from Copilot
      const welcomeMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: `Successfully ingested "${file.name}" into DuckDB in-memory table "dataset" (${profile.total_records.toLocaleString()} records). Initial schema and distribution charts have been computed. Ask me any business question or pick a prompt below!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: 'DuckDB In-Memory Engine',
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
      const res = await fetch(`${API_BASE}/demo`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to load demo dataset.');
      }

      const result = await res.json();
      const profile = result.profile;
      setDataProfile(profile);

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
        text: `Loaded E-Commerce Demo Dataset with ${profile.total_records.toLocaleString()} orders into DuckDB table "dataset". Notice the monthly revenue trends across North America, EMEA, and APAC. Try asking: "Why did sales drop in March?" or "What is our best-selling product?"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: 'DuckDB In-Memory Engine',
      };
      setMessages([welcomeMsg]);
    } catch (err: any) {
      alert(`Demo load error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Ask Copilot Handler
  const handleSendMessage = async (text: string) => {
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
        },
        body: JSON.stringify({
          question: text,
          gemini_api_key: geminiApiKey || undefined,
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

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: analysis.explanation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sql_query: analysis.sql_query,
        execution_time_ms: analysis.execution_time_ms,
        row_count: analysis.row_count,
        reasoning_steps: analysis.reasoning_steps,
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
    data_quality_percent: dataProfile?.kpis?.data_quality_percent || 99.4,
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
        onUpload={handleUpload}
        onLoadDemo={handleLoadDemo}
        onOpenLiveDbModal={() => setIsLiveDbModalOpen(true)}
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
        onLoadDemo={handleLoadDemo}
        onUploadClick={() => {
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          fileInput?.click();
        }}
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

      {/* Agentation Visual Feedback Toolbar */}
      <AgentationWrapper />
    </div>
  );
};

export default App;
