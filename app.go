package main

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"

	"caskify/internal/config"
	"caskify/internal/db"
	"caskify/internal/discovery"
	"caskify/internal/history"
	"caskify/internal/keyring"
	"caskify/internal/logger"
	"caskify/internal/profiles"
	"caskify/internal/queries"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

func normalizeConnectionError(err error) error {
	if err == nil {
		return nil
	}

	message := err.Error()
	lowerMessage := strings.ToLower(message)

	switch {
	case strings.Contains(lowerMessage, "password authentication failed"):
		return fmt.Errorf("authentication failed: verify the username and password")
	case strings.Contains(lowerMessage, "no pg_hba.conf entry"):
		return fmt.Errorf("connection rejected by server policy: verify host access and SSL mode")
	case strings.Contains(lowerMessage, "connection refused"):
		return fmt.Errorf("connection refused: verify the host, port, and server status")
	case strings.Contains(lowerMessage, "server does not support ssl"):
		return fmt.Errorf("server rejected SSL: try disabling SSL mode for this server")
	case strings.Contains(lowerMessage, "tls") || strings.Contains(lowerMessage, "ssl"):
		return fmt.Errorf("SSL negotiation failed: verify the selected SSL mode and server certificate requirements")
	case strings.Contains(lowerMessage, "timeout"):
		return fmt.Errorf("connection timed out: verify the host, port, and network reachability")
	default:
		return errors.New(logger.RedactConnectionString(message))
	}
}

type App struct {
	ctx              context.Context
	runningQueries   map[string]context.CancelFunc
	runningQueriesMu sync.RWMutex
}

func NewApp() *App {
	return &App{
		runningQueries: make(map[string]context.CancelFunc),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	keyring.Init()
}

func (a *App) emitDiscoveryEvent(name string, payload any) {
	if a.ctx == nil {
		return
	}
	wailsruntime.EventsEmit(a.ctx, name, payload)
}

func (a *App) emitDiscoveryError(source string, err error) {
	if err == nil {
		return
	}

	a.emitDiscoveryEvent("discovery:error", map[string]string{
		"source":  source,
		"message": normalizeConnectionError(err).Error(),
	})
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
		if pool := db.GetManager().GetPool(profileID, activeDatabase); pool != nil {
			db.GetManager().UpdateLastUsed(profileID, activeDatabase)
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

func (a *App) RefreshCloudProfiles() ([]profiles.Profile, error) {
	allProfiles, err := profiles.GetAll()
	if err != nil {
		a.emitDiscoveryError("cloud", err)
		return nil, err
	}

	a.emitDiscoveryEvent("discovery:cloud.updated", allProfiles)
	return allProfiles, nil
}

func (a *App) DiscoverLocalDatabases() ([]discovery.LocalDatabaseInfo, error) {
	return discovery.DiscoverLocalDatabases(a.ctx)
}

func (a *App) RefreshLocalDiscovery() ([]discovery.LocalDatabaseInfo, error) {
	localDatabases, err := discovery.DiscoverLocalDatabases(a.ctx)
	if err != nil {
		a.emitDiscoveryError("local", err)
		return nil, err
	}

	a.emitDiscoveryEvent("discovery:local.updated", localDatabases)
	return localDatabases, nil
}

func (a *App) DiscoverDockerDatabases() ([]discovery.DockerDatabaseInfo, error) {
	return discovery.DiscoverDockerDatabases(a.ctx)
}

func (a *App) RefreshDockerDiscovery() ([]discovery.DockerDatabaseInfo, error) {
	dockerDatabases, err := discovery.DiscoverDockerDatabases(a.ctx)
	if err != nil {
		a.emitDiscoveryError("docker", err)
		return nil, err
	}

	a.emitDiscoveryEvent("discovery:docker.updated", dockerDatabases)
	return dockerDatabases, nil
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
	return normalizeConnectionError(db.GetManager().TestConnection(connString))
}

func (a *App) TestProfileConnection(params db.ConnectionTestParams) (*db.ConnectionTestResult, error) {
	if err := params.Profile.Validate(); err != nil {
		return nil, err
	}

	connString := params.Profile.BuildConnectionString(params.Password)
	if err := db.GetManager().TestConnection(connString); err != nil {
		return nil, normalizeConnectionError(err)
	}

	return &db.ConnectionTestResult{
		Healthy: true,
		SSLMode: params.Profile.ResolvedSSLMode(),
		Message: fmt.Sprintf("Connection successful using %s SSL mode.", params.Profile.ResolvedSSLMode()),
	}, nil
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
	return normalizeConnectionError(db.GetManager().Connect(profileID, profile.ActiveDatabase(), connString))
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

func (a *App) RunQueryWithCancellation(params db.QueryExecutionParams, queryID string) (*db.QueryResult, error) {
	if queryID == "" {
		queryID = uuid.New().String()
	}

	ctx, cancel := context.WithCancel(a.ctx)
	a.runningQueriesMu.Lock()
	a.runningQueries[queryID] = cancel
	a.runningQueriesMu.Unlock()

	defer func() {
		a.runningQueriesMu.Lock()
		delete(a.runningQueries, queryID)
		a.runningQueriesMu.Unlock()
	}()

	var queryResult *db.QueryResult
	err := a.withProfileDatabasePool(params.ProfileID, params.Database, func(pool *pgxpool.Pool) error {
		var nextErr error
		queryResult, nextErr = db.ExecuteQuery(ctx, pool, params.SQL)
		return nextErr
	})

	if err != nil {
		if ctx.Err() == context.Canceled {
			return nil, fmt.Errorf("query was cancelled")
		}
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

func (a *App) CancelQuery(queryID string) bool {
	a.runningQueriesMu.RLock()
	cancel, exists := a.runningQueries[queryID]
	a.runningQueriesMu.RUnlock()

	if exists {
		cancel()
		return true
	}
	return false
}

func (a *App) CheckDangerousQuery(sql string) map[string]interface{} {
	isDangerous, command := db.IsDangerousQuery(sql)
	return map[string]interface{}{
		"isDangerous": isDangerous,
		"command":     command,
	}
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

func (a *App) ExportQueryResults(format string, result db.QueryResult) (*db.DatabaseOperationResult, error) {
	if len(result.Rows) == 0 && len(result.Columns) == 0 {
		return nil, fmt.Errorf("there is no query result to export")
	}

	defaultExtension := ".csv"
	if format == "json" {
		defaultExtension = ".json"
	}

	defaultDirectory := config.GetDownloadsDir()
	defaultFilename := "query-results" + defaultExtension
	selectedPath, err := wailsruntime.SaveFileDialog(a.ctx, wailsruntime.SaveDialogOptions{
		DefaultDirectory: defaultDirectory,
		DefaultFilename:  defaultFilename,
		Title:            "Export Query Results",
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

	if format == "json" {
		data, err := json.MarshalIndent(result.Rows, "", "  ")
		if err != nil {
			return nil, err
		}
		if err := os.WriteFile(selectedPath, data, 0o644); err != nil {
			return nil, err
		}
		return &db.DatabaseOperationResult{Path: selectedPath, Message: "Query results exported successfully.", Status: "success"}, nil
	}

	file, err := os.Create(selectedPath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	if err := writer.Write(result.Columns); err != nil {
		return nil, err
	}
	for _, row := range result.Rows {
		record := make([]string, len(result.Columns))
		for index, column := range result.Columns {
			record[index] = formatCellForCSV(row[column])
		}
		if err := writer.Write(record); err != nil {
			return nil, err
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, err
	}

	return &db.DatabaseOperationResult{Path: selectedPath, Message: "Query results exported successfully.", Status: "success"}, nil
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
		DefaultDirectory: config.GetDownloadsDir(),
		DefaultFilename:  databaseName + ".sql",
		Title:            "Export Database SQL",
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

func (a *App) CheckDatabaseRestoreTarget(params db.DatabaseRestoreParams) (*db.DatabaseRestorePreflightResult, error) {
	profile, err := profiles.GetByID(params.ProfileID)
	if err != nil {
		return nil, err
	}

	databaseName := params.Database
	if databaseName == "" {
		databaseName = profile.ActiveDatabase()
	}

	var result *db.DatabaseRestorePreflightResult
	err = a.withProfileDatabasePool(params.ProfileID, databaseName, func(pool *pgxpool.Pool) error {
		var nextErr error
		result, nextErr = db.CheckRestoreTarget(a.ctx, pool, databaseName)
		return nextErr
	})
	return result, err
}

func (a *App) CreateEmptyDatabase(params db.CreateDatabaseParams) error {
	profile, err := profiles.GetByID(params.ProfileID)
	if err != nil {
		return err
	}

	password, err := keyring.GetPassword("caskpg", params.ProfileID)
	if err != nil {
		return fmt.Errorf("stored password is missing; edit the connection and save the password again: %w", err)
	}

	pool, err := db.OpenPool(profile.BuildConnectionStringForDatabase(password, "postgres"))
	if err != nil {
		return err
	}
	defer pool.Close()

	return db.CreateDatabase(a.ctx, pool, params.Name)
}

func (a *App) DropDatabase(params db.DropDatabaseParams) error {
	profile, err := profiles.GetByID(params.ProfileID)
	if err != nil {
		return err
	}

	password, err := keyring.GetPassword("caskpg", params.ProfileID)
	if err != nil {
		return fmt.Errorf("stored password is missing; edit the connection and save the password again: %w", err)
	}

	pool, err := db.OpenPool(profile.BuildConnectionStringForDatabase(password, "postgres"))
	if err != nil {
		return err
	}
	defer pool.Close()

	return db.DropDatabase(a.ctx, pool, params.Name)
}

func (a *App) CreateSchema(params db.CreateSchemaParams) error {
	return a.withProfileDatabasePool(params.ProfileID, params.Database, func(pool *pgxpool.Pool) error {
		return db.CreateSchema(a.ctx, pool, params.Name)
	})
}

func (a *App) DropSchema(params db.DropSchemaParams) error {
	return a.withProfileDatabasePool(params.ProfileID, params.Database, func(pool *pgxpool.Pool) error {
		return db.DropSchema(a.ctx, pool, params.Name)
	})
}

func (a *App) CreateTable(params db.CreateTableParams) error {
	return a.withProfileDatabasePool(params.ProfileID, params.Database, func(pool *pgxpool.Pool) error {
		return db.CreateTable(a.ctx, pool, params.Schema, params.Name, params.Columns)
	})
}

func (a *App) RenameTable(params db.RenameTableParams) error {
	return a.withProfileDatabasePool(params.ProfileID, params.Database, func(pool *pgxpool.Pool) error {
		return db.RenameTable(a.ctx, pool, params.Schema, params.OldName, params.NewName)
	})
}

func (a *App) DropTable(params db.DropTableParams) error {
	return a.withProfileDatabasePool(params.ProfileID, params.Database, func(pool *pgxpool.Pool) error {
		return db.DropTable(a.ctx, pool, params.Schema, params.Name)
	})
}

func (a *App) AddColumn(params db.AddColumnParams) error {
	return a.withProfileDatabasePool(params.ProfileID, params.Database, func(pool *pgxpool.Pool) error {
		return db.AddColumn(a.ctx, pool, params.Schema, params.Table, params)
	})
}

func (a *App) RenameColumn(params db.RenameColumnParams) error {
	return a.withProfileDatabasePool(params.ProfileID, params.Database, func(pool *pgxpool.Pool) error {
		return db.RenameColumn(a.ctx, pool, params.Schema, params.Table, params.OldName, params.NewName)
	})
}

func (a *App) DropColumn(params db.DropColumnParams) error {
	return a.withProfileDatabasePool(params.ProfileID, params.Database, func(pool *pgxpool.Pool) error {
		return db.DropColumn(a.ctx, pool, params.Schema, params.Table, params.Name)
	})
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

	result, err := db.ImportDatabaseSQL(a.ctx, *profile, password, databaseName, selectedPath)
	if err != nil {
		return nil, err
	}

	return result, nil
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

func formatCellForCSV(value any) string {
	if value == nil {
		return ""
	}
	return fmt.Sprint(value)
}

func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
