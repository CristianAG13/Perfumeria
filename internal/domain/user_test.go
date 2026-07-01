package domain

import (
	"testing"
)

func TestProfileComplete(t *testing.T) {
	tests := []struct {
		name string
		user User
		want bool
	}{
		{
			name: "all fields filled",
			user: User{Name: "Martín", LastName: "Pérez", Phone: "8888-8888", Email: "martin@test.com"},
			want: true,
		},
		{
			name: "missing name",
			user: User{Name: "", LastName: "Pérez", Phone: "8888-8888", Email: "martin@test.com"},
			want: false,
		},
		{
			name: "missing last name",
			user: User{Name: "Martín", LastName: "", Phone: "8888-8888", Email: "martin@test.com"},
			want: false,
		},
		{
			name: "missing phone",
			user: User{Name: "Martín", LastName: "Pérez", Phone: "", Email: "martin@test.com"},
			want: false,
		},
		{
			name: "missing email",
			user: User{Name: "Martín", LastName: "Pérez", Phone: "8888-8888", Email: ""},
			want: false,
		},
		{
			name: "all empty",
			user: User{},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.user.ProfileComplete()
			if got != tt.want {
				t.Errorf("ProfileComplete() = %v, want %v", got, tt.want)
			}
		})
	}
}
