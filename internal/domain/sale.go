package domain

import (
	"errors"
	"fmt"
	"time"
	"github.com/google/uuid"
)

type SaleLine struct {
	ProductID   string
	ProductName string
	Quantity    int
	UnitPrice   Money
	Discount    Money
	Subtotal    Money
}

type PaymentLine struct {
	Method string
	Amount int64
}

type SaleStatus string

const (
	SaleStatusActive    SaleStatus = "active"
	SaleStatusCancelled SaleStatus = "cancelled"
)

type Sale struct {
	ID            string
	Lines         []SaleLine
	CustomerID    *string
	PaymentLines  []PaymentLine
	Total         Money
	Status        SaleStatus
	CancelReason  string
	CreatedAt     time.Time
}

var validPaymentMethods = map[string]bool{
	"cash":       true,
	"card":       true,
	"sinpe":      true,
	"transfer":   true,
	"other":      true,
	"whatsapp":   true,
}

func NewSale(lines []SaleLine, customerID *string, payments []PaymentLine) (*Sale, error) {
	if len(lines) == 0 {
		return nil, errors.New("sale must have at least one line")
	}
	if len(payments) == 0 {
		return nil, errors.New("at least one payment is required")
	}

	var total Money
	for _, l := range lines {
		if l.Quantity <= 0 {
			return nil, errors.New("line quantity must be positive")
		}
		if l.UnitPrice.IsZero() {
			return nil, errors.New("line unit price is required")
		}
		lineTotal, err := l.UnitPrice.Mul(l.Quantity).Sub(l.Discount)
		if err != nil {
			return nil, errors.New("discount exceeds line total")
		}
		total = total.Add(lineTotal)
	}

	var paid int64
	for i, pm := range payments {
		if pm.Amount <= 0 {
			return nil, fmt.Errorf("payment %d: amount must be positive", i+1)
		}
		if !validPaymentMethods[pm.Method] {
			return nil, fmt.Errorf("payment %d: invalid method %q", i+1, pm.Method)
		}
		paid += pm.Amount
	}

	if int64(total.Cents()) != paid {
		return nil, fmt.Errorf("total (%d) does not match sum of payments (%d)", total.Cents(), paid)
	}

	return &Sale{
		ID:           uuid.NewString(),
		Lines:        lines,
		CustomerID:   customerID,
		PaymentLines: payments,
		Total:        total,
		Status:       SaleStatusActive,
		CreatedAt:    time.Now().UTC(),
	}, nil
}

func (s *Sale) Cancel(reason string) error {
	if s.Status == SaleStatusCancelled {
		return ErrAlreadyCancelled
	}
	if reason == "" {
		return ErrReasonRequired
	}
	s.Status = SaleStatusCancelled
	s.CancelReason = reason
	return nil
}

func (s *Sale) IsCancelled() bool {
	return s.Status == SaleStatusCancelled
}
