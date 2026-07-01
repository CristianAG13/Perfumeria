package auth

import (
	"context"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type Register struct {
	users    ports.UserRepository
	customers ports.CustomerRepository
	email    ports.EmailSender
}

func NewRegister(users ports.UserRepository, customers ports.CustomerRepository, email ports.EmailSender) *Register {
	return &Register{users: users, customers: customers, email: email}
}

type RegisterInput struct {
	Email    string
	Password string
	Name     string
	LastName string
	Phone    string
}

func (uc *Register) Execute(ctx context.Context, input RegisterInput) (*domain.User, error) {
	if input.Email == "" || input.Password == "" || input.Name == "" {
		return nil, domain.ErrInvalidInput
	}

	// Check if email already exists
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
		LastName:      input.LastName,
		Email:         input.Email,
		EmailVerified: false,
		PasswordHash:  string(hash),
		Phone:         input.Phone,
		Role:          domain.RoleCustomer,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := uc.users.Create(ctx, user); err != nil {
		return nil, err
	}

	// If customer, also create a record in the customers table (same ID)
	if user.Role == domain.RoleCustomer {
		now := time.Now().UTC().Format("2006-01-02 15:04:05")
		_ = uc.customers.Save(ctx, &domain.Customer{
			ID:        user.ID,
			Name:      user.Name,
			LastName:  user.LastName,
			Phone:     user.Phone,
			Email:     user.Email,
			CreatedAt: now,
			UpdatedAt: now,
		})
	}

	// Send verification email (async, best-effort)
	go uc.sendVerificationEmail(user)

	return user, nil
}

func (uc *Register) sendVerificationEmail(user *domain.User) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenStr, err := token.SignedString([]byte(jwtSecret()))
	if err != nil {
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	verifyLink := fmt.Sprintf("%s/verify-email?token=%s", frontendURL, tokenStr)

	subject := "Confirmá tu email - Perfumería A y F"
	body := fmt.Sprintf(`
		<h2>¡Bienvenido a Perfumería A y F!</h2>
		<p>Hola %s,</p>
		<p>Hacé clic en el siguiente enlace para confirmar tu email:</p>
		<p><a href="%s">Confirmar email</a></p>
		<p>Si no creaste una cuenta, ignorá este mensaje.</p>
	`, user.Email, verifyLink)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_ = uc.email.Send(ctx, user.Email, subject, body)
}

func jwtSecret() string {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "perfumeria-dev-secret-key-2026"
	}
	return s
}
