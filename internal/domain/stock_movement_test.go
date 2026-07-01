package domain

import (
	"errors"
	"testing"
)

func TestNewStockMovement(t *testing.T) {
	t.Run("valid entry movement", func(t *testing.T) {
		m, err := NewStockMovement("prod-1", MovementTypeEntry, 10, "reposición", nil)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if m.ID == "" {
			t.Error("expected non-empty ID")
		}
		if m.ProductID != "prod-1" {
			t.Errorf("product_id = %q", m.ProductID)
		}
		if m.Type != MovementTypeEntry {
			t.Errorf("type = %q", m.Type)
		}
		if m.Quantity != 10 {
			t.Errorf("quantity = %d", m.Quantity)
		}
		if m.SaleID != nil {
			t.Error("expected nil sale_id")
		}
		if m.CreatedAt.IsZero() {
			t.Error("expected non-zero CreatedAt")
		}
	})

	t.Run("valid sale movement", func(t *testing.T) {
		saleID := "sale-123"
		m, err := NewStockMovement("prod-1", MovementTypeSale, -2, "venta", &saleID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if m.Quantity != -2 {
			t.Errorf("quantity = %d", m.Quantity)
		}
		if m.SaleID == nil || *m.SaleID != "sale-123" {
			t.Errorf("sale_id = %v", m.SaleID)
		}
	})

	t.Run("valid adjustment with reason", func(t *testing.T) {
		m, err := NewStockMovement("prod-1", MovementTypeAdjustment, -1, "rotura de frasco", nil)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if m.Type != MovementTypeAdjustment {
			t.Errorf("type = %q", m.Type)
		}
	})

	t.Run("all valid movement types", func(t *testing.T) {
		types := []string{MovementTypeInitial, MovementTypeEntry, MovementTypeSale, MovementTypeAdjustment, MovementTypeCancellation}
		for _, mt := range types {
			m, err := NewStockMovement("prod-1", mt, 5, "test", nil)
			if err != nil {
				t.Errorf("type %q should be valid: %v", mt, err)
				continue
			}
			if m.Type != mt {
				t.Errorf("type = %q, want %q", m.Type, mt)
			}
		}
	})

	t.Run("empty product ID", func(t *testing.T) {
		_, err := NewStockMovement("", MovementTypeEntry, 10, "test", nil)
		if err == nil {
			t.Fatal("expected error for empty product ID")
		}
		if !errors.Is(err, ErrInvalidInput) {
			t.Errorf("expected ErrInvalidInput, got %v", err)
		}
	})

	t.Run("invalid movement type", func(t *testing.T) {
		_, err := NewStockMovement("prod-1", "invalid", 10, "test", nil)
		if err == nil {
			t.Fatal("expected error for invalid type")
		}
		if !errors.Is(err, ErrInvalidInput) {
			t.Errorf("expected ErrInvalidInput, got %v", err)
		}
	})

	t.Run("adjustment without reason", func(t *testing.T) {
		_, err := NewStockMovement("prod-1", MovementTypeAdjustment, -1, "", nil)
		if err == nil {
			t.Fatal("expected error for adjustment without reason")
		}
		if !errors.Is(err, ErrReasonRequired) {
			t.Errorf("expected ErrReasonRequired, got %v", err)
		}
	})

	t.Run("zero quantity", func(t *testing.T) {
		_, err := NewStockMovement("prod-1", MovementTypeEntry, 0, "test", nil)
		if err == nil {
			t.Fatal("expected error for zero quantity")
		}
		if !errors.Is(err, ErrInvalidInput) {
			t.Errorf("expected ErrInvalidInput, got %v", err)
		}
	})
}

func TestIsValidMovementType(t *testing.T) {
	tests := []struct {
		name string
		t    string
		want bool
	}{
		{"initial", MovementTypeInitial, true},
		{"entry", MovementTypeEntry, true},
		{"sale", MovementTypeSale, true},
		{"adjustment", MovementTypeAdjustment, true},
		{"cancellation", MovementTypeCancellation, true},
		{"invalid", "invalid", false},
		{"empty", "", false},
		{"mix case", "Entry", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isValidMovementType(tt.t)
			if got != tt.want {
				t.Errorf("isValidMovementType(%q) = %v, want %v", tt.t, got, tt.want)
			}
		})
	}
}
