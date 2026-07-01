package domain

import (
	"testing"
)

func validSaleLine(unitPrice int64) SaleLine {
	m, _ := NewMoney(unitPrice)
	zero, _ := NewMoney(0)
	return SaleLine{
		ProductID:   "prod-1",
		ProductName: "Test Product",
		Quantity:    1,
		UnitPrice:   m,
		Discount:    zero,
		Subtotal:    m,
	}
}

func TestNewSale(t *testing.T) {
	t.Run("valid sale with one line", func(t *testing.T) {
		price, _ := NewMoney(5000)
		line := validSaleLine(5000)
		line.Subtotal = price
		payments := []PaymentLine{{Method: "cash", Amount: 5000}}

		s, err := NewSale([]SaleLine{line}, nil, payments)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if s.ID == "" {
			t.Error("expected non-empty ID")
		}
		if s.Status != SaleStatusActive {
			t.Errorf("status = %q, want active", s.Status)
		}
		if s.CustomerID != nil {
			t.Error("expected nil customer ID")
		}
		if !s.Total.Equals(price) {
			t.Errorf("total = %d, want %d", s.Total.Cents(), price.Cents())
		}
	})

	t.Run("valid sale with customer", func(t *testing.T) {
		cid := "cust-123"
		line := validSaleLine(5000)
		payments := []PaymentLine{{Method: "card", Amount: 5000}}

		s, err := NewSale([]SaleLine{line}, &cid, payments)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if s.CustomerID == nil || *s.CustomerID != "cust-123" {
			t.Errorf("customer ID = %v, want cust-123", s.CustomerID)
		}
	})

	t.Run("multiple lines total", func(t *testing.T) {
		line1 := validSaleLine(3000)
		line2 := validSaleLine(2000)
		payments := []PaymentLine{{Method: "cash", Amount: 5000}}

		s, err := NewSale([]SaleLine{line1, line2}, nil, payments)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if s.Total.Cents() != 5000 {
			t.Errorf("total = %d, want 5000", s.Total.Cents())
		}
	})

	t.Run("empty lines", func(t *testing.T) {
		_, err := NewSale(nil, nil, []PaymentLine{{Method: "cash", Amount: 1000}})
		if err == nil {
			t.Fatal("expected error for empty lines")
		}
	})

	t.Run("empty payments", func(t *testing.T) {
		line := validSaleLine(1000)
		_, err := NewSale([]SaleLine{line}, nil, nil)
		if err == nil {
			t.Fatal("expected error for empty payments")
		}
	})

	t.Run("negative quantity", func(t *testing.T) {
		line := validSaleLine(1000)
		line.Quantity = -1
		_, err := NewSale([]SaleLine{line}, nil, []PaymentLine{{Method: "cash", Amount: 1000}})
		if err == nil {
			t.Fatal("expected error for negative quantity")
		}
	})

	t.Run("zero unit price", func(t *testing.T) {
		zero, _ := NewMoney(0)
		line := validSaleLine(0)
		line.UnitPrice = zero
		_, err := NewSale([]SaleLine{line}, nil, []PaymentLine{{Method: "cash", Amount: 0}})
		if err == nil {
			t.Fatal("expected error for zero unit price")
		}
	})

	t.Run("invalid payment method", func(t *testing.T) {
		line := validSaleLine(1000)
		_, err := NewSale([]SaleLine{line}, nil, []PaymentLine{{Method: "bitcoin", Amount: 1000}})
		if err == nil {
			t.Fatal("expected error for invalid payment method")
		}
	})

	t.Run("zero payment amount", func(t *testing.T) {
		line := validSaleLine(1000)
		_, err := NewSale([]SaleLine{line}, nil, []PaymentLine{{Method: "cash", Amount: 0}})
		if err == nil {
			t.Fatal("expected error for zero payment amount")
		}
	})

	t.Run("payment total mismatch", func(t *testing.T) {
		line := validSaleLine(5000)
		_, err := NewSale([]SaleLine{line}, nil, []PaymentLine{{Method: "cash", Amount: 4000}})
		if err == nil {
			t.Fatal("expected error for payment mismatch")
		}
	})

	t.Run("multiple payments", func(t *testing.T) {
		line := validSaleLine(10000)
		payments := []PaymentLine{
			{Method: "cash", Amount: 6000},
			{Method: "card", Amount: 4000},
		}
		s, err := NewSale([]SaleLine{line}, nil, payments)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if s.Total.Cents() != 10000 {
			t.Errorf("total = %d, want 10000", s.Total.Cents())
		}
	})
}

func TestSaleCancel(t *testing.T) {
	t.Run("cancel active sale", func(t *testing.T) {
		line := validSaleLine(1000)
		s, _ := NewSale([]SaleLine{line}, nil, []PaymentLine{{Method: "cash", Amount: 1000}})

		err := s.Cancel("cliente se arrepintió")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if s.Status != SaleStatusCancelled {
			t.Errorf("status = %q, want cancelled", s.Status)
		}
		if s.CancelReason != "cliente se arrepintió" {
			t.Errorf("reason = %q", s.CancelReason)
		}
	})

	t.Run("cancel already cancelled", func(t *testing.T) {
		line := validSaleLine(1000)
		s, _ := NewSale([]SaleLine{line}, nil, []PaymentLine{{Method: "cash", Amount: 1000}})
		s.Cancel("reason")

		err := s.Cancel("another reason")
		if err != ErrAlreadyCancelled {
			t.Errorf("expected ErrAlreadyCancelled, got %v", err)
		}
	})

	t.Run("cancel without reason", func(t *testing.T) {
		line := validSaleLine(1000)
		s, _ := NewSale([]SaleLine{line}, nil, []PaymentLine{{Method: "cash", Amount: 1000}})

		err := s.Cancel("")
		if err != ErrReasonRequired {
			t.Errorf("expected ErrReasonRequired, got %v", err)
		}
	})
}

func TestSaleIsCancelled(t *testing.T) {
	line := validSaleLine(1000)
	s, _ := NewSale([]SaleLine{line}, nil, []PaymentLine{{Method: "cash", Amount: 1000}})

	if s.IsCancelled() {
		t.Error("expected active sale not to be cancelled")
	}

	s.Cancel("reason")
	if !s.IsCancelled() {
		t.Error("expected cancelled sale to be cancelled")
	}
}

func TestValidPaymentMethods(t *testing.T) {
	expected := map[string]bool{
		"cash":     true,
		"card":     true,
		"sinpe":    true,
		"transfer": true,
		"other":    true,
	}

	for method, present := range expected {
		if !present {
			continue
		}
		if !validPaymentMethods[method] {
			t.Errorf("expected %q to be a valid payment method", method)
		}
	}
}
