package logger

import (
	"strings"
	"testing"
)

func TestRedactConnectionString(t *testing.T) {
	input := "postgres://postgres:secretpass@db.example.com:5432/postgres?sslmode=require password=secretpass POSTGRES_PASSWORD=secretpass"
	got := RedactConnectionString(input)

	if got == input {
		t.Fatalf("expected redacted string to differ from input")
	}
	if strings.Contains(got, "secretpass") {
		t.Fatalf("expected secret to be redacted, got %q", got)
	}
	if !strings.Contains(got, "***") {
		t.Fatalf("expected redacted placeholder in %q", got)
	}
}
