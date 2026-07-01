package sales

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type CancelSaleInput struct {
	SaleID string
	Reason string
}

type CancelSale struct {
	sales ports.SaleRepository
	stock ports.StockRepository
	tx    ports.Transactor
}

func NewCancelSale(sales ports.SaleRepository, stock ports.StockRepository, tx ports.Transactor) *CancelSale {
	return &CancelSale{sales: sales, stock: stock, tx: tx}
}

func (uc *CancelSale) Execute(ctx context.Context, input CancelSaleInput) (*domain.Sale, error) {
	sale, err := uc.sales.FindByID(ctx, input.SaleID)
	if err != nil {
		return nil, err
	}

	if err := sale.Cancel(input.Reason); err != nil {
		return nil, err
	}

	var movements []*domain.StockMovement
	for _, l := range sale.Lines {
		m, err := domain.NewStockMovement(l.ProductID, domain.MovementTypeCancellation, l.Quantity, input.Reason, &sale.ID)
		if err != nil {
			return nil, err
		}
		movements = append(movements, m)
	}

	err = uc.tx.WithinTx(ctx, func(txCtx context.Context) error {
		return uc.sales.Cancel(txCtx, input.SaleID, input.Reason, movements)
	})
	if err != nil {
		return nil, err
	}

	sale.Status = domain.SaleStatusCancelled
	return sale, nil
}
