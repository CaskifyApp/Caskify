package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func FetchTablePage(ctx context.Context, pool *pgxpool.Pool, params TablePageParams) (*TablePageResult, error) {
	return &TablePageResult{
		Columns:    []string{},
		Rows:       []map[string]any{},
		TotalRows:  0,
		Page:       params.Page,
		Limit:      params.Limit,
		SortColumn: params.SortColumn,
		SortDir:    params.SortDir,
		Table:      params.Table,
		Schema:     params.Schema,
		Database:   params.Database,
	}, nil
}

func ExecuteQuery(ctx context.Context, pool *pgxpool.Pool, sql string) (*QueryResult, error) {
	start := time.Now()
	rows, err := pool.Query(ctx, sql)
	if err != nil {
		return nil, fmt.Errorf("query error: %w", err)
	}
	defer rows.Close()

	fields := rows.FieldDescriptions()
	columns := make([]string, len(fields))
	for i, f := range fields {
		columns[i] = string(f.Name)
	}

	var resultRows [][]interface{}
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			return nil, fmt.Errorf("row scan error: %w", err)
		}
		resultRows = append(resultRows, values)
	}

	execTime := time.Since(start)
	return &QueryResult{
		Columns:       columns,
		Rows:          resultRows,
		RowsAffected:  len(resultRows),
		ExecutionTime: execTime,
	}, nil
}
