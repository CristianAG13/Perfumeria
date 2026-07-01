package products

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
)

type DeactivateProduct struct {
	products ports.ProductRepository
}

func NewDeactivateProduct(products ports.ProductRepository) *DeactivateProduct {
	return &DeactivateProduct{products: products}
}

func (uc *DeactivateProduct) Execute(ctx context.Context, productID string) error {
	product, err := uc.products.FindByID(ctx, productID)
	if err != nil {
		return err
	}

	product.Deactivate()
	return uc.products.Save(ctx, product)
}
