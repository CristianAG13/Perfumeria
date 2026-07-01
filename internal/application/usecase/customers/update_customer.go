package customers

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type UpdateCustomerInput struct {
	CustomerID string
	Name       string
	LastName   string
	Phone      string
	Email      string
}

type UpdateCustomer struct {
	repo ports.CustomerRepository
}

func NewUpdateCustomer(repo ports.CustomerRepository) *UpdateCustomer {
	return &UpdateCustomer{repo: repo}
}

func (uc *UpdateCustomer) Execute(ctx context.Context, input UpdateCustomerInput) (*domain.Customer, error) {
	customer, err := uc.repo.FindByID(ctx, input.CustomerID)
	if err != nil {
		return nil, err
	}

	if err := customer.Update(input.Name, input.LastName, input.Phone, input.Email); err != nil {
		return nil, err
	}

	if err := uc.repo.Save(ctx, customer); err != nil {
		return nil, err
	}

	return customer, nil
}
