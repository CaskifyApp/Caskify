package discovery

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os/exec"
	"sort"
	"strconv"
	"strings"
)

var (
	ErrDockerUnavailable = errors.New("Docker CLI is not installed")
	ErrDockerDaemon      = errors.New("Docker daemon is unavailable")
)

type DockerDatabaseInfo struct {
	ID            string `json:"id"`
	Source        string `json:"source"`
	ContainerID   string `json:"containerId"`
	ContainerName string `json:"containerName"`
	Image         string `json:"image"`
	Host          string `json:"host"`
	Port          int    `json:"port"`
	Database      string `json:"database"`
	Username      string `json:"username"`
	Password      string `json:"password,omitempty"`
}

type dockerDiscoveryDeps struct {
	lookPath func(file string) (string, error)
	run      func(ctx context.Context, args ...string) ([]byte, error)
}

type dockerInspectRecord struct {
	ID     string `json:"Id"`
	Name   string `json:"Name"`
	Config struct {
		Image string   `json:"Image"`
		Env   []string `json:"Env"`
	} `json:"Config"`
	NetworkSettings struct {
		Ports    map[string][]dockerPortBinding     `json:"Ports"`
		Networks map[string]dockerNetworkAttachment `json:"Networks"`
	} `json:"NetworkSettings"`
}

type dockerPortBinding struct {
	HostIP   string `json:"HostIp"`
	HostPort string `json:"HostPort"`
}

type dockerNetworkAttachment struct {
	IPAddress string `json:"IPAddress"`
}

func DiscoverDockerDatabases(ctx context.Context) ([]DockerDatabaseInfo, error) {
	deps := dockerDiscoveryDeps{
		lookPath: exec.LookPath,
		run:      runDockerCommand,
	}
	return discoverDockerDatabasesWithDeps(ctx, deps)
}

func discoverDockerDatabasesWithDeps(ctx context.Context, deps dockerDiscoveryDeps) ([]DockerDatabaseInfo, error) {
	if _, err := deps.lookPath("docker"); err != nil {
		return nil, ErrDockerUnavailable
	}

	containerIDsOutput, err := deps.run(ctx, "ps", "--format", "{{.ID}}")
	if err != nil {
		return nil, normalizeDockerError(err)
	}

	containerIDs := strings.Fields(strings.TrimSpace(string(containerIDsOutput)))
	if len(containerIDs) == 0 {
		return []DockerDatabaseInfo{}, nil
	}

	inspectArgs := append([]string{"inspect"}, containerIDs...)
	inspectOutput, err := deps.run(ctx, inspectArgs...)
	if err != nil {
		return nil, normalizeDockerError(err)
	}

	var records []dockerInspectRecord
	if err := json.Unmarshal(inspectOutput, &records); err != nil {
		return nil, fmt.Errorf("failed to parse Docker inspect output: %w", err)
	}

	discovered := make([]DockerDatabaseInfo, 0)
	for _, record := range records {
		info, ok := mapDockerInspectRecord(record)
		if !ok {
			continue
		}
		discovered = append(discovered, info)
	}

	sort.Slice(discovered, func(i, j int) bool {
		if discovered[i].ContainerName == discovered[j].ContainerName {
			return discovered[i].Database < discovered[j].Database
		}
		return discovered[i].ContainerName < discovered[j].ContainerName
	})

	return discovered, nil
}

func normalizeDockerError(err error) error {
	if err == nil {
		return nil
	}

	message := strings.ToLower(strings.TrimSpace(err.Error()))
	switch {
	case strings.Contains(message, "docker daemon"):
		return ErrDockerDaemon
	case strings.Contains(message, "permission denied") && strings.Contains(message, "docker.sock"):
		return fmt.Errorf("Docker socket access denied: add the current user to the docker group or run Docker Desktop")
	case strings.Contains(message, "cannot connect to the docker daemon"):
		return ErrDockerDaemon
	default:
		return err
	}
}

func mapDockerInspectRecord(record dockerInspectRecord) (DockerDatabaseInfo, bool) {
	imageName := strings.ToLower(record.Config.Image)
	envMap := parseDockerEnv(record.Config.Env)

	isPostgresImage := strings.Contains(imageName, "postgres") || strings.Contains(imageName, "postgis")
	hasPostgresEnv := envMap["POSTGRES_DB"] != "" || envMap["POSTGRES_USER"] != "" || envMap["POSTGRES_PASSWORD"] != ""
	if !isPostgresImage && !hasPostgresEnv {
		return DockerDatabaseInfo{}, false
	}

	host, port := resolveDockerEndpoint(record)
	if port == 0 {
		port = 5432
	}

	containerName := strings.TrimPrefix(record.Name, "/")
	if containerName == "" {
		containerName = shortContainerID(record.ID)
	}

	databaseName := envMap["POSTGRES_DB"]
	if databaseName == "" {
		databaseName = "postgres"
	}

	username := envMap["POSTGRES_USER"]
	if username == "" {
		username = "postgres"
	}

	id := fmt.Sprintf("docker:%s:%s:%d", shortContainerID(record.ID), host, port)
	return DockerDatabaseInfo{
		ID:            id,
		Source:        "docker",
		ContainerID:   shortContainerID(record.ID),
		ContainerName: containerName,
		Image:         record.Config.Image,
		Host:          host,
		Port:          port,
		Database:      databaseName,
		Username:      username,
		Password:      envMap["POSTGRES_PASSWORD"],
	}, true
}

func resolveDockerEndpoint(record dockerInspectRecord) (string, int) {
	if bindings, ok := record.NetworkSettings.Ports["5432/tcp"]; ok && len(bindings) > 0 {
		for _, binding := range bindings {
			if binding.HostPort == "" {
				continue
			}

			port, err := strconv.Atoi(binding.HostPort)
			if err != nil {
				continue
			}

			host := binding.HostIP
			if host == "" || host == "0.0.0.0" || host == "::" {
				host = "127.0.0.1"
			}
			return host, port
		}
	}

	networkNames := make([]string, 0, len(record.NetworkSettings.Networks))
	for networkName := range record.NetworkSettings.Networks {
		networkNames = append(networkNames, networkName)
	}
	sort.Strings(networkNames)

	for _, networkName := range networkNames {
		network := record.NetworkSettings.Networks[networkName]
		if network.IPAddress != "" {
			return network.IPAddress, 5432
		}
	}

	return "127.0.0.1", 5432
}

func parseDockerEnv(entries []string) map[string]string {
	values := make(map[string]string, len(entries))
	for _, entry := range entries {
		key, value, found := strings.Cut(entry, "=")
		if !found {
			continue
		}
		values[key] = value
	}
	return values
}

func shortContainerID(containerID string) string {
	trimmed := strings.TrimSpace(containerID)
	if len(trimmed) > 12 {
		return trimmed[:12]
	}
	return trimmed
}

func runDockerCommand(ctx context.Context, args ...string) ([]byte, error) {
	cmd := exec.CommandContext(ctx, "docker", args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, errors.New(strings.TrimSpace(string(output)))
	}
	return output, nil
}
