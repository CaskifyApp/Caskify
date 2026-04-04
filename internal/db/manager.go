package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ConnectionManager struct {
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
	if _, exists := m.pools[profileID]; exists {
		return nil
	}
	pool, err := pgxpool.New(context.Background(), connString)
	if err != nil {
		return fmt.Errorf("failed to create pool: %w", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		return fmt.Errorf("connection failed: %w", err)
	}
	m.pools[profileID] = pool
	return nil
}

func (m *ConnectionManager) Disconnect(profileID string) {
	if pool, exists := m.pools[profileID]; exists {
		pool.Close()
		delete(m.pools, profileID)
	}
}

func (m *ConnectionManager) DisconnectAll() {
	for id := range m.pools {
		m.Disconnect(id)
	}
}

func (m *ConnectionManager) GetPool(profileID string) *pgxpool.Pool {
	return m.pools[profileID]
}

func (m *ConnectionManager) IsConnected(profileID string) bool {
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
