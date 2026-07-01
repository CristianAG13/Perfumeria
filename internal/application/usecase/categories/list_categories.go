package categories

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type ListCategories struct {
	categories ports.CategoryRepository
}

func NewListCategories(categories ports.CategoryRepository) *ListCategories {
	return &ListCategories{categories: categories}
}

func (uc *ListCategories) Execute(ctx context.Context) ([]*domain.Category, error) {
	return uc.categories.ListAll(ctx)
}
