package domain

import (
	"testing"
)

func TestNewCustomer(t *testing.T) {
	t.Run("valid customer", func(t *testing.T) {
		c, err := NewCustomer("Martín", "Pérez", "8888-8888", "martin@test.com")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if c.ID == "" {
			t.Error("expected non-empty ID")
		}
		if c.Name != "Martín" {
			t.Errorf("name = %q", c.Name)
		}
		if c.LastName != "Pérez" {
			t.Errorf("last_name = %q", c.LastName)
		}
		if c.Phone != "8888-8888" {
			t.Errorf("phone = %q", c.Phone)
		}
		if c.Email != "martin@test.com" {
			t.Errorf("email = %q", c.Email)
		}
		if c.CreatedAt == "" || c.UpdatedAt == "" {
			t.Error("expected non-empty timestamps")
		}
	})

	t.Run("empty name", func(t *testing.T) {
		_, err := NewCustomer("", "Pérez", "8888-8888", "martin@test.com")
		if err == nil {
			t.Fatal("expected error for empty name")
		}
	})

	t.Run("whitespace name", func(t *testing.T) {
		_, err := NewCustomer("   ", "Pérez", "8888-8888", "martin@test.com")
		if err == nil {
			t.Fatal("expected error for whitespace-only name")
		}
	})

	t.Run("empty optional fields", func(t *testing.T) {
		c, err := NewCustomer("Martín", "", "", "")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if c.LastName != "" || c.Phone != "" || c.Email != "" {
			t.Error("empty fields should be allowed")
		}
	})
}

func TestCustomerUpdate(t *testing.T) {
	t.Run("valid update", func(t *testing.T) {
		c, _ := NewCustomer("Martín", "Pérez", "8888-8888", "martin@test.com")
		err := c.Update("Pedro", "García", "7777-7777", "pedro@test.com")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if c.Name != "Pedro" {
			t.Errorf("name = %q", c.Name)
		}
		if c.LastName != "García" {
			t.Errorf("last_name = %q", c.LastName)
		}
		if c.Phone != "7777-7777" {
			t.Errorf("phone = %q", c.Phone)
		}
		if c.Email != "pedro@test.com" {
			t.Errorf("email = %q", c.Email)
		}
	})

	t.Run("empty name on update", func(t *testing.T) {
		c, _ := NewCustomer("Martín", "Pérez", "8888-8888", "martin@test.com")
		err := c.Update("", "García", "7777-7777", "pedro@test.com")
		if err == nil {
			t.Fatal("expected error for empty name")
		}
	})
}
