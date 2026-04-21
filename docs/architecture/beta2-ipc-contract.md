# Beta2 IPC and Event Contract

This document defines the baseline IPC and event contract for `v1.0.0-beta2`.

## Goals

- Separate connection workflows into `local`, `docker`, and `cloud`.
- Keep the frontend state synchronized using event-first updates.
- Keep API shape stable before feature implementation begins.

## Connection Types

```go
type ConnectionType string

const (
    ConnectionTypeLocal  ConnectionType = "local"
    ConnectionTypeDocker ConnectionType = "docker"
    ConnectionTypeCloud  ConnectionType = "cloud"
)
```

## Invoke Contract (Go -> Frontend)

All methods below are planned for Wails binding exposure.

| Method | Params | Return | Purpose |
|---|---|---|---|
| `DiscoverLocalDatabases` | none | `[]LocalDatabaseInfo, error` | Scan local PostgreSQL targets and list browse-ready databases. |
| `DiscoverDockerDatabases` | none | `[]DockerDatabaseInfo, error` | Detect running PostgreSQL containers and map connection metadata. |
| `GetCloudProfiles` | none | `[]CloudProfileInfo, error` | Return user-saved cloud connection profiles. |
| `TestCloudConnection` | `profileID string` | `ConnectionTestResult, error` | Validate cloud connectivity before marking a profile healthy. |
| `RefreshConnectionDiscovery` | none | `DiscoverySnapshot, error` | Force immediate re-discovery for all source types. |

## Planned Data Contracts

```go
type LocalDatabaseInfo struct {
    ID       string `json:"id"`
    Host     string `json:"host"`
    Port     int    `json:"port"`
    Database string `json:"database"`
    Source   string `json:"source"` // localhost or unix-socket
}

type DockerDatabaseInfo struct {
    ID            string `json:"id"`
    ContainerID   string `json:"containerId"`
    ContainerName string `json:"containerName"`
    Host          string `json:"host"`
    Port          int    `json:"port"`
    Database      string `json:"database"`
    Username      string `json:"username"`
}

type CloudProfileInfo struct {
    ID       string `json:"id"`
    Name     string `json:"name"`
    Host     string `json:"host"`
    Port     int    `json:"port"`
    Database string `json:"database"`
    SSLMode  string `json:"sslMode"`
}

type ConnectionTestResult struct {
    ProfileID string `json:"profileId"`
    Healthy   bool   `json:"healthy"`
    Message   string `json:"message"`
}

type DiscoverySnapshot struct {
    Local  []LocalDatabaseInfo  `json:"local"`
    Docker []DockerDatabaseInfo `json:"docker"`
    Cloud  []CloudProfileInfo   `json:"cloud"`
}
```

## Event Contract (Backend -> Frontend)

| Event | Payload | Description |
|---|---|---|
| `discovery:local.updated` | `[]LocalDatabaseInfo` | Triggered when local database discovery changes. |
| `discovery:docker.updated` | `[]DockerDatabaseInfo` | Triggered when Docker discovery changes. |
| `discovery:cloud.updated` | `[]CloudProfileInfo` | Triggered when cloud profile data changes. |
| `discovery:error` | `{ source: string, message: string }` | Non-fatal discovery failure for one source type. |

## State Synchronization Strategy

- Primary mode: event-driven updates from Wails runtime events.
- Fallback mode: lightweight polling for Docker lifecycle drift.
- Frontend listeners must always unregister on cleanup to avoid leaks.

## Non-Goals for Beta2 Contract Baseline

- No setup wizard contract in this phase.
- No UI style overhaul contract in this phase.
- No schema or migration changes.
