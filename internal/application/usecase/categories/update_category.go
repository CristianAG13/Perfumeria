package categories

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type UpdateCategoryInput struct {
	ID          string
	Name        string
	Image       string
	Description string
}

type UpdateCategory struct {
	categories ports.CategoryRepository
}

func NewUpdateCategory(categories ports.CategoryRepository) *UpdateCategory {
	return &UpdateCategory{categories: categories}
}

func (uc *UpdateCategory) Execute(ctx context.Context, input UpdateCategoryInput) (*domain.Category, error) {
	c, err := uc.categories.FindByID(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	c.Name = input.Name
	c.Image = input.Image
	c.Description = input.Description
	if err := uc.categories.Save(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}
