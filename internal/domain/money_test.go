package domain

import (
	"testing"
)

func TestNewMoney(t *testing.T) {
	t.Run("valid cents", func(t *testing.T) {
		m, err := NewMoney(10050)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if m.Cents() != 10050 {
			t.Errorf("got cents %d, want 10050", m.Cents())
		}
	})

	t.Run("zero cents", func(t *testing.T) {
		m, err := NewMoney(0)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !m.IsZero() {
			t.Error("expected zero money")
		}
	})

	t.Run("negative cents", func(t *testing.T) {
		_, err := NewMoney(-1)
		if err == nil {
			t.Fatal("expected error for negative cents")
		}
	})
}

func TestMoneyFromARS(t *testing.T) {
	tests := []struct {
		name     string
		input    float64
		wantCents int64
		wantErr  bool
	}{
		{"whole number", 100.00, 10000, false},
		{"with cents", 99.99, 9999, false},
		{"single cent", 0.01, 1, false},
		{"zero", 0, 0, false},
		{"large", 999999.99, 99999999, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m, err := MoneyFromARS(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if m.Cents() != tt.wantCents {
				t.Errorf("cents = %d, want %d", m.Cents(), tt.wantCents)
			}
		})
	}
}

func TestMoneyARS(t *testing.T) {
	tests := []struct {
		cents int64
		want  float64
	}{
		{10000, 100.00},
		{9999, 99.99},
		{1, 0.01},
		{0, 0},
		{150, 1.50},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			m, _ := NewMoney(tt.cents)
			got := m.ARS()
			if got != tt.want {
				t.Errorf("ARS() = %.2f, want %.2f", got, tt.want)
			}
		})
	}
}

func TestMoneyAdd(t *testing.T) {
	a, _ := NewMoney(1000)
	b, _ := NewMoney(2500)
	result := a.Add(b)
	if result.Cents() != 3500 {
		t.Errorf("1000 + 2500 = %d, want 3500", result.Cents())
	}

	// Commutative
	result2 := b.Add(a)
	if result2.Cents() != 3500 {
		t.Errorf("2500 + 1000 = %d, want 3500", result2.Cents())
	}

	// Add zero
	zero, _ := NewMoney(0)
	result3 := a.Add(zero)
	if result3.Cents() != 1000 {
		t.Errorf("1000 + 0 = %d, want 1000", result3.Cents())
	}
}

func TestMoneySub(t *testing.T) {
	t.Run("valid subtraction", func(t *testing.T) {
		a, _ := NewMoney(3000)
		b, _ := NewMoney(1000)
		result, err := a.Sub(b)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result.Cents() != 2000 {
			t.Errorf("3000 - 1000 = %d, want 2000", result.Cents())
		}
	})

	t.Run("subtract same value", func(t *testing.T) {
		a, _ := NewMoney(1000)
		result, err := a.Sub(a)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !result.IsZero() {
			t.Errorf("expected zero, got %d", result.Cents())
		}
	})

	t.Run("negative result error", func(t *testing.T) {
		a, _ := NewMoney(500)
		b, _ := NewMoney(1000)
		_, err := a.Sub(b)
		if err == nil {
			t.Fatal("expected error for negative result")
		}
	})
}

func TestMoneyMul(t *testing.T) {
	a, _ := NewMoney(150)
	result := a.Mul(3)
	if result.Cents() != 450 {
		t.Errorf("150 * 3 = %d, want 450", result.Cents())
	}

	// Multiply by zero
	result2 := a.Mul(0)
	if !result2.IsZero() {
		t.Errorf("expected zero, got %d", result2.Cents())
	}

	// Multiply by one
	result3 := a.Mul(1)
	if result3.Cents() != 150 {
		t.Errorf("150 * 1 = %d, want 150", result3.Cents())
	}
}

func TestMoneyEquals(t *testing.T) {
	a, _ := NewMoney(100)
	b, _ := NewMoney(100)
	c, _ := NewMoney(200)

	if !a.Equals(b) {
		t.Error("100 should equal 100")
	}
	if a.Equals(c) {
		t.Error("100 should not equal 200")
	}
}

func TestMoneyLessThan(t *testing.T) {
	a, _ := NewMoney(100)
	b, _ := NewMoney(200)

	if !a.LessThan(b) {
		t.Error("100 should be less than 200")
	}
	if b.LessThan(a) {
		t.Error("200 should not be less than 100")
	}
	if a.LessThan(a) {
		t.Error("100 should not be less than 100")
	}
}

func TestMoneyString(t *testing.T) {
	tests := []struct {
		cents int64
		want  string
	}{
		{10000, "₡100.00"},
		{150, "₡1.50"},
		{5, "₡0.05"},
		{0, "₡0.00"},
		{123456, "₡1234.56"},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			m, _ := NewMoney(tt.cents)
			got := m.String()
			if got != tt.want {
				t.Errorf("String() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestMoneyIsZero(t *testing.T) {
	zero, _ := NewMoney(0)
	nonZero, _ := NewMoney(1)

	if !zero.IsZero() {
		t.Error("expected zero to be zero")
	}
	if nonZero.IsZero() {
		t.Error("expected non-zero to not be zero")
	}
}
