export type ColumnType = 'VARCHAR' | 'INTEGER' | 'DOUBLE' | 'DATE' | 'BOOLEAN';

export interface ColumnInfo {
  name: string;
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

export interface DataProfile {
  has_data: boolean;
  table_name: string;
  total_records: number;
  columns: ColumnInfo[];
  sample_rows: Record<string, any>[];
  preview_rows: Record<string, any>[];
  kpis: KPIData;
  default_chart?: ChartConfig;
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
  chart_config?: ChartConfig;
  engine?: string;
}
