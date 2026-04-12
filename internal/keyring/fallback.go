package keyring

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"caskpg/internal/config"
)

var useFallback bool

func initFallback() error {
	if useFallback {
		return nil
	}

	keyPath := filepath.Join(config.GetConfigDir(), ".key")
	if _, err := os.Stat(keyPath); os.IsNotExist(err) {
		key := make([]byte, 32)
		if _, err := io.ReadFull(rand.Reader, key); err != nil {
			return fmt.Errorf("failed to generate encryption key: %w", err)
		}
		if err := os.MkdirAll(config.GetConfigDir(), 0o700); err != nil {
			return err
		}
		if err := os.WriteFile(keyPath, key, 0o600); err != nil {
			return err
		}
	}

	useFallback = true
	return nil
}

func getMachineKey() ([]byte, error) {
	keyPath := filepath.Join(config.GetConfigDir(), ".key")
	data, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, err
	}
	if len(data) != 32 {
		hash := sha256.Sum256(data)
		return hash[:], nil
	}
	return data, nil
}

func encrypt(plaintext string) (string, error) {
	key, err := getMachineKey()
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func decrypt(ciphertext string) (string, error) {
	key, err := getMachineKey()
	if err != nil {
		return "", err
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertextBytes := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertextBytes, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

func saveFallback(service, username, password string) error {
	if err := initFallback(); err != nil {
		return err
	}

	key := service + ":" + username
	encrypted, err := encrypt(password)
	if err != nil {
		return err
	}

	entries, err := loadFallbackEntries()
	if err != nil {
		entries = make(map[string]string)
	}

	entries[key] = encrypted
	return saveFallbackEntries(entries)
}

func getFallback(service, username string) (string, error) {
	if !useFallback {
		return "", fmt.Errorf("fallback keyring not initialized")
	}

	key := service + ":" + username
	entries, err := loadFallbackEntries()
	if err != nil {
		return "", err
	}

	encrypted, exists := entries[key]
	if !exists {
		return "", fmt.Errorf("password not found")
	}

	return decrypt(encrypted)
}

func deleteFallback(service, username string) error {
	if !useFallback {
		return fmt.Errorf("fallback keyring not initialized")
	}

	key := service + ":" + username
	entries, err := loadFallbackEntries()
	if err != nil {
		return err
	}

	delete(entries, key)
	return saveFallbackEntries(entries)
}

func loadFallbackEntries() (map[string]string, error) {
	path := filepath.Join(config.GetConfigDir(), "fallback_keyring")
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return make(map[string]string), nil
		}
		return nil, err
	}

	entries := make(map[string]string)
	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			entries[parts[0]] = parts[1]
		}
	}

	return entries, nil
}

func saveFallbackEntries(entries map[string]string) error {
	path := config.GetConfigDir()
	if err := os.MkdirAll(path, 0o700); err != nil {
		return err
	}

	var lines []string
	for key, value := range entries {
		lines = append(lines, key+"="+value)
	}

	content := strings.Join(lines, "\n")
	return os.WriteFile(filepath.Join(path, "fallback_keyring"), []byte(content), 0o600)
}
