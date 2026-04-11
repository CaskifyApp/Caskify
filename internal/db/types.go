package db

type QueryExecutionParams struct {
	ProfileID string `json:"profileId"`
	SQL       string `json:"sql"`
}

type DatabaseBackupParams struct {
	ProfileID string `json:"profileId"`
}

type DatabaseRestoreParams struct {
	ProfileID string `json:"profileId"`
}

type DatabaseOperationResult struct {
	Path    string `json:"path"`
	Message string `json:"message"`
}

type QueryResult struct {
	Columns         []string         `json:"columns"`
	Rows            []map[string]any `json:"rows"`
	RowsAffected    int64            `json:"rowsAffected"`
	ExecutionTimeMs int64            `json:"executionTimeMs"`
	StatementType   string           `json:"statementType"`
	Error           string           `json:"error,omitempty"`
}

type TablePageParams struct {
	ProfileID  string `json:"profileId"`
	Database   string `json:"database"`
	Schema     string `json:"schema"`
	Table      string `json:"table"`
	Page       int    `json:"page"`
	Limit      int    `json:"limit"`
	SortColumn string `json:"sortColumn,omitempty"`
	SortDir    string `json:"sortDir,omitempty"`
}

type TablePageResult struct {
	Columns    []string         `json:"columns"`
	Rows       []map[string]any `json:"rows"`
	TotalRows  int64            `json:"totalRows"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	SortColumn string           `json:"sortColumn,omitempty"`
	SortDir    string           `json:"sortDir,omitempty"`
	Table      string           `json:"table"`
	Schema     string           `json:"schema"`
	Database   string           `json:"database"`
}

type InsertRowParams struct {
	ProfileID string         `json:"profileId"`
	Database  string         `json:"database"`
	Schema    string         `json:"schema"`
	Table     string         `json:"table"`
	Values    map[string]any `json:"values"`
}

type UpdateRowParams struct {
	ProfileID      string         `json:"profileId"`
	Database       string         `json:"database"`
	Schema         string         `json:"schema"`
	Table          string         `json:"table"`
	Values         map[string]any `json:"values"`
	OriginalValues map[string]any `json:"originalValues"`
}

type DeleteRowParams struct {
	ProfileID      string         `json:"profileId"`
	Database       string         `json:"database"`
	Schema         string         `json:"schema"`
	Table          string         `json:"table"`
	OriginalValues map[string]any `json:"originalValues"`
}

type ColumnDef struct {
	OrdinalPosition int     `json:"ordinalPosition"`
	Name            string  `json:"name"`
	Type            string  `json:"type"`
	IsNullable      bool    `json:"isNullable"`
	DefaultVal      *string `json:"defaultVal,omitempty"`
	HasDefault      bool    `json:"hasDefault"`
	IsPrimaryKey    bool    `json:"isPrimaryKey"`
	IsIdentity      bool    `json:"isIdentity"`
	IsGenerated     bool    `json:"isGenerated"`
	IsUpdatable     bool    `json:"isUpdatable"`
}

type TableIndexInfo struct {
	Name      string   `json:"name"`
	Columns   []string `json:"columns"`
	Type      string   `json:"type"`
	IsUnique  bool     `json:"isUnique"`
	IsPrimary bool     `json:"isPrimary"`
}

type ForeignKeyInfo struct {
	ConstraintName   string `json:"constraintName"`
	ColumnName       string `json:"columnName"`
	ReferencedSchema string `json:"referencedSchema"`
	ReferencedTable  string `json:"referencedTable"`
	ReferencedColumn string `json:"referencedColumn"`
	UpdateRule       string `json:"updateRule"`
	DeleteRule       string `json:"deleteRule"`
}

type TableInfo struct {
	ConnectionID string `json:"connectionId"`
	Database     string `json:"database"`
	Schema       string `json:"schema"`
	Name         string `json:"name"`
	RowCount     int64  `json:"rowCount"`
}

type SchemaInfo struct {
	ConnectionID string `json:"connectionId"`
	Database     string `json:"database"`
	Name         string `json:"name"`
}

type DatabaseInfo struct {
	ConnectionID string `json:"connectionId"`
	Name         string `json:"name"`
}
