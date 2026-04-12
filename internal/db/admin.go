package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func CreateDatabase(ctx context.Context, pool *pgxpool.Pool, databaseName string) error {
	if databaseName == "" {
		return fmt.Errorf("database name is required")
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

	query := fmt.Sprintf("DROP SCHEMA %s CASCADE", pgx.Identifier{schemaName}.Sanitize())
	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("drop schema error: %w", err)
	}

	return nil
}
