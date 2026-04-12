export interface Profile {
  id: string;
  name: string;
  host: string;
  port: number;
  database?: string;
  defaultDatabase?: string;
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
  queryLoading?: boolean;
  queryError?: string | null;
  tableData?: TablePageResult | null;
  tableColumns?: ColumnDef[];
  tableIndexes?: TableIndexInfo[];
  tableForeignKeys?: ForeignKeyInfo[];
  tableLoading?: boolean;
  tableError?: string | null;
  tableRefreshKey?: number;
  structureLoading?: boolean;
  structureError?: string | null;
  structureRefreshKey?: number;
  isRunning?: boolean;
  execError?: string | null;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowsAffected: number;
  executionTimeMs: number;
  statementType: string;
  truncated?: boolean;
  previewRowLimit?: number;
  error?: string;
}

export interface QueryExecutionParams {
  profileId: string;
  database: string;
  sql: string;
}

export interface DatabaseBackupParams {
  profileId: string;
  database: string;
}

export interface DatabaseRestoreParams {
  profileId: string;
  database: string;
}

export interface DatabaseOperationResult {
  path: string;
  message: string;
  status?: string;
  warnings?: string[];
}

export interface DatabaseRestorePreflightResult {
  databaseName: string;
  isEmpty: boolean;
  schemaCount: number;
  schemas: string[];
  objectCount: number;
}

export interface CreateDatabaseParams {
  profileId: string;
  name: string;
}

export interface DropDatabaseParams {
  profileId: string;
  name: string;
}

export interface CreateSchemaParams {
  profileId: string;
  database: string;
  name: string;
}

export interface DropSchemaParams {
  profileId: string;
  database: string;
  name: string;
}

export interface CreateTableColumnInput {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
}

export interface CreateTableParams {
  profileId: string;
  database: string;
  schema: string;
  name: string;
  columns: CreateTableColumnInput[];
}

export interface RenameTableParams {
  profileId: string;
  database: string;
  schema: string;
  oldName: string;
  newName: string;
}

export interface DropTableParams {
  profileId: string;
  database: string;
  schema: string;
  name: string;
}

export interface AddColumnParams {
  profileId: string;
  database: string;
  schema: string;
  table: string;
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
}

export interface RenameColumnParams {
  profileId: string;
  database: string;
  schema: string;
  table: string;
  oldName: string;
  newName: string;
}

export interface DropColumnParams {
  profileId: string;
  database: string;
  schema: string;
  table: string;
  name: string;
}

export interface SavedQuery {
  id: string;
  name: string;
  query: string;
  folderId: string;
}

export interface QueryFolder {
  id: string;
  name: string;
}

export interface SavedQueriesPayload {
  queries: SavedQuery[];
  folders: QueryFolder[];
}

export interface QueryHistoryEntry {
  id: string;
  query: string;
  database: string;
  timestamp: string;
  exec_time_ms: number;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  defaultRowsPerPage: number;
  editorFontSize: number;
  historyLimit: number;
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
  isEstimated?: boolean;
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
  ordinalPosition: number;
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

export interface TableIndexInfo {
  name: string;
  columns: string[];
  type: string;
  isUnique: boolean;
  isPrimary: boolean;
}

export interface ForeignKeyInfo {
  constraintName: string;
  columnName: string;
  referencedSchema: string;
  referencedTable: string;
  referencedColumn: string;
  updateRule: string;
  deleteRule: string;
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
