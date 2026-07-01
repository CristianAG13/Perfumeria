package stock

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type RecordEntryInput struct {
	ProductID string
	Quantity  int
	Reason    string
}

type RecordEntry struct {
	stock ports.StockRepository
}

func NewRecordEntry(stock ports.StockRepository) *RecordEntry {
	return &RecordEntry{stock: stock}
}

func (uc *RecordEntry) Execute(ctx context.Context, input RecordEntryInput) (*domain.StockMovement, error) {
	movement, err := domain.NewStockMovement(input.ProductID, domain.MovementTypeEntry, input.Quantity, input.Reason, nil)
	if err != nil {
		return nil, err
	}

	if err := uc.stock.Append(ctx, movement); err != nil {
		return nil, err
	}

	return movement, nil
}

type AdjustStockInput struct {
	ProductID string
	Quantity  int
	Reason    string
}

type AdjustStock struct {
	stock ports.StockRepository
}

func NewAdjustStock(stock ports.StockRepository) *AdjustStock {
	return &AdjustStock{stock: stock}
}

func (uc *AdjustStock) Execute(ctx context.Context, input AdjustStockInput) (*domain.StockMovement, error) {
	movement, err := domain.NewStockMovement(input.ProductID, domain.MovementTypeAdjustment, input.Quantity, input.Reason, nil)
	if err != nil {
		return nil, err
	}

	if err := uc.stock.Append(ctx, movement); err != nil {
		return nil, err
	}

	return movement, nil
}
