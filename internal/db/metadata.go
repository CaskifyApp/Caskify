package db

import (
	"context"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func FetchDatabases(ctx context.Context, pool *pgxpool.Pool, profileID string) ([]DatabaseInfo, error) {
	dbs := make([]DatabaseInfo, 0)

	rows, err := pool.Query(ctx, `
		SELECT datname
		FROM pg_database
		WHERE datistemplate = false
		ORDER BY datname
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var db string
		if err := rows.Scan(&db); err != nil {
			return nil, err
		}
		dbs = append(dbs, DatabaseInfo{ConnectionID: profileID, Name: db})
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return dbs, nil
}

func FetchSchemas(ctx context.Context, pool *pgxpool.Pool, profileID, dbName string) ([]SchemaInfo, error) {
	schemas := make([]SchemaInfo, 0)

	rows, err := pool.Query(ctx, `
		SELECT schema_name
		FROM information_schema.schemata
		WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
		ORDER BY schema_name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var s string
		if err := rows.Scan(&s); err != nil {
			return nil, err
		}
		schemas = append(schemas, SchemaInfo{ConnectionID: profileID, Database: dbName, Name: s})
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return schemas, nil
}

func FetchTables(ctx context.Context, pool *pgxpool.Pool, profileID, databaseName, schemaName string) ([]TableInfo, error) {
	tables := make([]TableInfo, 0)

	rows, err := pool.Query(ctx, `
		SELECT
			t.table_name,
			COALESCE(c.reltuples::bigint, 0) AS row_count
		FROM information_schema.tables AS t
		LEFT JOIN pg_namespace AS n
			ON n.nspname = t.table_schema
		LEFT JOIN pg_class AS c
			ON c.relnamespace = n.oid
			AND c.relname = t.table_name
		WHERE t.table_schema = $1
			AND t.table_type = 'BASE TABLE'
		ORDER BY t.table_name
	`, schemaName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var t TableInfo
		t.ConnectionID = profileID
		t.Database = databaseName
		t.Schema = schemaName
		if err := rows.Scan(&t.Name, &t.RowCount); err != nil {
			return nil, err
		}
		tables = append(tables, t)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return tables, nil
}

func FetchColumns(ctx context.Context, pool *pgxpool.Pool, schemaName, tableName string) ([]ColumnDef, error) {
	columns := make([]ColumnDef, 0)

	query := `
		SELECT column_name, data_type, is_nullable, column_default
		FROM information_schema.columns
		WHERE table_schema = $1 AND table_name = $2
		ORDER BY ordinal_position`
	rows, err := pool.Query(ctx, query, schemaName, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var c ColumnDef
		var nullable string
		if err := rows.Scan(&c.Name, &c.Type, &nullable, &c.DefaultVal); err != nil {
			return nil, err
		}
		c.IsNullable = strings.EqualFold(nullable, "YES")
		columns = append(columns, c)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return columns, nil
}
