package profiles

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"caskpg/internal/config"
	"github.com/google/uuid"
)

type Profile struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Database string `json:"database"`
	Username string `json:"username"`
	SSLMode  string `json:"ssl_mode"`
}

func GetAll() ([]Profile, error) {
	path := filepath.Join(config.GetConfigDir(), "profiles.json")
	data, err := os.ReadFile(path)
	if err != nil {
		return []Profile{}, nil
	}
	var profiles []Profile
	err = json.Unmarshal(data, &profiles)
	return profiles, err
}

func GetByID(id string) (*Profile, error) {
	profiles, err := GetAll()
	if err != nil {
		return nil, err
	}
	for _, p := range profiles {
		if p.ID == id {
			return &p, nil
		}
	}
	return nil, fmt.Errorf("profile not found")
}

func Save(profile Profile) error {
	if profile.ID == "" {
		profile.ID = uuid.New().String()
	}
	profiles, err := GetAll()
	if err != nil {
		return err
	}
	profiles = append(profiles, profile)
	return writeAll(profiles)
}

func Update(profile Profile) error {
	profiles, err := GetAll()
	if err != nil {
		return err
	}
	for i, p := range profiles {
		if p.ID == profile.ID {
			profiles[i] = profile
			return writeAll(profiles)
		}
	}
	return fmt.Errorf("profile not found")
}

func Delete(id string) error {
	profiles, err := GetAll()
	if err != nil {
		return err
	}
	var filtered []Profile
	for _, p := range profiles {
		if p.ID != id {
			filtered = append(filtered, p)
		}
	}
	return writeAll(filtered)
}

func (p *Profile) BuildConnectionString(password string) string {
	sslMode := p.SSLMode
	if sslMode == "" {
		sslMode = "disable"
	}
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		p.Username,
		password,
		p.Host,
		p.Port,
		p.Database,
		sslMode,
	)
}

func (p *Profile) Validate() error {
	if p.Name == "" {
		return fmt.Errorf("profile name is required")
	}
	if p.Host == "" {
		return fmt.Errorf("host is required")
	}
	if p.Port <= 0 || p.Port > 65535 {
		return fmt.Errorf("invalid port number")
	}
	if p.Database == "" {
		return fmt.Errorf("database name is required")
	}
	if p.Username == "" {
		return fmt.Errorf("username is required")
	}
	return nil
}

func writeAll(profiles []Profile) error {
	path := config.GetConfigDir()
	os.MkdirAll(path, 0755)
	data, err := json.MarshalIndent(profiles, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(path, "profiles.json"), data, 0644)
}
