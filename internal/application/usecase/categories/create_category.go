package categories

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type CreateCategoryInput struct {
	Name        string
	Image       string
	Description string
}

type CreateCategory struct {
	categories ports.CategoryRepository
}

func NewCreateCategory(categories ports.CategoryRepository) *CreateCategory {
	return &CreateCategory{categories: categories}
}

func (uc *CreateCategory) Execute(ctx context.Context, input CreateCategoryInput) (*domain.Category, error) {
	c, err := domain.NewCategory(input.Name, input.Image, input.Description)
	if err != nil {
		return nil, err
	}
	if err := uc.categories.Save(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}
