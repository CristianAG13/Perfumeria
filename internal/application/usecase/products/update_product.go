package products

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type UpdateProductInput struct {
	ProductID       string
	Name            string
	Brand           string
	CategoryID      string
	CategoryName    string
	Image           string
	Description     string
	Gender          string
	SalePrice       domain.Money
	CostPrice       domain.Money
	MinStock        int
	DiscountPercent int
	ShowInStore     *bool
}

type UpdateProduct struct {
	products ports.ProductRepository
}

func NewUpdateProduct(products ports.ProductRepository) *UpdateProduct {
	return &UpdateProduct{products: products}
}

func (uc *UpdateProduct) Execute(ctx context.Context, input UpdateProductInput) (*domain.Product, error) {
	product, err := uc.products.FindByID(ctx, input.ProductID)
	if err != nil {
		return nil, err
	}

	if err := product.Update(input.Name, input.Brand, input.CategoryID, input.CategoryName, input.Image, input.Description, input.Gender, input.SalePrice, input.CostPrice, input.MinStock, input.DiscountPercent); err != nil {
		return nil, err
	}

	if input.ShowInStore != nil {
		product.SetShowInStore(*input.ShowInStore)
	}

	if err := uc.products.Save(ctx, product); err != nil {
		return nil, err
	}

	return product, nil
}
