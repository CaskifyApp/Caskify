package keyring

import (
	"fmt"

	"github.com/99designs/keyring"
)

var ring keyring.Keyring
var useLibsecret = true

func Init() error {
	var err error
	ring, err = keyring.Open(keyring.Config{
		ServiceName: "caskpg",
	})
	if err != nil {
		useLibsecret = false
		return initFallback()
	}
	return nil
}

func SavePassword(service, username, password string) error {
	if !useLibsecret {
		return saveFallback(service, username, password)
	}
	if ring == nil {
		return fmt.Errorf("keyring not initialized")
	}
	return ring.Set(keyring.Item{
		Key:         service + ":" + username,
		Data:        []byte(password),
		Description: "CaskPG connection password",
	})
}

func GetPassword(service, username string) (string, error) {
	if !useLibsecret {
		return getFallback(service, username)
	}
	if ring == nil {
		return "", fmt.Errorf("keyring not initialized")
	}
	item, err := ring.Get(service + ":" + username)
	if err != nil {
		return "", err
	}
	return string(item.Data), nil
}

func DeletePassword(service, username string) error {
	if !useLibsecret {
		return deleteFallback(service, username)
	}
	if ring == nil {
		return fmt.Errorf("keyring not initialized")
	}
	return ring.Remove(service + ":" + username)
}
