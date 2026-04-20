package db

import "testing"

func TestShouldUsePoolerSafeMode(t *testing.T) {
	tests := []struct {
		name string
		host string
		port uint16
		want bool
	}{
		{name: "supabase transaction pooler by port", host: "aws-1-ap-southeast-1.pooler.supabase.com", port: 6543, want: true},
		{name: "neon pooler by host", host: "ep-silent-night-pooler.ap-southeast-1.aws.neon.tech", port: 5432, want: true},
		{name: "generic proxy by host", host: "postgres.proxy.example.com", port: 5432, want: true},
		{name: "direct postgres host", host: "db.example.com", port: 5432, want: false},
		{name: "local database", host: "localhost", port: 5432, want: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := shouldUsePoolerSafeMode(tt.host, tt.port)
			if got != tt.want {
				t.Fatalf("shouldUsePoolerSafeMode(%q, %d) = %v, want %v", tt.host, tt.port, got, tt.want)
			}
		})
	}
}
