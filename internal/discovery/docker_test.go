package discovery

import (
	"context"
	"errors"
	"testing"
)

func TestDiscoverDockerDatabasesWithDeps(t *testing.T) {
	deps := dockerDiscoveryDeps{
		lookPath: func(file string) (string, error) {
			return "/usr/bin/docker", nil
		},
		run: func(ctx context.Context, args ...string) ([]byte, error) {
			if len(args) > 0 && args[0] == "ps" {
				return []byte("abc123\ndef456\n"), nil
			}

			return []byte(`[
				{
					"Id": "abc123",
					"Name": "/postgres-dev",
					"Config": {
						"Image": "postgres:16",
						"Env": ["POSTGRES_DB=app_db", "POSTGRES_USER=app_user", "POSTGRES_PASSWORD=supersecret"]
					},
					"NetworkSettings": {
						"Ports": {"5432/tcp": [{"HostIp": "0.0.0.0", "HostPort": "55432"}]},
						"Networks": {"bridge": {"IPAddress": "172.17.0.2"}}
					}
				},
				{
					"Id": "def456",
					"Name": "/redis-dev",
					"Config": {
						"Image": "redis:7",
						"Env": []
					},
					"NetworkSettings": {
						"Ports": {},
						"Networks": {"bridge": {"IPAddress": "172.17.0.3"}}
					}
				}
			]`), nil
		},
	}

	got, err := discoverDockerDatabasesWithDeps(context.Background(), deps)
	if err != nil {
		t.Fatalf("discoverDockerDatabasesWithDeps returned error: %v", err)
	}

	if len(got) != 1 {
		t.Fatalf("expected 1 PostgreSQL container, got %d", len(got))
	}

	container := got[0]
	if container.ContainerName != "postgres-dev" {
		t.Fatalf("unexpected container name: %q", container.ContainerName)
	}
	if container.Host != "127.0.0.1" || container.Port != 55432 {
		t.Fatalf("unexpected endpoint: %s:%d", container.Host, container.Port)
	}
	if container.Database != "app_db" || container.Username != "app_user" {
		t.Fatalf("unexpected connection details: %#v", container)
	}
}

func TestDiscoverDockerDatabasesWithDepsReturnsDockerUnavailable(t *testing.T) {
	deps := dockerDiscoveryDeps{
		lookPath: func(file string) (string, error) {
			return "", errors.New("not found")
		},
		run: func(ctx context.Context, args ...string) ([]byte, error) {
			return nil, nil
		},
	}

	_, err := discoverDockerDatabasesWithDeps(context.Background(), deps)
	if !errors.Is(err, ErrDockerUnavailable) {
		t.Fatalf("expected ErrDockerUnavailable, got %v", err)
	}
}

func TestNormalizeDockerError(t *testing.T) {
	err := normalizeDockerError(errors.New("Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?"))
	if !errors.Is(err, ErrDockerDaemon) {
		t.Fatalf("expected ErrDockerDaemon, got %v", err)
	}
}
