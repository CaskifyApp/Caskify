package queries

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"caskpg/internal/config"
	"github.com/google/uuid"
)

type SavedQuery struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Query    string `json:"query"`
	FolderID string `json:"folder_id"`
}

type SavedQueries struct {
	Queries []SavedQuery `json:"queries"`
	Folders []Folder     `json:"folders"`
}

type Folder struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func GetAll() (*SavedQueries, error) {
	path := filepath.Join(config.GetConfigDir(), "saved_queries.json")
	data, err := os.ReadFile(path)
	if err != nil {
		return &SavedQueries{}, nil
	}
	var sq SavedQueries
	err = json.Unmarshal(data, &sq)
	return &sq, err
}

func Save(query SavedQuery) error {
	if query.ID == "" {
		query.ID = uuid.New().String()
	}
	sq, err := GetAll()
	if err != nil {
		return err
	}
	sq.Queries = append(sq.Queries, query)
	return writeAll(sq)
}

func Delete(id string) error {
	sq, err := GetAll()
	if err != nil {
		return err
	}
	var filtered []SavedQuery
	for _, q := range sq.Queries {
		if q.ID != id {
			filtered = append(filtered, q)
		}
	}
	sq.Queries = filtered
	return writeAll(sq)
}

func writeAll(sq *SavedQueries) error {
	path := config.GetConfigDir()
	os.MkdirAll(path, 0755)
	data, err := json.MarshalIndent(sq, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(path, "saved_queries.json"), data, 0644)
}
