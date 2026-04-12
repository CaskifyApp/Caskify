package config

import (
	"os"
	"path/filepath"
)

func GetConfigDir() string {
	home := os.Getenv("HOME")
	return filepath.Join(home, ".config", "caskpg")
}

func GetDataDir() string {
	home := os.Getenv("HOME")
	return filepath.Join(home, ".local", "share", "caskpg")
}

func GetDownloadsDir() string {
	home := os.Getenv("HOME")
	if home == "" {
		return GetDataDir()
	}

	downloadsDir := filepath.Join(home, "Downloads")
	if _, err := os.Stat(downloadsDir); err == nil {
		return downloadsDir
	}

	return home
}

func GetCacheDir() string {
	home := os.Getenv("HOME")
	return filepath.Join(home, ".cache", "caskpg")
}
