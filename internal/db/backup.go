package db

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strconv"

	"caskpg/internal/profiles"
)

func ExportDatabaseSQL(ctx context.Context, profile profiles.Profile, password, databaseName, outputPath string) error {
	command := exec.CommandContext(
		ctx,
		"pg_dump",
		"--host", profile.Host,
		"--port", strconv.Itoa(profile.Port),
		"--username", profile.Username,
		"--format", "plain",
		"--file", outputPath,
		databaseName,
	)

	command.Env = append(os.Environ(),
		"PGPASSWORD="+password,
		"PGSSLMODE="+defaultSSLMode(profile.SSLMode),
	)

	output, err := command.CombinedOutput()
	if err != nil {
		return fmt.Errorf("pg_dump failed: %w: %s", err, string(output))
	}

	return nil
}

func defaultSSLMode(mode string) string {
	if mode == "" {
		return "disable"
	}
	return mode
}
