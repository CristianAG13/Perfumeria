package auth

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type ForgotPassword struct {
	users ports.UserRepository
	email ports.EmailSender
}

func NewForgotPassword(users ports.UserRepository, email ports.EmailSender) *ForgotPassword {
	return &ForgotPassword{users: users, email: email}
}

type ForgotPasswordInput struct {
	Email string
}

func (uc *ForgotPassword) Execute(ctx context.Context, input ForgotPasswordInput) error {
	if input.Email == "" {
		return domain.ErrInvalidInput
	}

	user, err := uc.users.FindByEmail(ctx, input.Email)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			// Don't reveal if email exists — just return success
			return nil
		}
		return err
	}

	// Generate reset token (valid for 1 hour)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(1 * time.Hour).Unix(),
	})
	tokenStr, err := token.SignedString([]byte(jwtSecret()))
	if err != nil {
		return err
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", frontendURL, tokenStr)

	// Log the link (useful for dev without SMTP)
	log.Printf("[RESET PASS] Link para %s: %s", user.Email, resetLink)

	// Send email (best-effort)
	subject := "Restablecé tu contraseña - Perfumería A y F"
	body := fmt.Sprintf(`
		<h2>Restablecer contraseña</h2>
		<p>Hacé clic en el siguiente enlace para restablecer tu contraseña:</p>
		<p><a href="%s">Restablecer contraseña</a></p>
		<p>Este enlace expira en 1 hora.</p>
		<p>Si no solicitaste esto, ignorá este mensaje.</p>
	`, resetLink)

	ctx2, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_ = uc.email.Send(ctx2, user.Email, subject, body)

	return nil
}

type ResetPassword struct {
	users ports.UserRepository
}

func NewResetPassword(users ports.UserRepository) *ResetPassword {
	return &ResetPassword{users: users}
}

type ResetPasswordInput struct {
	Token       string
	NewPassword string
}

func (uc *ResetPassword) Execute(ctx context.Context, input ResetPasswordInput) error {
	if input.Token == "" || input.NewPassword == "" {
		return domain.ErrInvalidInput
	}

	// Parse and validate token
	token, err := jwt.Parse(input.Token, func(t *jwt.Token) (any, error) {
		return []byte(jwtSecret()), nil
	})
	if err != nil || !token.Valid {
		return errors.New("token inválido o expirado")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return errors.New("token inválido")
	}

	userID, _ := claims["user_id"].(string)
	if userID == "" {
		return errors.New("token inválido")
	}

	user, err := uc.users.FindByID(ctx, userID)
	if err != nil {
		return errors.New("usuario no encontrado")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hash)
	user.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
	return uc.users.Update(ctx, user)
}
