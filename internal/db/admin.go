package db

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var identifierPattern = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)
var databaseObjectPattern = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_-]*$`)

var protectedDatabases = map[string]bool{
	"postgres":  true,
	"template0": true,
	"template1": true,
}

var protectedSchemas = map[string]bool{
	"pg_catalog":         true,
	"information_schema": true,
}

var protectedSchemaPrefixes = []string{
	"pg_toast",
	"pg_temp_",
	"pg_toast_temp_",
}

func isProtectedDatabase(name string) bool {
	return protectedDatabases[strings.ToLower(name)]
}

func isProtectedSchema(name string) bool {
	lower := strings.ToLower(name)
	if protectedSchemas[lower] {
		return true
	}
	for _, prefix := range protectedSchemaPrefixes {
		if strings.HasPrefix(lower, prefix) {
			return true
		}
	}
	return false
}

func validateIdentifier(value, label string) error {
	if value == "" {
		return fmt.Errorf("%s is required", label)
	}
	if !identifierPattern.MatchString(value) {
		return fmt.Errorf("invalid %s", label)
	}
	return nil
}

func validateDatabaseObjectName(value, label string) error {
	if value == "" {
		return fmt.Errorf("%s is required", label)
	}
	if !databaseObjectPattern.MatchString(value) {
		return fmt.Errorf("invalid %s", label)
	}
	return nil
}

func CreateDatabase(ctx context.Context, pool *pgxpool.Pool, databaseName string) error {
	if databaseName == "" {
		return fmt.Errorf("database name is required")
	}
	if err := validateDatabaseObjectName(databaseName, "database name"); err != nil {
		return err
	}

	query := fmt.Sprintf("CREATE DATABASE %s", pgx.Identifier{databaseName}.Sanitize())
	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("create database error: %w", err)
	}

	return nil
}

func DropDatabase(ctx context.Context, pool *pgxpool.Pool, databaseName string) error {
	if databaseName == "" {
		return fmt.Errorf("database name is required")
	}
	if err := validateDatabaseObjectName(databaseName, "database name"); err != nil {
		return err
	}
	if isProtectedDatabase(databaseName) {
		return fmt.Errorf("cannot drop protected system database %q", databaseName)
	}

	query := fmt.Sprintf("DROP DATABASE %s", pgx.Identifier{databaseName}.Sanitize())
	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("drop database error: %w", err)
	}

	return nil
}

func CreateSchema(ctx context.Context, pool *pgxpool.Pool, schemaName string) error {
	if schemaName == "" {
		return fmt.Errorf("schema name is required")
	}
	if err := validateDatabaseObjectName(schemaName, "schema name"); err != nil {
		return err
	}

	query := fmt.Sprintf("CREATE SCHEMA %s", pgx.Identifier{schemaName}.Sanitize())
	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("create schema error: %w", err)
	}

	return nil
}

func DropSchema(ctx context.Context, pool *pgxpool.Pool, schemaName string) error {
	if schemaName == "" {
		return fmt.Errorf("schema name is required")
	}
	if err := validateDatabaseObjectName(schemaName, "schema name"); err != nil {
		return err
	}
	if isProtectedSchema(schemaName) {
		return fmt.Errorf("cannot drop protected system schema %q", schemaName)
	}

	query := fmt.Sprintf("DROP SCHEMA %s CASCADE", pgx.Identifier{schemaName}.Sanitize())
	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("drop schema error: %w", err)
	}

	return nil
}

func CreateTable(ctx context.Context, pool *pgxpool.Pool, schemaName, tableName string, columns []CreateTableColumnInput) error {
	if schemaName == "" {
		return fmt.Errorf("schema name is required")
	}
	if tableName == "" {
		return fmt.Errorf("table name is required")
	}
	if err := validateDatabaseObjectName(schemaName, "schema name"); err != nil {
		return err
	}
	if err := validateDatabaseObjectName(tableName, "table name"); err != nil {
		return err
	}
	if len(columns) == 0 {
		return fmt.Errorf("at least one column is required")
	}

	definitions := make([]string, 0, len(columns))
	primaryKeys := make([]string, 0)
	for _, column := range columns {
		if column.Name == "" || column.Type == "" {
			return fmt.Errorf("column name and type are required")
		}
		if err := validateIdentifier(column.Name, "column name"); err != nil {
			return err
		}

		definition := fmt.Sprintf("%s %s", pgx.Identifier{column.Name}.Sanitize(), column.Type)
		if !column.Nullable {
			definition += " NOT NULL"
		}
		if column.DefaultValue != nil && *column.DefaultValue != "" {
			definition += fmt.Sprintf(" DEFAULT %s", *column.DefaultValue)
		}
		definitions = append(definitions, definition)
		if column.IsPrimaryKey {
			primaryKeys = append(primaryKeys, pgx.Identifier{column.Name}.Sanitize())
		}
	}

	if len(primaryKeys) > 0 {
		definitions = append(definitions, fmt.Sprintf("PRIMARY KEY (%s)", strings.Join(primaryKeys, ", ")))
	}

	query := fmt.Sprintf(
		"CREATE TABLE %s (%s)",
		pgx.Identifier{schemaName, tableName}.Sanitize(),
		strings.Join(definitions, ", "),
	)
	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("create table error: %w", err)
	}

	return nil
}

func RenameTable(ctx context.Context, pool *pgxpool.Pool, schemaName, oldName, newName string) error {
	if schemaName == "" || oldName == "" || newName == "" {
		return fmt.Errorf("schema name, current table name, and new table name are required")
	}
	if err := validateDatabaseObjectName(schemaName, "schema name"); err != nil {
		return err
	}
	if err := validateDatabaseObjectName(oldName, "current table name"); err != nil {
		return err
	}
	if err := validateDatabaseObjectName(newName, "new table name"); err != nil {
		return err
	}

	query := fmt.Sprintf(
		"ALTER TABLE %s RENAME TO %s",
		pgx.Identifier{schemaName, oldName}.Sanitize(),
		pgx.Identifier{newName}.Sanitize(),
	)
	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("rename table error: %w", err)
	}

	return nil
}

func DropTable(ctx context.Context, pool *pgxpool.Pool, schemaName, tableName string) error {
	if schemaName == "" || tableName == "" {
		return fmt.Errorf("schema name and table name are required")
	}
	if err := validateDatabaseObjectName(schemaName, "schema name"); err != nil {
		return err
	}
	if err := validateDatabaseObjectName(tableName, "table name"); err != nil {
		return err
	}
	if isProtectedSchema(schemaName) {
		return fmt.Errorf("cannot drop tables in protected system schema %q", schemaName)
	}

	query := fmt.Sprintf("DROP TABLE %s", pgx.Identifier{schemaName, tableName}.Sanitize())
	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("drop table error: %w", err)
	}

	return nil
}

func AddColumn(ctx context.Context, pool *pgxpool.Pool, schemaName, tableName string, params AddColumnParams) error {
	if err := validateDatabaseObjectName(schemaName, "schema name"); err != nil {
		return err
	}
	if err := validateDatabaseObjectName(tableName, "table name"); err != nil {
		return err
	}
	if err := validateIdentifier(params.Name, "column name"); err != nil {
		return err
	}

	query := fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s %s", pgx.Identifier{schemaName, tableName}.Sanitize(), pgx.Identifier{params.Name}.Sanitize(), params.Type)
	if !params.Nullable {
		query += " NOT NULL"
	}
	if params.Default != nil && *params.Default != "" {
		query += fmt.Sprintf(" DEFAULT %s", *params.Default)
	}
	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("add column error: %w", err)
	}
	return nil
}

func RenameColumn(ctx context.Context, pool *pgxpool.Pool, schemaName, tableName, oldName, newName string) error {
	if err := validateDatabaseObjectName(schemaName, "schema name"); err != nil {
		return err
	}
	if err := validateDatabaseObjectName(tableName, "table name"); err != nil {
		return err
	}
	if err := validateIdentifier(oldName, "current column name"); err != nil {
		return err
	}
	if err := validateIdentifier(newName, "new column name"); err != nil {
		return err
	}
	query := fmt.Sprintf("ALTER TABLE %s RENAME COLUMN %s TO %s", pgx.Identifier{schemaName, tableName}.Sanitize(), pgx.Identifier{oldName}.Sanitize(), pgx.Identifier{newName}.Sanitize())
	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("rename column error: %w", err)
	}
	return nil
}

func DropColumn(ctx context.Context, pool *pgxpool.Pool, schemaName, tableName, columnName string) error {
	if err := validateDatabaseObjectName(schemaName, "schema name"); err != nil {
		return err
	}
	if err := validateDatabaseObjectName(tableName, "table name"); err != nil {
		return err
	}
	if err := validateIdentifier(columnName, "column name"); err != nil {
		return err
	}
	query := fmt.Sprintf("ALTER TABLE %s DROP COLUMN %s", pgx.Identifier{schemaName, tableName}.Sanitize(), pgx.Identifier{columnName}.Sanitize())
	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("drop column error: %w", err)
	}
	return nil
}
