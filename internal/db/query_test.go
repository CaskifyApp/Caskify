package db

import (
	"testing"
)

func TestIsDangerousQuery(t *testing.T) {
	tests := []struct {
		name     string
		sql      string
		expected bool
		command  string
	}{
		{
			name:     "safe select query",
			sql:      "SELECT * FROM users",
			expected: false,
			command:  "",
		},
		{
			name:     "drop database command",
			sql:      "DROP DATABASE testdb",
			expected: true,
			command:  "DROP DATABASE",
		},
		{
			name:     "drop table command",
			sql:      "DROP TABLE users",
			expected: true,
			command:  "DROP TABLE",
		},
		{
			name:     "truncate table command",
			sql:      "TRUNCATE TABLE orders",
			expected: true,
			command:  "TRUNCATE TABLE",
		},
		{
			name:     "delete from command",
			sql:      "DELETE FROM users WHERE id = 1",
			expected: true,
			command:  "DELETE FROM",
		},
		{
			name:     "update command",
			sql:      "UPDATE users SET name = 'test'",
			expected: true,
			command:  "UPDATE",
		},
		{
			name:     "case insensitive dangerous query",
			sql:      "drop table users",
			expected: true,
			command:  "DROP TABLE",
		},
		{
			name:     "select with truncate in string",
			sql:      "SELECT 'TRUNCATE' as action",
			expected: true,
			command:  "TRUNCATE",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isDangerous, command := IsDangerousQuery(tt.sql)
			if isDangerous != tt.expected {
				t.Errorf("IsDangerousQuery(%q) = %v, want %v", tt.sql, isDangerous, tt.expected)
			}
			if isDangerous && command != tt.command {
				t.Errorf("IsDangerousQuery(%q) command = %q, want %q", tt.sql, command, tt.command)
			}
		})
	}
}

func TestValidateIdentifier(t *testing.T) {
	tests := []struct {
		name    string
		value   string
		label   string
		wantErr bool
	}{
		{
			name:    "valid identifier",
			value:   "users",
			label:   "table name",
			wantErr: false,
		},
		{
			name:    "valid identifier with underscore",
			value:   "user_accounts",
			label:   "table name",
			wantErr: false,
		},
		{
			name:    "valid identifier starts with underscore",
			value:   "_private",
			label:   "column name",
			wantErr: false,
		},
		{
			name:    "empty identifier",
			value:   "",
			label:   "table name",
			wantErr: true,
		},
		{
			name:    "identifier with space",
			value:   "user accounts",
			label:   "table name",
			wantErr: true,
		},
		{
			name:    "identifier starts with number",
			value:   "123users",
			label:   "table name",
			wantErr: true,
		},
		{
			name:    "identifier with special chars",
			value:   "user@accounts",
			label:   "table name",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateIdentifier(tt.value, tt.label)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateIdentifier(%q, %q) error = %v, wantErr %v", tt.value, tt.label, err, tt.wantErr)
			}
		})
	}
}

func TestIsProtectedDatabase(t *testing.T) {
	tests := []struct {
		name     string
		dbName   string
		expected bool
	}{
		{"postgres", "postgres", true},
		{"template0", "template0", true},
		{"template1", "template1", true},
		{"userdb", "userdb", false},
		{"POSTGRES", "POSTGRES", true},
		{"Postgres", "Postgres", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isProtectedDatabase(tt.dbName)
			if result != tt.expected {
				t.Errorf("isProtectedDatabase(%q) = %v, want %v", tt.dbName, result, tt.expected)
			}
		})
	}
}

func TestIsProtectedSchema(t *testing.T) {
	tests := []struct {
		name     string
		schema   string
		expected bool
	}{
		{"pg_catalog", "pg_catalog", true},
		{"information_schema", "information_schema", true},
		{"pg_toast", "pg_toast", true},
		{"pg_temp_123", "pg_temp_123", true},
		{"public", "public", false},
		{"myschema", "myschema", false},
		{"PG_CATALOG", "PG_CATALOG", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isProtectedSchema(tt.schema)
			if result != tt.expected {
				t.Errorf("isProtectedSchema(%q) = %v, want %v", tt.schema, result, tt.expected)
			}
		})
	}
}
