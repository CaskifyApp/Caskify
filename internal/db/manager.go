package db

import (
	"context"
	"fmt"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ConnectionManager struct {
	mu    sync.RWMutex
	pools map[string]*pgxpool.Pool
}

var cm *ConnectionManager

func GetManager() *ConnectionManager {
	if cm == nil {
		cm = &ConnectionManager{pools: make(map[string]*pgxpool.Pool)}
	}
	return cm
}

func (m *ConnectionManager) Connect(profileID string, connString string) error {
	m.mu.RLock()
	if _, exists := m.pools[profileID]; exists {
		m.mu.RUnlock()
		return nil
	}
	m.mu.RUnlock()

	pool, err := pgxpool.New(context.Background(), connString)
	if err != nil {
		return fmt.Errorf("failed to create pool: %w", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		return fmt.Errorf("connection failed: %w", err)
	}

	m.mu.Lock()
	m.pools[profileID] = pool
	m.mu.Unlock()
	return nil
}

func (m *ConnectionManager) Disconnect(profileID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if pool, exists := m.pools[profileID]; exists {
		pool.Close()
		delete(m.pools, profileID)
	}
}

func (m *ConnectionManager) DisconnectAll() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for id := range m.pools {
		m.pools[id].Close()
		delete(m.pools, id)
	}
}

func (m *ConnectionManager) GetPool(profileID string) *pgxpool.Pool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	return m.pools[profileID]
}

func (m *ConnectionManager) IsConnected(profileID string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	_, exists := m.pools[profileID]
	return exists
}

func (m *ConnectionManager) TestConnection(connString string) error {
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return fmt.Errorf("invalid connection string: %w", err)
	}
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return fmt.Errorf("failed to create pool: %w", err)
	}
	defer pool.Close()
	if err := pool.Ping(context.Background()); err != nil {
		return fmt.Errorf("connection failed: %w", err)
	}
	return nil
}
