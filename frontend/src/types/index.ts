export type ColumnType = 'VARCHAR' | 'INTEGER' | 'DOUBLE' | 'DATE' | 'BOOLEAN';

export interface ColumnInfo {
  name: string;
  original_name?: string;
  type: ColumnType;
  raw_type: string;
}

export interface KPIData {
  total_records: number;
  total_revenue: number;
  avg_order_value: number;
  data_quality_percent: number;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'area';
  x_key: string;
  y_key: string;
  title: string;
  data: Record<string, any>[];
  sql_query?: string;
}

export interface TypeCoercion {
  column: string;
  from_type: string;
  to_type: string;
  sample_before?: string;
  sample_after?: string;
}

export interface CleaningReport {
  original_filename?: string;
  total_rows_before: number;
  total_rows_after: number;
  rows_removed: number;
  total_columns: number;
  columns_normalized: number;
  columns_mapping: Record<string, string>; // clean_name -> original_name
  types_coerced: TypeCoercion[];
  data_health_score: number;
}

export interface WorkspaceTable {
  table_name: string;
  original_filename: string;
  row_count: number;
  columns: ColumnInfo[];
  columns_count: number;
  cleaning_report?: CleaningReport;
  is_active?: boolean;
}

export interface TableRelationship {
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  join_clause: string;
  relationship_type?: string;
}

export interface ExecutionMetrics {
  sql_ms: number;
  llm_ms: number;
  async_background_summary: boolean;
  is_join?: boolean;
}

export interface DataProfile {
  has_data: boolean;
  table_name: string;
  session_id?: string;
  total_records: number;
  columns: ColumnInfo[];
  sample_rows: Record<string, any>[];
  preview_rows: Record<string, any>[];
  kpis: KPIData;
  default_chart?: ChartConfig;
  cleaning_report?: CleaningReport;
  workspace_tables?: WorkspaceTable[];
  relationships?: TableRelationship[];
}

export interface ReasoningTraceStep {
  step: string;
  status: 'info' | 'warning' | 'error' | 'healed' | 'success';
  detail: string;
}

export interface FailedQuery {
  attempt: number;
  sql: string;
  error: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  sql_query?: string;
  execution_time_ms?: number;
  row_count?: number;
  reasoning_steps?: string[];
  reasoning_trace?: ReasoningTraceStep[];
  healing_attempts?: number;
  failed_queries?: FailedQuery[];
  is_healed?: boolean;
  is_join?: boolean;
  chart_config?: ChartConfig;
  engine?: string;
  context_strategy?: string;
  context_summary?: string;
  execution_metrics?: ExecutionMetrics;
}
