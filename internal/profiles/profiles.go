package profiles

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strconv"

	"caskpg/internal/config"
	"github.com/google/uuid"
)

type Profile struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Host            string `json:"host"`
	Port            int    `json:"port"`
	DefaultDatabase string `json:"defaultDatabase,omitempty"`
	Database        string `json:"database,omitempty"`
	Username        string `json:"username"`
	SSLMode         string `json:"ssl_mode"`
}

func GetAll() ([]Profile, error) {
	path := filepath.Join(config.GetConfigDir(), "profiles.json")
	data, err := os.ReadFile(path)
	if err != nil {
		return []Profile{}, nil
	}
	var profiles []Profile
	err = json.Unmarshal(data, &profiles)
	if profiles == nil {
		profiles = []Profile{}
	}
	for index := range profiles {
		if profiles[index].DefaultDatabase == "" {
			profiles[index].DefaultDatabase = profiles[index].Database
		}
		profiles[index].Database = ""
	}
	return profiles, err
}

func GetByID(id string) (*Profile, error) {
	profiles, err := GetAll()
	if err != nil {
		return nil, err
	}
	for _, p := range profiles {
		if p.DefaultDatabase == "" {
			p.DefaultDatabase = p.Database
		}
		if p.ID == id {
			return &p, nil
		}
	}
	return nil, fmt.Errorf("profile not found")
}

func Save(profile Profile) (Profile, error) {
	if profile.ID == "" {
		profile.ID = uuid.New().String()
	}
	if profile.DefaultDatabase == "" {
		profile.DefaultDatabase = profile.Database
	}
	profile.Database = ""
	profiles, err := GetAll()
	if err != nil {
		return Profile{}, err
	}
	profiles = append(profiles, profile)
	if err := writeAll(profiles); err != nil {
		return Profile{}, err
	}
	return profile, nil
}

func Update(profile Profile) error {
	if profile.DefaultDatabase == "" {
		profile.DefaultDatabase = profile.Database
	}
	profile.Database = ""
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

func (p *Profile) ActiveDatabase() string {
	if p.DefaultDatabase != "" {
		return p.DefaultDatabase
	}
	if p.Database != "" {
		return p.Database
	}
	return "postgres"
}

func (p *Profile) BuildConnectionString(password string) string {
	return p.BuildConnectionStringForDatabase(password, "")
}

func (p *Profile) BuildConnectionStringForDatabase(password, databaseName string) string {
	sslMode := p.SSLMode
	if sslMode == "" {
		sslMode = "disable"
	}
	if databaseName == "" {
		databaseName = p.ActiveDatabase()
	}

	connURL := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(p.Username, password),
		Host:   fmt.Sprintf("%s:%d", p.Host, p.Port),
		Path:   "/" + url.PathEscape(databaseName),
	}
	query := connURL.Query()
	query.Set("sslmode", sslMode)
	query.Set("connect_timeout", strconv.Itoa(10))
	connURL.RawQuery = query.Encode()
	return connURL.String()
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
	if p.Username == "" {
		return fmt.Errorf("username is required")
	}
	return nil
}

func writeAll(profiles []Profile) error {
	path := config.GetConfigDir()
	if err := os.MkdirAll(path, 0o700); err != nil {
		return err
	}
	if profiles == nil {
		profiles = []Profile{}
	}
	data, err := json.MarshalIndent(profiles, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(path, "profiles.json"), data, 0o600)
}
