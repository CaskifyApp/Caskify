package discovery

import (
	"context"
	"reflect"
	"testing"
)

func TestDiscoverLocalDatabasesWithDeps(t *testing.T) {
	deps := localDiscoveryDeps{
		currentUsername: func() (string, error) {
			return "drenzzz", nil
		},
		envUsername: func() string {
			return ""
		},
		tcpReachable: func(host string, port int) bool {
			return host == "localhost" && port == 5432
		},
		socketExists: func(path string) bool {
			return path == "/var/run/postgresql/.s.PGSQL.5432"
		},
		listDatabases: func(ctx context.Context, candidate localCandidate, username string) ([]string, error) {
			if candidate.Path != "" {
				return []string{"postgres", "workspace"}, nil
			}
			return []string{"postgres", "analytics"}, nil
		},
	}

	got, err := discoverLocalDatabasesWithDeps(context.Background(), deps)
	if err != nil {
		t.Fatalf("discoverLocalDatabasesWithDeps returned error: %v", err)
	}

	want := []LocalDatabaseInfo{
		{ID: "local:5432:analytics", Source: "local", Host: "localhost", Port: 5432, Database: "analytics", Username: "postgres", Label: "localhost:5432"},
		{ID: "local:5432:postgres", Source: "local", Host: "localhost", Port: 5432, Database: "postgres", Username: "postgres", Label: "localhost:5432"},
		{ID: "local:5432:workspace", Source: "unix-socket", Host: "/var/run/postgresql", Port: 5432, Database: "workspace", Username: "postgres", Label: "unix:///var/run/postgresql"},
	}

	if !reflect.DeepEqual(got, want) {
		t.Fatalf("discoverLocalDatabasesWithDeps mismatch\nwant: %#v\ngot:  %#v", want, got)
	}
}

func TestDiscoverLocalDatabasesFallsBackToPostgresUser(t *testing.T) {
	deps := localDiscoveryDeps{
		currentUsername: func() (string, error) {
			return "drenzzz", nil
		},
		envUsername: func() string {
			return ""
		},
		tcpReachable: func(host string, port int) bool {
			return true
		},
		socketExists: func(path string) bool {
			return false
		},
		listDatabases: func(ctx context.Context, candidate localCandidate, username string) ([]string, error) {
			if username == "drenzzz" {
				return nil, context.DeadlineExceeded
			}
			if username == "postgres" {
				return []string{"postgres", "testing"}, nil
			}
			return nil, context.Canceled
		},
	}

	got, err := discoverLocalDatabasesWithDeps(context.Background(), deps)
	if err != nil {
		t.Fatalf("discoverLocalDatabasesWithDeps returned error: %v", err)
	}

	if len(got) != 2 {
		t.Fatalf("expected 2 local databases, got %d", len(got))
	}

	for _, database := range got {
		if database.Username != "postgres" {
			t.Fatalf("expected fallback username postgres, got %q", database.Username)
		}
	}
}

func TestBuildLocalConnectionStringForSocket(t *testing.T) {
	candidate := localCandidate{
		Path: "/var/run/postgresql/.s.PGSQL.5432",
		Port: 5432,
	}

	got := buildLocalConnectionString(candidate, "postgres", "postgres")
	want := "user=postgres dbname=postgres port=5432 sslmode=disable connect_timeout=3 host=/var/run/postgresql"
	if got != want {
		t.Fatalf("buildLocalConnectionString() = %q, want %q", got, want)
	}
}
