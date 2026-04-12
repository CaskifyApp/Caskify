package db

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"

	"caskpg/internal/profiles"
	"github.com/jackc/pgx/v5/pgxpool"
)

func CheckRestoreTarget(ctx context.Context, pool *pgxpool.Pool, databaseName string) (*DatabaseRestorePreflightResult, error) {
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

	schemas := make([]string, 0)
	for rows.Next() {
		var schemaName string
		if err := rows.Scan(&schemaName); err != nil {
			return nil, err
		}
		schemas = append(schemas, schemaName)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	objectCountQuery := `
		SELECT COUNT(*)
		FROM pg_class c
		JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
		  AND n.nspname NOT LIKE 'pg_temp_%'
		  AND n.nspname NOT LIKE 'pg_toast_temp_%'
		  AND c.relkind IN ('r', 'v', 'm', 'S', 'f', 'p')
	`

	var objectCount int64
	if err := pool.QueryRow(ctx, objectCountQuery).Scan(&objectCount); err != nil {
		return nil, err
	}

	return &DatabaseRestorePreflightResult{
		DatabaseName: databaseName,
		IsEmpty:      objectCount == 0,
		SchemaCount:  len(schemas),
		Schemas:      schemas,
		ObjectCount:  objectCount,
	}, nil
}

func ImportDatabaseSQL(ctx context.Context, profile profiles.Profile, password, databaseName, inputPath string) (*DatabaseOperationResult, error) {
	command := exec.CommandContext(
		ctx,
		"psql",
		"--host", profile.Host,
		"--port", strconv.Itoa(profile.Port),
		"--username", profile.Username,
		"--dbname", databaseName,
		"--single-transaction",
		"--set", "ON_ERROR_STOP=on",
		"--file", inputPath,
	)

	command.Env = append(os.Environ(),
		"PGPASSWORD="+password,
		"PGSSLMODE="+defaultSSLMode(profile.SSLMode),
	)

	output, err := command.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("psql failed: %w: %s", err, string(output))
	}

	warnings := extractPSQLWarnings(string(output))
	message := "Database restore completed successfully."
	status := "success"
	if len(warnings) > 0 {
		message = fmt.Sprintf("Database restore completed with %d warning(s).", len(warnings))
		status = "warning"
	}

	return &DatabaseOperationResult{
		Path:     inputPath,
		Message:  message,
		Status:   status,
		Warnings: warnings,
	}, nil
}

func extractPSQLWarnings(output string) []string {
	lines := strings.Split(output, "\n")
	warnings := make([]string, 0)

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.Contains(trimmed, "WARNING:") || strings.HasPrefix(trimmed, "HINT:") {
			warnings = append(warnings, trimmed)
		}
	}

	return warnings
}
