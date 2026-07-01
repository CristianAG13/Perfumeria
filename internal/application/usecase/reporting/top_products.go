package reporting

import (
	"context"
	"time"

	"github.com/ayf/perfumeria/internal/application/ports"
)

type TopProducts struct {
	sales ports.SaleRepository
}

func NewTopProducts(sales ports.SaleRepository) *TopProducts {
	return &TopProducts{sales: sales}
}

func (uc *TopProducts) Execute(ctx context.Context, from, to time.Time, limit int) ([]ports.TopProductItem, error) {
	return uc.sales.TopProducts(ctx, from, to, limit)
}
