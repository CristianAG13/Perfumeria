package products

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type SearchProductsInput struct {
	Query    string
	Category string
	Gender   string
	Limit    int
	Offset   int
}

type SearchProducts struct {
	products ports.ProductRepository
}

func NewSearchProducts(products ports.ProductRepository) *SearchProducts {
	return &SearchProducts{products: products}
}

func (uc *SearchProducts) Execute(ctx context.Context, input SearchProductsInput) ([]*domain.Product, error) {
	return uc.products.Search(ctx, ports.SearchProductsQuery{
		Query:    input.Query,
		Category: input.Category,
		Gender:   input.Gender,
		Limit:    input.Limit,
		Offset:   input.Offset,
	})
}
