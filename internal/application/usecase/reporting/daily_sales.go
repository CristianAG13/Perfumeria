package reporting

import (
	"context"
	"time"

	"github.com/ayf/perfumeria/internal/application/ports"
)

type DailySales struct {
	sales ports.SaleRepository
}

func NewDailySales(sales ports.SaleRepository) *DailySales {
	return &DailySales{sales: sales}
}

func (uc *DailySales) Execute(ctx context.Context, date time.Time) (*ports.DailyReportResult, error) {
	return uc.sales.DailyReport(ctx, date)
}
