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
		definitions = append(definitions, definition)
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

	query := fmt.Sprintf("DROP TABLE %s", pgx.Identifier{schemaName, tableName}.Sanitize())
	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("drop table error: %w", err)
	}

	return nil
}
