package history

import (
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	"caskpg/internal/config"
	"github.com/google/uuid"
)

type HistoryEntry struct {
	ID        string `json:"id"`
	Query     string `json:"query"`
	Database  string `json:"database"`
	Timestamp string `json:"timestamp"`
	ExecTime  int64  `json:"exec_time_ms"`
}

func Add(entry HistoryEntry) error {
	if entry.ID == "" {
		entry.ID = uuid.New().String()
	}
	if entry.Timestamp == "" {
		entry.Timestamp = time.Now().UTC().Format(time.RFC3339)
	}

	entries, err := GetAll()
	if err != nil {
		return err
	}

	settings, _ := config.GetSettings()
	limit := settings.HistoryLimit
	if limit == 0 {
		limit = 100
	}

	entries = append([]HistoryEntry{entry}, entries...)
	if len(entries) > limit {
		entries = entries[:limit]
	}
	return writeAll(entries)
}

func GetAll() ([]HistoryEntry, error) {
	path := filepath.Join(config.GetConfigDir(), "history.json")
	data, err := os.ReadFile(path)
	if err != nil {
		return []HistoryEntry{}, nil
	}
	var entries []HistoryEntry
	err = json.Unmarshal(data, &entries)
	return entries, err
}

func Clear() error {
	path := config.GetConfigDir()
	if err := os.MkdirAll(path, 0o700); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(path, "history.json"), []byte("[]"), 0o600)
}

func writeAll(entries []HistoryEntry) error {
	path := config.GetConfigDir()
	if err := os.MkdirAll(path, 0o700); err != nil {
		return err
	}
	data, err := json.MarshalIndent(entries, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(path, "history.json"), data, 0o600)
}
