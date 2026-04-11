package db

import "time"

type QueryResult struct {
	Columns       []string        `json:"columns"`
	Rows          [][]interface{} `json:"rows"`
	RowsAffected  int             `json:"rowsAffected"`
	ExecutionTime time.Duration   `json:"executionTime"`
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
	Name         string  `json:"name"`
	Type         string  `json:"type"`
	IsNullable   bool    `json:"isNullable"`
	DefaultVal   *string `json:"defaultVal,omitempty"`
	IsPrimaryKey bool    `json:"isPrimaryKey"`
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
