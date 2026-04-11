package db

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func FetchTablePage(ctx context.Context, pool *pgxpool.Pool, params TablePageParams) (*TablePageResult, error) {
	page := params.Page
	if page < 1 {
		page = 1
	}

	limit := params.Limit
	if limit <= 0 {
		limit = 50
	}
	if limit > 5000 {
		limit = 5000
	}

	columns, err := FetchColumns(ctx, pool, params.Schema, params.Table)
	if err != nil {
		return nil, err
	}

	availableColumns := make(map[string]struct{}, len(columns))
	columnNames := make([]string, 0, len(columns))
	for _, column := range columns {
		availableColumns[column.Name] = struct{}{}
		columnNames = append(columnNames, column.Name)
	}

	sortColumn := ""
	if params.SortColumn != "" {
		if _, ok := availableColumns[params.SortColumn]; !ok {
			return nil, fmt.Errorf("invalid sort column")
		}
		sortColumn = params.SortColumn
	}

	sortDir := strings.ToLower(params.SortDir)
	if sortDir == "" {
		sortDir = "asc"
	}
	if sortDir != "asc" && sortDir != "desc" {
		return nil, fmt.Errorf("invalid sort direction")
	}

	tableRef := pgx.Identifier{params.Schema, params.Table}.Sanitize()
	offset := (page - 1) * limit

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s", tableRef)
	var totalRows int64
	if err := pool.QueryRow(ctx, countQuery).Scan(&totalRows); err != nil {
		return nil, fmt.Errorf("count query error: %w", err)
	}

	dataQuery := fmt.Sprintf("SELECT * FROM %s", tableRef)
	if sortColumn != "" {
		dataQuery += fmt.Sprintf(" ORDER BY %s %s", pgx.Identifier{sortColumn}.Sanitize(), strings.ToUpper(sortDir))
	}
	dataQuery += " LIMIT $1 OFFSET $2"

	rows, err := pool.Query(ctx, dataQuery, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("table data query error: %w", err)
	}
	defer rows.Close()

	resultRows := make([]map[string]any, 0)
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			return nil, fmt.Errorf("table row scan error: %w", err)
		}

		row := make(map[string]any, len(columnNames))
		for index, columnName := range columnNames {
			row[columnName] = values[index]
		}
		resultRows = append(resultRows, row)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("table row iteration error: %w", err)
	}

	return &TablePageResult{
		Columns:    columnNames,
		Rows:       resultRows,
		TotalRows:  totalRows,
		Page:       page,
		Limit:      limit,
		SortColumn: sortColumn,
		SortDir:    sortDir,
		Table:      params.Table,
		Schema:     params.Schema,
		Database:   params.Database,
	}, nil
}

func ExecuteQuery(ctx context.Context, pool *pgxpool.Pool, sql string) (*QueryResult, error) {
	trimmedSQL := strings.TrimSpace(sql)
	if trimmedSQL == "" {
		return nil, fmt.Errorf("query is empty")
	}

	normalizedSQL := strings.ToUpper(trimmedSQL)
	start := time.Now()
	isRowReturning := strings.HasPrefix(normalizedSQL, "SELECT") ||
		strings.HasPrefix(normalizedSQL, "WITH") ||
		strings.HasPrefix(normalizedSQL, "SHOW") ||
		strings.HasPrefix(normalizedSQL, "EXPLAIN") ||
		strings.HasPrefix(normalizedSQL, "VALUES") ||
		strings.HasPrefix(normalizedSQL, "TABLE") ||
		strings.Contains(normalizedSQL, " RETURNING ")

	if !isRowReturning {
		commandTag, err := pool.Exec(ctx, trimmedSQL)
		if err != nil {
			return nil, fmt.Errorf("query error: %w", err)
		}

		execTime := time.Since(start)
		return &QueryResult{
			Columns:         []string{},
			Rows:            []map[string]any{},
			RowsAffected:    commandTag.RowsAffected(),
			ExecutionTimeMs: execTime.Milliseconds(),
			StatementType:   strings.ToLower(commandTag.String()),
		}, nil
	}

	rows, err := pool.Query(ctx, trimmedSQL)
	if err != nil {
		return nil, fmt.Errorf("query error: %w", err)
	}
	defer rows.Close()

	fields := rows.FieldDescriptions()
	columns := make([]string, len(fields))
	for i, f := range fields {
		columns[i] = string(f.Name)
	}

	resultRows := make([]map[string]any, 0)
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			return nil, fmt.Errorf("row scan error: %w", err)
		}

		row := make(map[string]any, len(columns))
		for index, column := range columns {
			row[column] = values[index]
		}
		resultRows = append(resultRows, row)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("row iteration error: %w", err)
	}

	execTime := time.Since(start)
	return &QueryResult{
		Columns:         columns,
		Rows:            resultRows,
		RowsAffected:    int64(len(resultRows)),
		ExecutionTimeMs: execTime.Milliseconds(),
		StatementType:   "query",
	}, nil
}
