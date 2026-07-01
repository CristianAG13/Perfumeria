package auth

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type AdminUsers struct {
	users     ports.UserRepository
	customers ports.CustomerRepository
}

func NewAdminUsers(users ports.UserRepository, customers ports.CustomerRepository) *AdminUsers {
	return &AdminUsers{users: users, customers: customers}
}

func (uc *AdminUsers) ListUsers(ctx context.Context) ([]*domain.User, error) {
	return uc.users.ListByRole(ctx, domain.RoleCustomer)
}

func (uc *AdminUsers) ListAdmins(ctx context.Context) ([]*domain.User, error) {
	return uc.users.ListByRole(ctx, domain.RoleAdmin)
}

func (uc *AdminUsers) ListAll(ctx context.Context) ([]*domain.User, error) {
	return uc.users.ListAll(ctx)
}

type CreateAdminInput struct {
	Email    string
	Password string
	Name     string
}

func (uc *AdminUsers) CreateAdmin(ctx context.Context, input CreateAdminInput) (*domain.User, error) {
	if input.Email == "" || input.Password == "" || input.Name == "" {
		return nil, domain.ErrInvalidInput
	}

	existing, err := uc.users.FindByEmail(ctx, input.Email)
	if err != nil && !errors.Is(err, domain.ErrNotFound) {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("el email ya está registrado")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	user := &domain.User{
		ID:            uuid.NewString(),
		Username:      input.Email,
		Name:          input.Name,
		Email:         input.Email,
		EmailVerified: true,
		PasswordHash:  string(hash),
		Role:          domain.RoleAdmin,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := uc.users.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (uc *AdminUsers) PromoteToAdmin(ctx context.Context, userID string) error {
	user, err := uc.users.FindByID(ctx, userID)
	if err != nil {
		return err
	}

	user.Role = domain.RoleAdmin
	user.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
	return uc.users.Update(ctx, user)
}

func (uc *AdminUsers) ChangePassword(ctx context.Context, userID, newPassword string) error {
	if newPassword == "" {
		return errors.New("la contraseña no puede estar vacía")
	}
	user, err := uc.users.FindByID(ctx, userID)
	if err != nil {
		return err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.PasswordHash = string(hash)
	user.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
	return uc.users.Update(ctx, user)
}

func (uc *AdminUsers) ToggleBlock(ctx context.Context, userID string) (*domain.User, error) {
	user, err := uc.users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	user.Blocked = !user.Blocked
	user.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
	if err := uc.users.Update(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

func (uc *AdminUsers) DeleteUser(ctx context.Context, userID string) error {
	// Delete customer record if it exists (same ID for registered customers)
	_ = uc.customers.Delete(ctx, userID)
	// Delete the user
	return uc.users.Delete(ctx, userID)
}
