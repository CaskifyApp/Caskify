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

func (a *App) GetProfile(id string) (*profiles.Profile, error) {
	return profiles.GetByID(id)
}

func (a *App) SaveProfile(profile profiles.Profile) (profiles.Profile, error) {
	if err := profile.Validate(); err != nil {
		return profiles.Profile{}, err
	}
	return profiles.Save(profile)
}

func (a *App) UpdateProfile(profile profiles.Profile) error {
	if err := profile.Validate(); err != nil {
		return err
	}
	return profiles.Update(profile)
}

func (a *App) DeleteProfile(id string) error {
	keyring.DeletePassword("caskpg", id)
	return profiles.Delete(id)
}

func (a *App) TestConnection(connString string) error {
	return db.GetManager().TestConnection(connString)
}

func (a *App) ConnectProfile(profileID string) error {
	profile, err := profiles.GetByID(profileID)
	if err != nil {
		return err
	}
	password, err := keyring.GetPassword("caskpg", profileID)
	if err != nil {
		return fmt.Errorf("password not found in keyring: %w", err)
	}
	connString := profile.BuildConnectionString(password)
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

func (a *App) GetDatabases(profileID string) ([]db.DatabaseInfo, error) {
	pool := db.GetManager().GetPool(profileID)
	if pool == nil {
		return nil, fmt.Errorf("profile is not connected")
	}

	databases, err := db.FetchDatabases(a.ctx, pool, profileID)
	if err != nil {
		return nil, err
	}

	return databases, nil
}

func (a *App) GetSchemas(profileID, databaseName string) ([]db.SchemaInfo, error) {
	pool := db.GetManager().GetPool(profileID)
	if pool == nil {
		return nil, fmt.Errorf("profile is not connected")
	}

	schemas, err := db.FetchSchemas(a.ctx, pool, profileID, databaseName)
	if err != nil {
		return nil, err
	}

	return schemas, nil
}

func (a *App) GetTables(profileID, databaseName, schemaName string) ([]db.TableInfo, error) {
	pool := db.GetManager().GetPool(profileID)
	if pool == nil {
		return nil, fmt.Errorf("profile is not connected")
	}

	tables, err := db.FetchTables(a.ctx, pool, profileID, databaseName, schemaName)
	if err != nil {
		return nil, err
	}

	return tables, nil
}

func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
