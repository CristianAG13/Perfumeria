package domain

import (
	"fmt"
	"time"
	"github.com/google/uuid"
)

const (
	MovementTypeInitial     = "initial"
	MovementTypeEntry       = "entry"
	MovementTypeSale        = "sale"
	MovementTypeAdjustment  = "adjustment"
	MovementTypeCancellation = "cancellation"
)

type StockMovement struct {
	ID         string
	ProductID  string
	Type       string
	Quantity   int
	Reason     string
	SaleID     *string
	CreatedAt  time.Time
}

func NewStockMovement(productID, movementType string, quantity int, reason string, saleID *string) (*StockMovement, error) {
	if productID == "" {
		return nil, fmt.Errorf("product id is required: %w", ErrInvalidInput)
	}
	if !isValidMovementType(movementType) {
		return nil, fmt.Errorf("invalid movement type: %w", ErrInvalidInput)
	}
	if movementType == MovementTypeAdjustment && reason == "" {
		return nil, ErrReasonRequired
	}
	if quantity == 0 {
		return nil, fmt.Errorf("quantity must be non-zero: %w", ErrInvalidInput)
	}

	return &StockMovement{
		ID:        uuid.NewString(),
		ProductID: productID,
		Type:      movementType,
		Quantity:  quantity,
		Reason:    reason,
		SaleID:    saleID,
		CreatedAt: time.Now().UTC(),
	}, nil
}

func isValidMovementType(t string) bool {
	switch t {
	case MovementTypeInitial, MovementTypeEntry, MovementTypeSale, MovementTypeAdjustment, MovementTypeCancellation:
		return true
	}
	return false
}
