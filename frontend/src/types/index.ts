export interface Profile {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  ssl_mode: string;
}

export interface ConnectionStatus {
  profileId: string;
  connected: boolean;
  error?: string;
}

export interface Tab {
  id: string;
  title: string;
  mode: 'table' | 'query';
  connectionId: string;
  databaseName?: string;
  tableName?: string;
  schemaName?: string;
  subView?: 'data' | 'structure' | 'indexes';
  pagination?: { page: number; limit: number };
  sortColumn?: string;
  sortDir?: 'asc' | 'desc';
  queryText?: string;
  queryResult?: QueryResult | null;
  tableData?: TablePageResult | null;
  tableColumns?: ColumnDef[];
  tableLoading?: boolean;
  tableError?: string | null;
  tableRefreshKey?: number;
  isRunning?: boolean;
  execError?: string | null;
}

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  rowsAffected: number;
  executionTime: number;
}

export interface TablePageParams {
  profileId: string;
  database: string;
  schema: string;
  table: string;
  page: number;
  limit: number;
  sortColumn?: string;
  sortDir?: 'asc' | 'desc';
}

export interface TablePageResult {
  columns: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  page: number;
  limit: number;
  sortColumn?: string;
  sortDir?: 'asc' | 'desc';
  table: string;
  schema: string;
  database: string;
}

export interface InsertRowParams {
  profileId: string;
  database: string;
  schema: string;
  table: string;
  values: Record<string, unknown>;
}

export interface UpdateRowParams {
  profileId: string;
  database: string;
  schema: string;
  table: string;
  values: Record<string, unknown>;
  originalValues: Record<string, unknown>;
}

export interface DeleteRowParams {
  profileId: string;
  database: string;
  schema: string;
  table: string;
  originalValues: Record<string, unknown>;
}

export interface ColumnDef {
  name: string;
  type: string;
  isNullable: boolean;
  defaultVal?: string;
  hasDefault: boolean;
  isPrimaryKey: boolean;
  isIdentity: boolean;
  isGenerated: boolean;
  isUpdatable: boolean;
}

export interface TableInfo {
  connectionId: string;
  database: string;
  schema: string;
  name: string;
  rowCount: number;
}

export interface SchemaInfo {
  connectionId: string;
  database: string;
  name: string;
}

export interface DatabaseInfo {
  connectionId: string;
  name: string;
}

export interface TreeNode {
  id: string;
  label: string;
  type: 'connection' | 'database' | 'schema' | 'table';
  connectionId: string;
  database?: string;
  schema?: string;
  children?: TreeNode[];
  expanded?: boolean;
  loading?: boolean;
  error?: string | null;
  metadata?: TableInfo;
}
