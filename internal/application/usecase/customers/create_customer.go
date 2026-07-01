package customers

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type CreateCustomerInput struct {
	Name     string
	LastName string
	Phone    string
	Email    string
}

type CreateCustomer struct {
	repo ports.CustomerRepository
}

func NewCreateCustomer(repo ports.CustomerRepository) *CreateCustomer {
	return &CreateCustomer{repo: repo}
}

func (uc *CreateCustomer) Execute(ctx context.Context, input CreateCustomerInput) (*domain.Customer, error) {
	customer, err := domain.NewCustomer(input.Name, input.LastName, input.Phone, input.Email)
	if err != nil {
		return nil, err
	}

	if err := uc.repo.Save(ctx, customer); err != nil {
		return nil, err
	}

	return customer, nil
}
