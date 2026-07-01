package customers

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type SearchCustomers struct {
	repo ports.CustomerRepository
}

func NewSearchCustomers(repo ports.CustomerRepository) *SearchCustomers {
	return &SearchCustomers{repo: repo}
}

func (uc *SearchCustomers) Execute(ctx context.Context, query string) ([]*domain.Customer, error) {
	return uc.repo.Search(ctx, query)
}
