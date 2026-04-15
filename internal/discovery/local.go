package discovery

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/user"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const localConnectTimeout = 3 * time.Second

type LocalDatabaseInfo struct {
	ID       string `json:"id"`
	Source   string `json:"source"`
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Database string `json:"database"`
	Username string `json:"username"`
	Label    string `json:"label"`
}

type localCandidate struct {
	Source string
	Host   string
	Port   int
	Label  string
	Path   string
}

type localDiscoveryDeps struct {
	currentUsername func() (string, error)
	tcpReachable    func(host string, port int) bool
	socketExists    func(path string) bool
	listDatabases   func(ctx context.Context, candidate localCandidate, username string) ([]string, error)
}

func DiscoverLocalDatabases(ctx context.Context) ([]LocalDatabaseInfo, error) {
	deps := localDiscoveryDeps{
		currentUsername: currentUsername,
		tcpReachable:    tcpReachable,
		socketExists:    socketExists,
		listDatabases:   listLocalDatabases,
	}
	return discoverLocalDatabasesWithDeps(ctx, deps)
}

func discoverLocalDatabasesWithDeps(ctx context.Context, deps localDiscoveryDeps) ([]LocalDatabaseInfo, error) {
	username, err := deps.currentUsername()
	if err != nil {
		return nil, err
	}

	candidates := []localCandidate{
		{Source: "local", Host: "localhost", Port: 5432, Label: "localhost:5432"},
		{Source: "unix-socket", Host: "/var/run/postgresql", Port: 5432, Label: "unix:///var/run/postgresql", Path: "/var/run/postgresql/.s.PGSQL.5432"},
	}

	discovered := make([]LocalDatabaseInfo, 0)
	seen := make(map[string]struct{})

	for _, candidate := range candidates {
		isReachable := false
		if candidate.Path != "" {
			isReachable = deps.socketExists(candidate.Path)
		} else {
			isReachable = deps.tcpReachable(candidate.Host, candidate.Port)
		}

		if !isReachable {
			continue
		}

		databases, listErr := deps.listDatabases(ctx, candidate, username)
		if listErr != nil {
			continue
		}

		for _, databaseName := range databases {
			key := fmt.Sprintf("%s:%s:%d:%s", candidate.Source, candidate.Host, candidate.Port, databaseName)
			if _, exists := seen[key]; exists {
				continue
			}

			seen[key] = struct{}{}
			discovered = append(discovered, LocalDatabaseInfo{
				ID:       key,
				Source:   candidate.Source,
				Host:     candidate.Host,
				Port:     candidate.Port,
				Database: databaseName,
				Username: username,
				Label:    candidate.Label,
			})
		}
	}

	sort.Slice(discovered, func(i, j int) bool {
		if discovered[i].Source == discovered[j].Source {
			if discovered[i].Database == discovered[j].Database {
				return discovered[i].Label < discovered[j].Label
			}
			return discovered[i].Database < discovered[j].Database
		}
		return discovered[i].Source < discovered[j].Source
	})

	return discovered, nil
}

func currentUsername() (string, error) {
	if envUser := strings.TrimSpace(os.Getenv("PGUSER")); envUser != "" {
		return envUser, nil
	}

	currentUser, err := user.Current()
	if err != nil {
		return "", fmt.Errorf("failed to detect current user: %w", err)
	}

	if currentUser.Username == "" {
		return "", fmt.Errorf("current user has no username")
	}

	return currentUser.Username, nil
}

func tcpReachable(host string, port int) bool {
	conn, err := net.DialTimeout("tcp", net.JoinHostPort(host, fmt.Sprintf("%d", port)), time.Second)
	if err != nil {
		return false
	}
	_ = conn.Close()
	return true
}

func socketExists(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return !info.IsDir()
}

func listLocalDatabases(ctx context.Context, candidate localCandidate, username string) ([]string, error) {
	databaseName := "postgres"
	connString := buildLocalConnectionString(candidate, username, databaseName)

	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, err
	}

	config.MaxConns = 1
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, err
	}
	defer pool.Close()

	pingCtx, cancel := context.WithTimeout(ctx, localConnectTimeout)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		return nil, err
	}

	queryCtx, queryCancel := context.WithTimeout(ctx, localConnectTimeout)
	defer queryCancel()
	rows, err := pool.Query(queryCtx, `
		SELECT datname
		FROM pg_database
		WHERE datistemplate = false
		ORDER BY datname
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	databases := make([]string, 0)
	for rows.Next() {
		var database string
		if err := rows.Scan(&database); err != nil {
			return nil, err
		}
		databases = append(databases, database)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return databases, nil
}

func buildLocalConnectionString(candidate localCandidate, username, databaseName string) string {
	parts := []string{
		fmt.Sprintf("user=%s", username),
		fmt.Sprintf("dbname=%s", databaseName),
		fmt.Sprintf("port=%d", candidate.Port),
		"sslmode=disable",
		fmt.Sprintf("connect_timeout=%d", int(localConnectTimeout.Seconds())),
	}

	if candidate.Path != "" {
		parts = append(parts, fmt.Sprintf("host=%s", filepath.Dir(candidate.Path)))
	} else {
		parts = append(parts, fmt.Sprintf("host=%s", candidate.Host))
	}

	return strings.Join(parts, " ")
}
