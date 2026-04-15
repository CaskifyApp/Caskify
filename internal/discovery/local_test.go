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
		{ID: "local:localhost:5432:analytics", Source: "local", Host: "localhost", Port: 5432, Database: "analytics", Username: "drenzzz", Label: "localhost:5432"},
		{ID: "local:localhost:5432:postgres", Source: "local", Host: "localhost", Port: 5432, Database: "postgres", Username: "drenzzz", Label: "localhost:5432"},
		{ID: "unix-socket:/var/run/postgresql:5432:postgres", Source: "unix-socket", Host: "/var/run/postgresql", Port: 5432, Database: "postgres", Username: "drenzzz", Label: "unix:///var/run/postgresql"},
		{ID: "unix-socket:/var/run/postgresql:5432:workspace", Source: "unix-socket", Host: "/var/run/postgresql", Port: 5432, Database: "workspace", Username: "drenzzz", Label: "unix:///var/run/postgresql"},
	}

	if !reflect.DeepEqual(got, want) {
		t.Fatalf("discoverLocalDatabasesWithDeps mismatch\nwant: %#v\ngot:  %#v", want, got)
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
