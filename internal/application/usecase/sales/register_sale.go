package sales

import (
	"context"
	"fmt"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type SaleLineInput struct {
	ProductID   string
	ProductName string
	Quantity    int
	UnitPrice   domain.Money
	Discount    domain.Money
}

type PaymentInput struct {
	Method string
	Amount int64
}

type RegisterSaleInput struct {
	Lines      []SaleLineInput
	CustomerID *string
	Payments   []PaymentInput
}

type RegisterSale struct {
	products ports.ProductRepository
	sales    ports.SaleRepository
	stock    ports.StockRepository
	tx       ports.Transactor
}

func NewRegisterSale(products ports.ProductRepository, sales ports.SaleRepository, stock ports.StockRepository, tx ports.Transactor) *RegisterSale {
	return &RegisterSale{products: products, sales: sales, stock: stock, tx: tx}
}

func (uc *RegisterSale) Execute(ctx context.Context, input RegisterSaleInput) (*domain.Sale, error) {
	if len(input.Lines) == 0 {
		return nil, fmt.Errorf("sale must have at least one item")
	}

	domainLines := make([]domain.SaleLine, len(input.Lines))
	for i, l := range input.Lines {
		lineSubtotal, err := l.UnitPrice.Mul(l.Quantity).Sub(l.Discount)
		if err != nil {
			return nil, fmt.Errorf("line %d: %w", i, err)
		}
		domainLines[i] = domain.SaleLine{
			ProductID:   l.ProductID,
			ProductName: l.ProductName,
			Quantity:    l.Quantity,
			UnitPrice:   l.UnitPrice,
			Discount:    l.Discount,
			Subtotal:    lineSubtotal,
		}
	}

	for _, l := range domainLines {
		currentStock, err := uc.stock.CurrentStock(ctx, l.ProductID)
		if err != nil {
			return nil, fmt.Errorf("check stock for %s: %w", l.ProductID, err)
		}
		if currentStock < l.Quantity {
			return nil, fmt.Errorf("%w: product %s has %d, needs %d", domain.ErrInsufficientStock, l.ProductName, currentStock, l.Quantity)
		}
	}

	domainPayments := make([]domain.PaymentLine, len(input.Payments))
	for i, pm := range input.Payments {
		domainPayments[i] = domain.PaymentLine{
			Method: pm.Method,
			Amount: pm.Amount,
		}
	}

	sale, err := domain.NewSale(domainLines, input.CustomerID, domainPayments)
	if err != nil {
		return nil, err
	}

	var movements []*domain.StockMovement
	for _, l := range domainLines {
		m, err := domain.NewStockMovement(l.ProductID, domain.MovementTypeSale, -l.Quantity, "Venta", &sale.ID)
		if err != nil {
			return nil, err
		}
		movements = append(movements, m)
	}

	err = uc.tx.WithinTx(ctx, func(txCtx context.Context) error {
		return uc.sales.Save(txCtx, sale, movements)
	})
	if err != nil {
		return nil, err
	}

	return sale, nil
}
