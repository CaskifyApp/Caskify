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
