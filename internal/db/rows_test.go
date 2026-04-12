package db

import (
	"testing"
)

func TestValidateMutationColumns(t *testing.T) {
	columns := []ColumnDef{
		{Name: "id", Type: "integer"},
		{Name: "name", Type: "text"},
		{Name: "email", Type: "text"},
	}

	tests := []struct {
		name    string
		values  map[string]any
		wantErr bool
	}{
		{
			name:    "valid columns",
			values:  map[string]any{"name": "John", "email": "john@example.com"},
			wantErr: false,
		},
		{
			name:    "invalid column",
			values:  map[string]any{"name": "John", "invalid_col": "value"},
			wantErr: true,
		},
		{
			name:    "empty values",
			values:  map[string]any{},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateMutationColumns(columns, tt.values)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateMutationColumns() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestSortedKeys(t *testing.T) {
	values := map[string]any{
		"z": 1,
		"a": 2,
		"m": 3,
	}

	keys := sortedKeys(values)

	expected := []string{"a", "m", "z"}
	if len(keys) != len(expected) {
		t.Errorf("sortedKeys() returned %d keys, want %d", len(keys), len(expected))
	}

	for i, key := range keys {
		if key != expected[i] {
			t.Errorf("sortedKeys()[%d] = %q, want %q", i, key, expected[i])
		}
	}
}

func TestBuildWhereClause(t *testing.T) {
	tests := []struct {
		name          string
		values        map[string]any
		startIndex    int
		wantClause    string
		wantArgsCount int
	}{
		{
			name:          "single value",
			values:        map[string]any{"id": 1},
			startIndex:    0,
			wantClause:    `"id" = $1`,
			wantArgsCount: 1,
		},
		{
			name:          "multiple values",
			values:        map[string]any{"id": 1, "name": "test"},
			startIndex:    0,
			wantClause:    `"id" = $1 AND "name" = $2`,
			wantArgsCount: 2,
		},
		{
			name:          "with null value",
			values:        map[string]any{"id": 1, "deleted_at": nil},
			startIndex:    0,
			wantClause:    `"deleted_at" IS NULL AND "id" = $1`,
			wantArgsCount: 1,
		},
		{
			name:          "with start index",
			values:        map[string]any{"name": "test"},
			startIndex:    2,
			wantClause:    `"name" = $3`,
			wantArgsCount: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			clause, args := buildWhereClause(tt.values, tt.startIndex)
			if clause != tt.wantClause {
				t.Errorf("buildWhereClause() clause = %q, want %q", clause, tt.wantClause)
			}
			if len(args) != tt.wantArgsCount {
				t.Errorf("buildWhereClause() args count = %d, want %d", len(args), tt.wantArgsCount)
			}
		})
	}
}

func TestBuildMutationMatchValues(t *testing.T) {
	columns := []ColumnDef{
		{Name: "id", IsPrimaryKey: true},
		{Name: "name", IsPrimaryKey: false},
		{Name: "email", IsPrimaryKey: false},
	}

	tests := []struct {
		name           string
		originalValues map[string]any
		wantValues     map[string]any
	}{
		{
			name:           "with primary key",
			originalValues: map[string]any{"id": 1, "name": "John", "email": "john@example.com"},
			wantValues:     map[string]any{"id": 1},
		},
		{
			name:           "no primary key",
			originalValues: map[string]any{"name": "John", "email": "john@example.com"},
			wantValues:     map[string]any{"name": "John", "email": "john@example.com"},
		},
		{
			name:           "missing primary key value",
			originalValues: map[string]any{"name": "John"},
			wantValues:     map[string]any{"name": "John"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := buildMutationMatchValues(columns, tt.originalValues)
			if len(result) != len(tt.wantValues) {
				t.Errorf("buildMutationMatchValues() returned %d values, want %d", len(result), len(tt.wantValues))
			}
			for key, wantValue := range tt.wantValues {
				if result[key] != wantValue {
					t.Errorf("buildMutationMatchValues()[%q] = %v, want %v", key, result[key], wantValue)
				}
			}
		})
	}
}
