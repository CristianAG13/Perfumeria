package reporting

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
)

type LowStock struct {
	products ports.ProductRepository
}

func NewLowStock(products ports.ProductRepository) *LowStock {
	return &LowStock{products: products}
}

func (uc *LowStock) Execute(ctx context.Context) ([]ports.LowStockItem, error) {
	return uc.products.ListBelowMinimum(ctx)
}
