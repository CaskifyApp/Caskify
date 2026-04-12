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
			CASE
				WHEN t.table_type = 'VIEW' THEN 'view'
				ELSE 'table'
			END AS relation_kind,
			COALESCE(c.reltuples::bigint, 0) AS row_count
		FROM information_schema.tables AS t
		LEFT JOIN pg_namespace AS n
			ON n.nspname = t.table_schema
		LEFT JOIN pg_class AS c
			ON c.relnamespace = n.oid
			AND c.relname = t.table_name
		WHERE t.table_schema = $1
			AND t.table_type IN ('BASE TABLE', 'VIEW')
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
		if err := rows.Scan(&t.Name, &t.Kind, &t.RowCount); err != nil {
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
			c.ordinal_position,
			c.column_name,
			CASE
				WHEN c.data_type = 'ARRAY' THEN c.udt_name
				WHEN c.data_type = 'USER-DEFINED' THEN c.udt_name
				ELSE c.data_type
			END AS display_type,
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
		if err := rows.Scan(&c.OrdinalPosition, &c.Name, &c.Type, &nullable, &c.DefaultVal, &c.HasDefault, &c.IsPrimaryKey, &c.IsIdentity, &c.IsGenerated, &c.IsUpdatable); err != nil {
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

func FetchIndexes(ctx context.Context, pool *pgxpool.Pool, schemaName, tableName string) ([]TableIndexInfo, error) {
	query := `
		SELECT
			i.relname AS index_name,
			array_agg(a.attname ORDER BY x.ordinality) AS column_names,
			am.amname AS index_type,
			idx.indisunique,
			idx.indisprimary
		FROM pg_class AS t
		JOIN pg_namespace AS n
			ON n.oid = t.relnamespace
		JOIN pg_index AS idx
			ON idx.indrelid = t.oid
		JOIN pg_class AS i
			ON i.oid = idx.indexrelid
		JOIN pg_am AS am
			ON am.oid = i.relam
		JOIN LATERAL unnest(idx.indkey) WITH ORDINALITY AS x(attnum, ordinality)
			ON TRUE
		JOIN pg_attribute AS a
			ON a.attrelid = t.oid
			AND a.attnum = x.attnum
		WHERE n.nspname = $1
			AND t.relname = $2
		GROUP BY i.relname, am.amname, idx.indisunique, idx.indisprimary
		ORDER BY idx.indisprimary DESC, i.relname`

	rows, err := pool.Query(ctx, query, schemaName, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	indexes := make([]TableIndexInfo, 0)
	for rows.Next() {
		var index TableIndexInfo
		if err := rows.Scan(&index.Name, &index.Columns, &index.Type, &index.IsUnique, &index.IsPrimary); err != nil {
			return nil, err
		}
		indexes = append(indexes, index)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return indexes, nil
}

func FetchForeignKeys(ctx context.Context, pool *pgxpool.Pool, schemaName, tableName string) ([]ForeignKeyInfo, error) {
	query := `
		SELECT
			tc.constraint_name,
			kcu.column_name,
			ccu.table_schema AS referenced_schema,
			ccu.table_name AS referenced_table,
			ccu.column_name AS referenced_column,
			rc.update_rule,
			rc.delete_rule
		FROM information_schema.table_constraints AS tc
		JOIN information_schema.key_column_usage AS kcu
			ON tc.constraint_name = kcu.constraint_name
			AND tc.table_schema = kcu.table_schema
		JOIN information_schema.constraint_column_usage AS ccu
			ON ccu.constraint_name = tc.constraint_name
			AND ccu.table_schema = tc.table_schema
		JOIN information_schema.referential_constraints AS rc
			ON rc.constraint_name = tc.constraint_name
			AND rc.constraint_schema = tc.table_schema
		WHERE tc.constraint_type = 'FOREIGN KEY'
			AND tc.table_schema = $1
			AND tc.table_name = $2
		ORDER BY kcu.ordinal_position`

	rows, err := pool.Query(ctx, query, schemaName, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	foreignKeys := make([]ForeignKeyInfo, 0)
	for rows.Next() {
		var foreignKey ForeignKeyInfo
		if err := rows.Scan(
			&foreignKey.ConstraintName,
			&foreignKey.ColumnName,
			&foreignKey.ReferencedSchema,
			&foreignKey.ReferencedTable,
			&foreignKey.ReferencedColumn,
			&foreignKey.UpdateRule,
			&foreignKey.DeleteRule,
		); err != nil {
			return nil, err
		}
		foreignKeys = append(foreignKeys, foreignKey)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return foreignKeys, nil
}
