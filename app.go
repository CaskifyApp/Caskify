package main

import (
	"context"
	"fmt"

	"caskpg/internal/db"
	"caskpg/internal/history"
	"caskpg/internal/keyring"
	"caskpg/internal/profiles"
	"caskpg/internal/queries"
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
		return fmt.Errorf("stored password is missing; edit the connection and save the password again: %w", err)
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

	profile, err := profiles.GetByID(profileID)
	if err != nil {
		return nil, err
	}

	return []db.DatabaseInfo{{
		ConnectionID: profileID,
		Name:         profile.Database,
	}}, nil
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

func (a *App) GetTableColumns(profileID, schemaName, tableName string) ([]db.ColumnDef, error) {
	pool := db.GetManager().GetPool(profileID)
	if pool == nil {
		return nil, fmt.Errorf("profile is not connected")
	}

	columns, err := db.FetchColumns(a.ctx, pool, schemaName, tableName)
	if err != nil {
		return nil, err
	}

	return columns, nil
}

func (a *App) GetTableIndexes(profileID, schemaName, tableName string) ([]db.TableIndexInfo, error) {
	pool := db.GetManager().GetPool(profileID)
	if pool == nil {
		return nil, fmt.Errorf("profile is not connected")
	}

	indexes, err := db.FetchIndexes(a.ctx, pool, schemaName, tableName)
	if err != nil {
		return nil, err
	}

	return indexes, nil
}

func (a *App) GetTableForeignKeys(profileID, schemaName, tableName string) ([]db.ForeignKeyInfo, error) {
	pool := db.GetManager().GetPool(profileID)
	if pool == nil {
		return nil, fmt.Errorf("profile is not connected")
	}

	foreignKeys, err := db.FetchForeignKeys(a.ctx, pool, schemaName, tableName)
	if err != nil {
		return nil, err
	}

	return foreignKeys, nil
}

func (a *App) GetTablePage(params db.TablePageParams) (*db.TablePageResult, error) {
	pool := db.GetManager().GetPool(params.ProfileID)
	if pool == nil {
		return nil, fmt.Errorf("profile is not connected")
	}

	return db.FetchTablePage(a.ctx, pool, params)
}

func (a *App) InsertTableRow(params db.InsertRowParams) error {
	pool := db.GetManager().GetPool(params.ProfileID)
	if pool == nil {
		return fmt.Errorf("profile is not connected")
	}

	return db.InsertRow(a.ctx, pool, params)
}

func (a *App) UpdateTableRow(params db.UpdateRowParams) error {
	pool := db.GetManager().GetPool(params.ProfileID)
	if pool == nil {
		return fmt.Errorf("profile is not connected")
	}

	return db.UpdateRow(a.ctx, pool, params)
}

func (a *App) DeleteTableRow(params db.DeleteRowParams) error {
	pool := db.GetManager().GetPool(params.ProfileID)
	if pool == nil {
		return fmt.Errorf("profile is not connected")
	}

	return db.DeleteRow(a.ctx, pool, params)
}

func (a *App) RunQuery(params db.QueryExecutionParams) (*db.QueryResult, error) {
	pool := db.GetManager().GetPool(params.ProfileID)
	if pool == nil {
		return nil, fmt.Errorf("profile is not connected")
	}

	return db.ExecuteQuery(a.ctx, pool, params.SQL)
}

func (a *App) GetSavedQueries() (*queries.SavedQueries, error) {
	return queries.GetAll()
}

func (a *App) SaveSavedQuery(savedQuery queries.SavedQuery) error {
	return queries.Save(savedQuery)
}

func (a *App) DeleteSavedQuery(id string) error {
	return queries.Delete(id)
}

func (a *App) SaveQueryFolder(folder queries.Folder) error {
	return queries.SaveFolder(folder)
}

func (a *App) DeleteQueryFolder(id string) error {
	return queries.DeleteFolder(id)
}

func (a *App) GetQueryHistory() ([]history.HistoryEntry, error) {
	return history.GetAll()
}

func (a *App) ClearQueryHistory() error {
	return history.Clear()
}

func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
