package main

import (
	"context"
	"fmt"

	"caskpg/internal/db"
	"caskpg/internal/keyring"
	"caskpg/internal/profiles"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	keyring.Init()
}

func (a *App) GetProfiles() ([]profiles.Profile, error) {
	return profiles.GetAll()
}

func (a *App) SaveProfile(profile profiles.Profile) error {
	return profiles.Save(profile)
}

func (a *App) UpdateProfile(profile profiles.Profile) error {
	return profiles.Update(profile)
}

func (a *App) DeleteProfile(id string) error {
	keyring.DeletePassword("caskpg", id)
	return profiles.Delete(id)
}

func (a *App) TestConnection(connString string) error {
	return db.GetManager().TestConnection(connString)
}

func (a *App) ConnectProfile(profileID, connString string) error {
	return db.GetManager().Connect(profileID, connString)
}

func (a *App) DisconnectProfile(profileID string) {
	db.GetManager().Disconnect(profileID)
}

func (a *App) IsProfileConnected(profileID string) bool {
	return db.GetManager().IsConnected(profileID)
}

func (a *App) SavePassword(profileID, password string) error {
	return keyring.SavePassword("caskpg", profileID, password)
}

func (a *App) GetPassword(profileID string) (string, error) {
	return keyring.GetPassword("caskpg", profileID)
}

func (a *App) DeletePassword(profileID string) error {
	return keyring.DeletePassword("caskpg", profileID)
}

func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
