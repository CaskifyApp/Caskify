package db

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	maxIdleTime     = 5 * time.Minute
	cleanupInterval = 1 * time.Minute
)

type ConnectionPool struct {
	profileID string
	database  string
	pool      *pgxpool.Pool
	lastUsed  time.Time
}

type ConnectionManager struct {
	mu    sync.RWMutex
	pools map[string]*ConnectionPool
}

var cm *ConnectionManager

func GetManager() *ConnectionManager {
	if cm == nil {
		cm = &ConnectionManager{pools: make(map[string]*ConnectionPool)}
		go cm.cleanupRoutine()
	}
	return cm
}

func (m *ConnectionManager) cleanupRoutine() {
	ticker := time.NewTicker(cleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		m.cleanupIdleConnections()
	}
}

func (m *ConnectionManager) cleanupIdleConnections() {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	for id, cp := range m.pools {
		if now.Sub(cp.lastUsed) > maxIdleTime {
			cp.pool.Close()
			delete(m.pools, id)
		}
	}
}

func poolKey(profileID, databaseName string) string {
	return fmt.Sprintf("%s:%s", profileID, databaseName)
}

func (m *ConnectionManager) Connect(profileID, databaseName, connString string) error {
	key := poolKey(profileID, databaseName)
	m.mu.RLock()
	if _, exists := m.pools[key]; exists {
		m.mu.RUnlock()
		return nil
	}
	m.mu.RUnlock()

	pool, err := OpenPool(connString)
	if err != nil {
		return err
	}

	m.mu.Lock()
	m.pools[key] = &ConnectionPool{
		profileID: profileID,
		database:  databaseName,
		pool:      pool,
		lastUsed:  time.Now(),
	}
	m.mu.Unlock()
	return nil
}

func (m *ConnectionManager) Disconnect(profileID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	for key, cp := range m.pools {
		if cp.profileID != profileID {
			continue
		}
		cp.pool.Close()
		delete(m.pools, key)
	}
}

func (m *ConnectionManager) DisconnectAll() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for id, cp := range m.pools {
		cp.pool.Close()
		delete(m.pools, id)
	}
}

func (m *ConnectionManager) GetPool(profileID, databaseName string) *pgxpool.Pool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	cp, exists := m.pools[poolKey(profileID, databaseName)]
	if !exists {
		return nil
	}
	return cp.pool
}

func (m *ConnectionManager) IsConnected(profileID string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, cp := range m.pools {
		if cp.profileID == profileID {
			return true
		}
	}
	return false
}

func (m *ConnectionManager) UpdateLastUsed(profileID, databaseName string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if cp, exists := m.pools[poolKey(profileID, databaseName)]; exists {
		cp.lastUsed = time.Now()
	}
}

func (m *ConnectionManager) TestConnection(connString string) error {
	pool, err := OpenPool(connString)
	if err != nil {
		return err
	}
	defer pool.Close()
	return nil
}

func OpenPool(connString string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("invalid connection string: %w", err)
	}
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("failed to create pool: %w", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		return nil, fmt.Errorf("connection failed: %w", err)
	}
	return pool, nil
}
