package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

func InsertRow(ctx context.Context, pool *pgxpool.Pool, params InsertRowParams) error {
	return fmt.Errorf("row insert is not implemented yet")
}

func UpdateRow(ctx context.Context, pool *pgxpool.Pool, params UpdateRowParams) error {
	return fmt.Errorf("row update is not implemented yet")
}

func DeleteRow(ctx context.Context, pool *pgxpool.Pool, params DeleteRowParams) error {
	return fmt.Errorf("row delete is not implemented yet")
}
