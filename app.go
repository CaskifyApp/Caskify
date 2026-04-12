package main

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"caskpg/internal/config"
	"caskpg/internal/db"
	"caskpg/internal/history"
	"caskpg/internal/keyring"
	"caskpg/internal/profiles"
	"caskpg/internal/queries"
	"github.com/jackc/pgx/v5/pgxpool"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
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

func (a *App) withProfileDatabasePool(profileID, databaseName string, callback func(pool *pgxpool.Pool) error) error {
	profile, err := profiles.GetByID(profileID)
	if err != nil {
		return err
	}

	password, err := keyring.GetPassword("caskpg", profileID)
	if err != nil {
		return fmt.Errorf("stored password is missing; edit the connection and save the password again: %w", err)
	}

	activeDatabase := databaseName
	if activeDatabase == "" {
		activeDatabase = profile.ActiveDatabase()
	}

	if activeDatabase == profile.ActiveDatabase() {
		if pool := db.GetManager().GetPool(profileID); pool != nil {
			return callback(pool)
		}
	}

	pool, err := db.OpenPool(profile.BuildConnectionStringForDatabase(password, activeDatabase))
	if err != nil {
		return err
	}
	defer pool.Close()

	return callback(pool)
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
	var databases []db.DatabaseInfo
	err := a.withProfileDatabasePool(profileID, "", func(pool *pgxpool.Pool) error {
		var nextErr error
		databases, nextErr = db.FetchDatabases(a.ctx, pool, profileID)
		return nextErr
	})
	return databases, err
}

func (a *App) GetSchemas(profileID, databaseName string) ([]db.SchemaInfo, error) {
	var schemas []db.SchemaInfo
	err := a.withProfileDatabasePool(profileID, databaseName, func(pool *pgxpool.Pool) error {
		var nextErr error
		schemas, nextErr = db.FetchSchemas(a.ctx, pool, profileID, databaseName)
		return nextErr
	})
	return schemas, err
}

func (a *App) GetTables(profileID, databaseName, schemaName string) ([]db.TableInfo, error) {
	var tables []db.TableInfo
	err := a.withProfileDatabasePool(profileID, databaseName, func(pool *pgxpool.Pool) error {
		var nextErr error
		tables, nextErr = db.FetchTables(a.ctx, pool, profileID, databaseName, schemaName)
		return nextErr
	})
	return tables, err
}

func (a *App) GetTableColumns(profileID, databaseName, schemaName, tableName string) ([]db.ColumnDef, error) {
	var columns []db.ColumnDef
	err := a.withProfileDatabasePool(profileID, databaseName, func(pool *pgxpool.Pool) error {
		var nextErr error
		columns, nextErr = db.FetchColumns(a.ctx, pool, schemaName, tableName)
		return nextErr
	})
	return columns, err
}

func (a *App) GetTableIndexes(profileID, databaseName, schemaName, tableName string) ([]db.TableIndexInfo, error) {
	var indexes []db.TableIndexInfo
	err := a.withProfileDatabasePool(profileID, databaseName, func(pool *pgxpool.Pool) error {
		var nextErr error
		indexes, nextErr = db.FetchIndexes(a.ctx, pool, schemaName, tableName)
		return nextErr
	})
	return indexes, err
}

func (a *App) GetTableForeignKeys(profileID, databaseName, schemaName, tableName string) ([]db.ForeignKeyInfo, error) {
	var foreignKeys []db.ForeignKeyInfo
	err := a.withProfileDatabasePool(profileID, databaseName, func(pool *pgxpool.Pool) error {
		var nextErr error
		foreignKeys, nextErr = db.FetchForeignKeys(a.ctx, pool, schemaName, tableName)
		return nextErr
	})
	return foreignKeys, err
}

func (a *App) GetTablePage(params db.TablePageParams) (*db.TablePageResult, error) {
	var result *db.TablePageResult
	err := a.withProfileDatabasePool(params.ProfileID, params.Database, func(pool *pgxpool.Pool) error {
		var nextErr error
		result, nextErr = db.FetchTablePage(a.ctx, pool, params)
		return nextErr
	})
	return result, err
}

func (a *App) InsertTableRow(params db.InsertRowParams) error {
	return a.withProfileDatabasePool(params.ProfileID, params.Database, func(pool *pgxpool.Pool) error {
		return db.InsertRow(a.ctx, pool, params)
	})
}

func (a *App) UpdateTableRow(params db.UpdateRowParams) error {
	return a.withProfileDatabasePool(params.ProfileID, params.Database, func(pool *pgxpool.Pool) error {
		return db.UpdateRow(a.ctx, pool, params)
	})
}

func (a *App) DeleteTableRow(params db.DeleteRowParams) error {
	return a.withProfileDatabasePool(params.ProfileID, params.Database, func(pool *pgxpool.Pool) error {
		return db.DeleteRow(a.ctx, pool, params)
	})
}

func (a *App) RunQuery(params db.QueryExecutionParams) (*db.QueryResult, error) {
	var queryResult *db.QueryResult
	err := a.withProfileDatabasePool(params.ProfileID, params.Database, func(pool *pgxpool.Pool) error {
		var nextErr error
		queryResult, nextErr = db.ExecuteQuery(a.ctx, pool, params.SQL)
		return nextErr
	})
	if err != nil {
		return nil, err
	}

	databaseName := params.Database
	if databaseName == "" {
		if profile, profileErr := profiles.GetByID(params.ProfileID); profileErr == nil {
			databaseName = profile.ActiveDatabase()
		}
	}
	if databaseName != "" {
		_ = history.Add(history.HistoryEntry{
			Query:    params.SQL,
			Database: databaseName,
			ExecTime: queryResult.ExecutionTimeMs,
		})
	}

	return queryResult, nil
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

func (a *App) GetSettings() (config.Settings, error) {
	return config.GetSettings()
}

func (a *App) SaveSettings(settings config.Settings) error {
	return config.SaveSettings(settings)
}

func (a *App) ExportQueryResults(format string, result db.QueryResult) error {
	if len(result.Rows) == 0 && len(result.Columns) == 0 {
		return fmt.Errorf("there is no query result to export")
	}

	defaultExtension := ".csv"
	if format == "json" {
		defaultExtension = ".json"
	}

	defaultFilename := filepath.Join(config.GetDataDir(), "query-results"+defaultExtension)
	selectedPath, err := wailsruntime.SaveFileDialog(a.ctx, wailsruntime.SaveDialogOptions{
		DefaultFilename: defaultFilename,
		Title:           "Export Query Results",
	})
	if err != nil {
		return err
	}
	if selectedPath == "" {
		return nil
	}

	if err := os.MkdirAll(filepath.Dir(selectedPath), 0o755); err != nil {
		return err
	}

	if format == "json" {
		data, err := json.MarshalIndent(result.Rows, "", "  ")
		if err != nil {
			return err
		}
		return os.WriteFile(selectedPath, data, 0o644)
	}

	file, err := os.Create(selectedPath)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	if err := writer.Write(result.Columns); err != nil {
		return err
	}
	for _, row := range result.Rows {
		record := make([]string, len(result.Columns))
		for index, column := range result.Columns {
			record[index] = fmt.Sprint(row[column])
		}
		if err := writer.Write(record); err != nil {
			return err
		}
	}
	writer.Flush()
	return writer.Error()
}

func (a *App) ExportDatabaseSQL(params db.DatabaseBackupParams) (*db.DatabaseOperationResult, error) {
	if _, err := exec.LookPath("pg_dump"); err != nil {
		return nil, fmt.Errorf("pg_dump is not available on this system")
	}

	profile, err := profiles.GetByID(params.ProfileID)
	if err != nil {
		return nil, err
	}

	password, err := keyring.GetPassword("caskpg", params.ProfileID)
	if err != nil {
		return nil, fmt.Errorf("stored password is missing; edit the connection and save the password again: %w", err)
	}

	databaseName := params.Database
	if databaseName == "" {
		databaseName = profile.ActiveDatabase()
	}

	selectedPath, err := wailsruntime.SaveFileDialog(a.ctx, wailsruntime.SaveDialogOptions{
		DefaultFilename: filepath.Join(config.GetDataDir(), databaseName+".sql"),
		Title:           "Export Database SQL",
		Filters: []wailsruntime.FileFilter{{
			DisplayName: "SQL File",
			Pattern:     "*.sql",
		}},
	})
	if err != nil {
		return nil, err
	}
	if selectedPath == "" {
		return nil, nil
	}

	if err := os.MkdirAll(filepath.Dir(selectedPath), 0o755); err != nil {
		return nil, err
	}

	if err := db.ExportDatabaseSQL(a.ctx, *profile, password, databaseName, selectedPath); err != nil {
		return nil, err
	}

	return &db.DatabaseOperationResult{
		Path:    selectedPath,
		Message: "Database export completed successfully.",
	}, nil
}

func (a *App) ImportDatabaseSQL(params db.DatabaseRestoreParams) (*db.DatabaseOperationResult, error) {
	if _, err := exec.LookPath("psql"); err != nil {
		return nil, fmt.Errorf("psql is not available on this system")
	}

	profile, err := profiles.GetByID(params.ProfileID)
	if err != nil {
		return nil, err
	}

	password, err := keyring.GetPassword("caskpg", params.ProfileID)
	if err != nil {
		return nil, fmt.Errorf("stored password is missing; edit the connection and save the password again: %w", err)
	}

	databaseName := params.Database
	if databaseName == "" {
		databaseName = profile.ActiveDatabase()
	}

	selectedPath, err := wailsruntime.OpenFileDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Import Database SQL",
		Filters: []wailsruntime.FileFilter{{
			DisplayName: "SQL File",
			Pattern:     "*.sql",
		}},
	})
	if err != nil {
		return nil, err
	}
	if selectedPath == "" {
		return nil, nil
	}
	if filepath.Ext(strings.ToLower(selectedPath)) != ".sql" {
		return nil, fmt.Errorf("only .sql files are supported")
	}
	if _, err := os.Stat(selectedPath); err != nil {
		return nil, err
	}

	choice, err := wailsruntime.MessageDialog(a.ctx, wailsruntime.MessageDialogOptions{
		Type:          wailsruntime.QuestionDialog,
		Title:         "Confirm Database Restore",
		Message:       fmt.Sprintf("This will restore SQL into database '%s'. Continue?", databaseName),
		Buttons:       []string{"No", "Yes"},
		DefaultButton: "No",
		CancelButton:  "No",
	})
	if err != nil {
		return nil, err
	}
	if choice == "" || strings.EqualFold(choice, "no") || strings.EqualFold(choice, "cancel") {
		return nil, nil
	}

	if err := db.ImportDatabaseSQL(a.ctx, *profile, password, databaseName, selectedPath); err != nil {
		return nil, err
	}

	return &db.DatabaseOperationResult{
		Path:    selectedPath,
		Message: "Database restore completed successfully.",
	}, nil
}

func (a *App) CheckDatabaseTools() (map[string]bool, error) {
	return map[string]bool{
		"pg_dump": commandExists("pg_dump"),
		"psql":    commandExists("psql"),
	}, nil
}

func commandExists(name string) bool {
	_, err := exec.LookPath(name)
	return err == nil
}

func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
