package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

func FetchDatabases(ctx context.Context, pool *pgxpool.Pool) ([]string, error) {
	rows, err := pool.Query(ctx, "SELECT datname FROM pg_database WHERE datistemplate = false")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var dbs []string
	for rows.Next() {
		var db string
		if err := rows.Scan(&db); err != nil {
			return nil, err
		}
		dbs = append(dbs, db)
	}
	return dbs, nil
}

func FetchSchemas(ctx context.Context, pool *pgxpool.Pool, dbName string) ([]string, error) {
	rows, err := pool.Query(ctx, "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema')")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schemas []string
	for rows.Next() {
		var s string
		if err := rows.Scan(&s); err != nil {
			return nil, err
		}
		schemas = append(schemas, s)
	}
	return schemas, nil
}

func FetchTables(ctx context.Context, pool *pgxpool.Pool, schemaName string) ([]TableInfo, error) {
	query := fmt.Sprintf("SELECT table_name, (SELECT count(*) FROM %s.%s) as row_count FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE'", schemaName, "pg_class")
	rows, err := pool.Query(ctx, query, schemaName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []TableInfo
	for rows.Next() {
		var t TableInfo
		t.Schema = schemaName
		if err := rows.Scan(&t.Name, &t.RowCount); err != nil {
			return nil, err
		}
		tables = append(tables, t)
	}
	return tables, nil
}

func FetchColumns(ctx context.Context, pool *pgxpool.Pool, schemaName, tableName string) ([]ColumnDef, error) {
	query := `
		SELECT column_name, data_type, is_nullable, column_default 
		FROM information_schema.columns 
		WHERE table_schema = $1 AND table_name = $2`
	rows, err := pool.Query(ctx, query, schemaName, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var columns []ColumnDef
	for rows.Next() {
		var c ColumnDef
		if err := rows.Scan(&c.Name, &c.Type, &c.IsNullable, &c.DefaultVal); err != nil {
			return nil, err
		}
		columns = append(columns, c)
	}
	return columns, nil
}
