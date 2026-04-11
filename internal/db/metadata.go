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
		WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
			AND schema_name NOT LIKE 'pg_temp_%'
			AND schema_name NOT LIKE 'pg_toast_temp_%'
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
		SELECT
			c.column_name,
			c.data_type,
			c.is_nullable,
			c.column_default,
			(c.column_default IS NOT NULL) AS has_default,
			COALESCE(tc.constraint_type = 'PRIMARY KEY', false) AS is_primary_key,
			(c.is_identity = 'YES') AS is_identity,
			(c.is_generated <> 'NEVER') AS is_generated,
			(c.is_updatable = 'YES') AS is_updatable
		FROM information_schema.columns AS c
		LEFT JOIN information_schema.key_column_usage AS kcu
			ON c.table_schema = kcu.table_schema
			AND c.table_name = kcu.table_name
			AND c.column_name = kcu.column_name
		LEFT JOIN information_schema.table_constraints AS tc
			ON kcu.constraint_name = tc.constraint_name
			AND kcu.table_schema = tc.table_schema
			AND tc.constraint_type = 'PRIMARY KEY'
		WHERE c.table_schema = $1 AND c.table_name = $2
		ORDER BY c.ordinal_position`
	rows, err := pool.Query(ctx, query, schemaName, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var c ColumnDef
		var nullable string
		if err := rows.Scan(&c.Name, &c.Type, &nullable, &c.DefaultVal, &c.HasDefault, &c.IsPrimaryKey, &c.IsIdentity, &c.IsGenerated, &c.IsUpdatable); err != nil {
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
