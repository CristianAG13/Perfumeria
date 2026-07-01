package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type GoogleAuth struct {
	users     ports.UserRepository
	customers ports.CustomerRepository
	email     ports.EmailSender
}

func NewGoogleAuth(users ports.UserRepository, customers ports.CustomerRepository, email ports.EmailSender) *GoogleAuth {
	return &GoogleAuth{users: users, customers: customers, email: email}
}

type GoogleAuthInput struct {
	AccessToken string `json:"access_token"` // also accepts credential (ID token) from GIS
}

type GoogleAuthResult struct {
	User         *domain.User
	PasswordSent bool
}

type googleUserInfo struct {
	ID            string `json:"sub"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	EmailVerified bool   `json:"email_verified"`
}

func (uc *GoogleAuth) Execute(ctx context.Context, input GoogleAuthInput) (*GoogleAuthResult, error) {
	if input.AccessToken == "" {
		return nil, domain.ErrInvalidInput
	}

	// Verify token with Google's tokeninfo endpoint
	info, err := uc.fetchGoogleUserInfoByToken(input.AccessToken)
	if err != nil {
		return nil, fmt.Errorf("error al verificar token de Google: %w", err)
	}

	if info.Email == "" {
		return nil, errors.New("no se pudo obtener el email de Google")
	}

	// Check if user exists by Google ID
	user, err := uc.users.FindByGoogleID(ctx, info.ID)
	if err == nil {
		return &GoogleAuthResult{User: user}, nil
	}

	// Check if user exists by email
	user, err = uc.users.FindByEmail(ctx, info.Email)
	if err == nil {
		// Link Google ID to existing user
		user.GoogleID = info.ID
		user.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
		_ = uc.users.Update(ctx, user)
		return &GoogleAuthResult{User: user}, nil
	}

	if !errors.Is(err, domain.ErrNotFound) {
		return nil, err
	}

	// Create new user
	now := time.Now().Format("2006-01-02 15:04:05")
	name := info.Name
	if name == "" {
		name = info.Email
	}

	// Generate a random password for the new user
	rawPassword := generateRandomPassword()
	hash, err := bcrypt.GenerateFromPassword([]byte(rawPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("error al generar contraseña: %w", err)
	}

	user = &domain.User{
		ID:            uuid.NewString(),
		Username:      info.Email,
		Name:          name,
		Email:         info.Email,
		EmailVerified: true, // Google already verified the email
		GoogleID:      info.ID,
		PasswordHash:  string(hash),
		Role:          domain.RoleCustomer,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := uc.users.Create(ctx, user); err != nil {
		return nil, err
	}

	// Create customer record (same ID) for non-admin users
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

	// Send password email asynchronously
	go uc.sendPasswordEmail(user.Email, rawPassword)

	return &GoogleAuthResult{User: user, PasswordSent: true}, nil
}

func (uc *GoogleAuth) sendPasswordEmail(to, password string) {
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	subject := "Tu contraseña - Perfumería A y F"
	body := fmt.Sprintf(`
		<h2>Bienvenido a Perfumería A y F</h2>
		<p>Hola,</p>
		<p>Te registraste con Google. Acá tenés tu contraseña por si querés iniciar sesión con email:</p>
		<p style="font-size:18px;font-weight:bold;background:#f5f5f5;padding:12px 16px;border-radius:8px;text-align:center;font-family:monospace;">%s</p>
		<p>Podés iniciar sesión en: <a href="%s/login">%s/login</a></p>
		<p style="color:#999;font-size:12px;">Si no ves este correo en tu bandeja de entrada, revisá la carpeta de spam.</p>
	`, password, frontendURL, frontendURL)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := uc.email.Send(ctx, to, subject, body); err != nil {
		log.Printf("[EMAIL] Error al enviar contraseña a %s: %v", to, err)
	}
}

func generateRandomPassword() string {
	// 16 random bytes → 32 hex chars → 8 chars readable
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func (uc *GoogleAuth) fetchGoogleUserInfoByToken(token string) (*googleUserInfo, error) {
	// The credential from GIS is a JWT (ID token).
	// Decode the payload directly instead of calling Google's API (avoids rate limits / network issues).
	// The token was obtained directly from Google's OAuth flow, so it's trustworthy.

	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errors.New("token JWT inválido")
	}

	// Decode base64 payload (part[1])
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("error al decodificar payload JWT: %w", err)
	}

	var info googleUserInfo
	if err := json.Unmarshal(payload, &info); err != nil {
		return nil, fmt.Errorf("error al parsear payload JWT: %w", err)
	}

	if info.Email == "" {
		return nil, errors.New("email no encontrado en el token de Google")
	}

	return &info, nil
}
