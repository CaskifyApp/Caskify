package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Settings struct {
	Theme              string `json:"theme"`
	DefaultRowsPerPage int    `json:"defaultRowsPerPage"`
}

func settingsPath() string {
	return filepath.Join(GetConfigDir(), "settings.json")
}

func GetSettings() (Settings, error) {
	defaults := Settings{
		Theme:              "dark",
		DefaultRowsPerPage: 50,
	}

	data, err := os.ReadFile(settingsPath())
	if err != nil {
		return defaults, nil
	}

	var settings Settings
	if err := json.Unmarshal(data, &settings); err != nil {
		return defaults, err
	}

	if settings.Theme == "" {
		settings.Theme = defaults.Theme
	}
	if settings.DefaultRowsPerPage == 0 {
		settings.DefaultRowsPerPage = defaults.DefaultRowsPerPage
	}

	return settings, nil
}

func SaveSettings(settings Settings) error {
	if err := os.MkdirAll(GetConfigDir(), 0o755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(settingsPath(), data, 0o644)
}
