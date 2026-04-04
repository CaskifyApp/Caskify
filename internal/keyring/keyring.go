package keyring

import (
	"fmt"

	"github.com/99designs/keyring"
)

var ring keyring.Keyring

func Init() error {
	ring, err := keyring.New("caskpg", keyring.Config{
		ServiceName: "caskpg",
	})
	return err
}

func SavePassword(service, username, password string) error {
	if ring == nil {
		return fmt.Errorf("keyring not initialized")
	}
	return ring.Set(keyring.Item{
		Key:      service + ":" + username,
		Password: password,
	})
}

func GetPassword(service, username string) (string, error) {
	if ring == nil {
		return "", fmt.Errorf("keyring not initialized")
	}
	item, err := ring.Get(service + ":" + username)
	if err != nil {
		return "", err
	}
	return item.Password, nil
}

func DeletePassword(service, username string) error {
	if ring == nil {
		return fmt.Errorf("keyring not initialized")
	}
	return ring.Remove(service + ":" + username)
}
