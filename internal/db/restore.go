package db

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strconv"

	"caskpg/internal/profiles"
)

func ImportDatabaseSQL(ctx context.Context, profile profiles.Profile, password, inputPath string) error {
	command := exec.CommandContext(
		ctx,
		"psql",
		"--host", profile.Host,
		"--port", strconv.Itoa(profile.Port),
		"--username", profile.Username,
		"--dbname", profile.ActiveDatabase(),
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
		return fmt.Errorf("psql failed: %w: %s", err, string(output))
	}

	return nil
}
