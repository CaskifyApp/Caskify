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

func (m *ConnectionManager) Connect(ctx context.Context, connString string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, connString)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	return pool, nil
}

func (m *ConnectionManager) Disconnect(id string) {
	if pool, ok := m.pools[id]; ok {
		pool.Close()
		delete(m.pools, id)
	}
}
