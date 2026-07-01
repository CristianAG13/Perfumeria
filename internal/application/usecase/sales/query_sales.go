package sales

import (
	"context"
	"time"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type QuerySalesInput struct {
	From       time.Time
	To         time.Time
	CustomerID string
}

type QuerySales struct {
	sales ports.SaleRepository
}

func NewQuerySales(sales ports.SaleRepository) *QuerySales {
	return &QuerySales{sales: sales}
}

func (uc *QuerySales) Execute(ctx context.Context, input QuerySalesInput) ([]*domain.Sale, error) {
	if input.CustomerID != "" {
		return uc.sales.FindByCustomer(ctx, input.CustomerID, input.From, input.To)
	}
	return uc.sales.FindByDateRange(ctx, input.From, input.To)
}
