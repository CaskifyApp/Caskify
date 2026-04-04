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

func GetCacheDir() string {
	home := os.Getenv("HOME")
	return filepath.Join(home, ".cache", "caskpg")
}
