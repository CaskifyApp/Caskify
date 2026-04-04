package db

import "time"

type QueryResult struct {
	Columns       []string
	Rows          [][]interface{}
	RowsAffected  int
	ExecutionTime time.Duration
}

type ColumnDef struct {
	Name         string
	Type         string
	IsNullable   bool
	DefaultVal   *string
	IsPrimaryKey bool
}

type TableInfo struct {
	Schema   string
	Name     string
	RowCount int64
}
