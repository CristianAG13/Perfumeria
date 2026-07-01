package auth

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/ayf/perfumeria/internal/domain"
	"github.com/ayf/perfumeria/internal/application/ports"
)

type VerifyEmail struct {
	users ports.UserRepository
}

func NewVerifyEmail(users ports.UserRepository) *VerifyEmail {
	return &VerifyEmail{users: users}
}

type VerifyEmailInput struct {
	Token string
}

func (uc *VerifyEmail) Execute(ctx context.Context, input VerifyEmailInput) error {
	if input.Token == "" {
		return domain.ErrInvalidInput
	}

	// Parse and validate token
	token, err := jwt.Parse(input.Token, func(t *jwt.Token) (any, error) {
		return []byte(jwtSecret()), nil
	})
	if err != nil || !token.Valid {
		return errors.New("token de verificación inválido o expirado")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return errors.New("token de verificación inválido")
	}

	userID, _ := claims["user_id"].(string)
	if userID == "" {
		return errors.New("token de verificación inválido")
	}

	user, err := uc.users.FindByID(ctx, userID)
	if err != nil {
		return errors.New("usuario no encontrado")
	}

	if user.EmailVerified {
		return nil // already verified
	}

	user.EmailVerified = true
	user.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
	return uc.users.Update(ctx, user)
}
