package auth

import (
	"context"
	"errors"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type Login struct {
	users     ports.UserRepository
	customers ports.CustomerRepository
}

func NewLogin(users ports.UserRepository, customers ports.CustomerRepository) *Login {
	return &Login{users: users, customers: customers}
}

type LoginInput struct {
	Username string
	Password string
}

func (uc *Login) Execute(ctx context.Context, input LoginInput) (*domain.User, error) {
	if input.Username == "" || input.Password == "" {
		return nil, domain.ErrInvalidInput
	}

	var user *domain.User
	var err error

	// Try email first (if it looks like an email), then username
	if strings.Contains(input.Username, "@") {
		user, err = uc.users.FindByEmail(ctx, input.Username)
	} else {
		user, err = uc.users.FindByUsername(ctx, input.Username)
	}
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, errors.New("usuario o contraseña incorrectos")
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, errors.New("usuario o contraseña incorrectos")
	}

	if user.Blocked {
		return nil, errors.New("usuario bloqueado")
	}

	return user, nil
}

func (uc *Login) GetUserByID(ctx context.Context, id string) (*domain.User, error) {
	return uc.users.FindByID(ctx, id)
}

func (uc *Login) UpdateProfile(ctx context.Context, user *domain.User) error {
	return uc.users.Update(ctx, user)
}

func (uc *Login) UpdateCustomerProfile(ctx context.Context, userID, name, lastName, phone, email string) error {
	now := time.Now().UTC().Format("2006-01-02 15:04:05")
	customer, err := uc.customers.FindByID(ctx, userID)
	if err != nil {
		// Create customer if not exists
		return uc.customers.Save(ctx, &domain.Customer{
			ID:        userID,
			Name:      name,
			LastName:  lastName,
			Phone:     phone,
			Email:     email,
			CreatedAt: now,
			UpdatedAt: now,
		})
	}
	customer.Name = name
	customer.LastName = lastName
	customer.Phone = phone
	customer.Email = email
	customer.UpdatedAt = now
	return uc.customers.Save(ctx, customer)
}
