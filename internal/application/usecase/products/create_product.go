package products

import (
	"context"
	"errors"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type CreateProductInput struct {
	Name           string
	Brand          string
	CategoryID     string
	CategoryName   string
	Barcode        string
	Image          string
	Description    string
	Gender         string
	SalePrice      domain.Money
	CostPrice      domain.Money
	MinStock       int
	DiscountPercent int
	ShowInStore    *bool
}

type CreateProduct struct {
	products ports.ProductRepository
	stock    ports.StockRepository
	tx       ports.Transactor
}

func NewCreateProduct(products ports.ProductRepository, stock ports.StockRepository, tx ports.Transactor) *CreateProduct {
	return &CreateProduct{products: products, stock: stock, tx: tx}
}

func (uc *CreateProduct) Execute(ctx context.Context, input CreateProductInput) (*domain.Product, error) {
	existing, err := uc.products.FindByBarcode(ctx, input.Barcode)
	if err != nil && !errors.Is(err, domain.ErrNotFound) {
		return nil, err
	}
	if existing != nil {
		return nil, domain.ErrDuplicateBarcode
	}

	product, err := domain.NewProduct(input.Name, input.Brand, input.CategoryID, input.CategoryName, input.Barcode, input.Image, input.Description, input.Gender, input.SalePrice, input.CostPrice, input.MinStock, input.DiscountPercent)
	if err != nil {
		return nil, err
	}

	if input.ShowInStore != nil {
		product.SetShowInStore(*input.ShowInStore)
	}

	err = uc.tx.WithinTx(ctx, func(txCtx context.Context) error {
		if err := uc.products.Save(txCtx, product); err != nil {
			return err
		}
		if input.MinStock > 0 {
			movement, err := domain.NewStockMovement(product.ID, domain.MovementTypeInitial, input.MinStock, "Stock inicial", nil)
			if err != nil {
				return err
			}
			return uc.stock.Append(txCtx, movement)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return product, nil
}
