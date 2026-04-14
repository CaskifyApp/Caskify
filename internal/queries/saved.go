package queries

import (
	"encoding/json"
	"os"
	"path/filepath"

	"caskify/internal/config"
	"github.com/google/uuid"
)

type SavedQuery struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Query    string `json:"query"`
	FolderID string `json:"folderId"`
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

	for index, existingQuery := range sq.Queries {
		if existingQuery.ID == query.ID {
			sq.Queries[index] = query
			return writeAll(sq)
		}
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

func SaveFolder(folder Folder) error {
	if folder.ID == "" {
		folder.ID = uuid.New().String()
	}

	sq, err := GetAll()
	if err != nil {
		return err
	}

	for index, existingFolder := range sq.Folders {
		if existingFolder.ID == folder.ID {
			sq.Folders[index] = folder
			return writeAll(sq)
		}
	}

	sq.Folders = append(sq.Folders, folder)
	return writeAll(sq)
}

func DeleteFolder(id string) error {
	sq, err := GetAll()
	if err != nil {
		return err
	}

	filteredFolders := make([]Folder, 0, len(sq.Folders))
	for _, folder := range sq.Folders {
		if folder.ID != id {
			filteredFolders = append(filteredFolders, folder)
		}
	}

	for index, savedQuery := range sq.Queries {
		if savedQuery.FolderID == id {
			sq.Queries[index].FolderID = ""
		}
	}

	sq.Folders = filteredFolders
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
