package db

import "time"

type QueryResult struct {
	Columns       []string        `json:"columns"`
	Rows          [][]interface{} `json:"rows"`
	RowsAffected  int             `json:"rowsAffected"`
	ExecutionTime time.Duration   `json:"executionTime"`
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
