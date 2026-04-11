package db

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func validateMutationColumns(columns []ColumnDef, values map[string]any) error {
	allowed := make(map[string]struct{}, len(columns))
	for _, column := range columns {
		allowed[column.Name] = struct{}{}
	}

	for name := range values {
		if _, ok := allowed[name]; !ok {
			return fmt.Errorf("invalid column: %s", name)
		}
	}

	return nil
}

func sortedKeys(values map[string]any) []string {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}

func buildWhereClause(values map[string]any, startIndex int) (string, []any) {
	keys := sortedKeys(values)
	clauses := make([]string, 0, len(keys))
	args := make([]any, 0, len(keys))

	for index, key := range keys {
		value := values[key]
		if value == nil {
			clauses = append(clauses, fmt.Sprintf("%s IS NULL", pgx.Identifier{key}.Sanitize()))
			continue
		}

		placeholder := startIndex + len(args) + 1
		clauses = append(clauses, fmt.Sprintf("%s = $%d", pgx.Identifier{key}.Sanitize(), placeholder))
		args = append(args, value)
		_ = index
	}

	return strings.Join(clauses, " AND "), args
}

func buildMutationMatchValues(columns []ColumnDef, originalValues map[string]any) map[string]any {
	primaryKeyValues := make(map[string]any)
	primaryKeyCount := 0

	for _, column := range columns {
		if !column.IsPrimaryKey {
			continue
		}

		primaryKeyCount++
		value, ok := originalValues[column.Name]
		if !ok {
			return originalValues
		}

		primaryKeyValues[column.Name] = value
	}

	if primaryKeyCount == 0 {
		return originalValues
	}

	return primaryKeyValues
}

func InsertRow(ctx context.Context, pool *pgxpool.Pool, params InsertRowParams) error {
	columns, err := FetchColumns(ctx, pool, params.Schema, params.Table)
	if err != nil {
		return err
	}

	if len(params.Values) == 0 {
		return fmt.Errorf("row values are required")
	}

	if err := validateMutationColumns(columns, params.Values); err != nil {
		return err
	}

	keys := sortedKeys(params.Values)
	columnRefs := make([]string, 0, len(keys))
	placeholders := make([]string, 0, len(keys))
	args := make([]any, 0, len(keys))

	for index, key := range keys {
		columnRefs = append(columnRefs, pgx.Identifier{key}.Sanitize())
		placeholders = append(placeholders, fmt.Sprintf("$%d", index+1))
		args = append(args, params.Values[key])
	}

	query := fmt.Sprintf(
		"INSERT INTO %s (%s) VALUES (%s)",
		pgx.Identifier{params.Schema, params.Table}.Sanitize(),
		strings.Join(columnRefs, ", "),
		strings.Join(placeholders, ", "),
	)

	_, err = pool.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("insert row error: %w", err)
	}

	return nil
}

func UpdateRow(ctx context.Context, pool *pgxpool.Pool, params UpdateRowParams) error {
	columns, err := FetchColumns(ctx, pool, params.Schema, params.Table)
	if err != nil {
		return err
	}

	if len(params.Values) == 0 {
		return fmt.Errorf("row values are required")
	}
	if len(params.OriginalValues) == 0 {
		return fmt.Errorf("original row values are required")
	}

	if err := validateMutationColumns(columns, params.Values); err != nil {
		return err
	}
	if err := validateMutationColumns(columns, params.OriginalValues); err != nil {
		return err
	}

	setKeys := sortedKeys(params.Values)
	setClauses := make([]string, 0, len(setKeys))
	args := make([]any, 0, len(setKeys)+len(params.OriginalValues))

	for index, key := range setKeys {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", pgx.Identifier{key}.Sanitize(), index+1))
		args = append(args, params.Values[key])
	}

	matchValues := buildMutationMatchValues(columns, params.OriginalValues)
	whereClause, whereArgs := buildWhereClause(matchValues, len(args))
	args = append(args, whereArgs...)

	query := fmt.Sprintf(
		"UPDATE %s SET %s WHERE %s",
		pgx.Identifier{params.Schema, params.Table}.Sanitize(),
		strings.Join(setClauses, ", "),
		whereClause,
	)

	result, err := pool.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("update row error: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("no rows were updated")
	}

	return nil
}

func DeleteRow(ctx context.Context, pool *pgxpool.Pool, params DeleteRowParams) error {
	columns, err := FetchColumns(ctx, pool, params.Schema, params.Table)
	if err != nil {
		return err
	}

	if len(params.OriginalValues) == 0 {
		return fmt.Errorf("original row values are required")
	}

	if err := validateMutationColumns(columns, params.OriginalValues); err != nil {
		return err
	}

	matchValues := buildMutationMatchValues(columns, params.OriginalValues)
	whereClause, args := buildWhereClause(matchValues, 0)
	query := fmt.Sprintf(
		"DELETE FROM %s WHERE %s",
		pgx.Identifier{params.Schema, params.Table}.Sanitize(),
		whereClause,
	)

	result, err := pool.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("delete row error: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("no rows were deleted")
	}

	return nil
}
