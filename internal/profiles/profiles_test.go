package profiles

import (
	"strings"
	"testing"
)

func TestDetectSSLMode(t *testing.T) {
	tests := []struct {
		name       string
		host       string
		configured string
		want       string
	}{
		{name: "configured value wins", host: "db.example.com", configured: "verify-full", want: "verify-full"},
		{name: "auto cloud host uses require", host: "db.abc.supabase.co", configured: "", want: "require"},
		{name: "auto local host uses disable", host: "localhost", configured: "", want: "disable"},
		{name: "auto keyword falls back to detection", host: "project.neon.tech", configured: "auto", want: "require"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := DetectSSLMode(tt.host, tt.configured)
			if got != tt.want {
				t.Fatalf("DetectSSLMode(%q, %q) = %q, want %q", tt.host, tt.configured, got, tt.want)
			}
		})
	}
}

func TestBuildConnectionStringUsesResolvedSSLMode(t *testing.T) {
	profile := Profile{
		Name:            "Cloud",
		Host:            "project.neon.tech",
		Port:            5432,
		DefaultDatabase: "postgres",
		Username:        "postgres",
	}

	connString := profile.BuildConnectionString("secret")
	if !strings.Contains(connString, "sslmode=require") {
		t.Fatalf("expected connection string to use detected sslmode=require, got %q", connString)
	}
}
