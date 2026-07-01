package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/ayf/perfumeria/internal/application/usecase/auth"
	"github.com/ayf/perfumeria/internal/domain"
)

type AuthHandler struct {
	login         *auth.Login
	register      *auth.Register
	googleAuth    *auth.GoogleAuth
	verify        *auth.VerifyEmail
	forgotPass    *auth.ForgotPassword
	resetPass     *auth.ResetPassword
	adminUsers    *auth.AdminUsers
}

func NewAuthHandler(
	login *auth.Login,
	register *auth.Register,
	googleAuth *auth.GoogleAuth,
	verify *auth.VerifyEmail,
	forgotPass *auth.ForgotPassword,
	resetPass *auth.ResetPassword,
	adminUsers *auth.AdminUsers,
) *AuthHandler {
	return &AuthHandler{
		login:         login,
		register:      register,
		googleAuth:    googleAuth,
		verify:        verify,
		forgotPass:    forgotPass,
		resetPass:     resetPass,
		adminUsers:    adminUsers,
	}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	user, err := h.login.Execute(r.Context(), auth.LoginInput{
		Username: input.Username,
		Password: input.Password,
	})
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	writeTokenResponse(w, user)
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
		LastName string `json:"last_name"`
		Phone    string `json:"phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	user, err := h.register.Execute(r.Context(), auth.RegisterInput{
		Email:    input.Email,
		Password: input.Password,
		Name:     input.Name,
		LastName: input.LastName,
		Phone:    input.Phone,
	})
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeTokenResponse(w, user)
}

func (h *AuthHandler) GoogleAuth(w http.ResponseWriter, r *http.Request) {
	var input struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	result, err := h.googleAuth.Execute(r.Context(), auth.GoogleAuthInput{
		AccessToken: input.AccessToken,
	})
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	user := result.User

	accessToken := buildAccessToken(user)
	refreshToken := buildRefreshToken(user)

	respondJSON(w, http.StatusOK, map[string]any{
		"token":         accessToken,
		"refresh_token": refreshToken,
		"user":          userToResponse(user),
		"password_sent": result.PasswordSent,
	})
}

func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if err := h.verify.Execute(r.Context(), auth.VerifyEmailInput{Token: token}); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "email verificado correctamente"})
}

// --- Password reset ---

func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	_ = h.forgotPass.Execute(r.Context(), auth.ForgotPasswordInput{Email: input.Email})
	// Always return success to not reveal if email exists
	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Si el email está registrado, recibirás un enlace para restablecer tu contraseña",
	})
}

func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if err := h.resetPass.Execute(r.Context(), auth.ResetPasswordInput{
		Token:       input.Token,
		NewPassword: input.NewPassword,
	}); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Contraseña actualizada correctamente"})
}

// --- Admin endpoints ---

func (h *AuthHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.adminUsers.ListUsers(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, usersToResponse(users))
}

func (h *AuthHandler) ListAdmins(w http.ResponseWriter, r *http.Request) {
	users, err := h.adminUsers.ListAdmins(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, usersToResponse(users))
}

func (h *AuthHandler) CreateAdmin(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	user, err := h.adminUsers.CreateAdmin(r.Context(), auth.CreateAdminInput{
		Email:    input.Email,
		Password: input.Password,
		Name:     input.Name,
	})
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, userToResponse(user))
}

func (h *AuthHandler) PromoteToAdmin(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "id")
	if userID == "" {
		respondError(w, http.StatusBadRequest, "ID de usuario requerido")
		return
	}

	if err := h.adminUsers.PromoteToAdmin(r.Context(), userID); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "usuario promovido a admin"})
}

func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "id")
	if userID == "" {
		respondError(w, http.StatusBadRequest, "ID de usuario requerido")
		return
	}
	var input struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	if err := h.adminUsers.ChangePassword(r.Context(), userID, input.Password); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "contraseña actualizada"})
}

func (h *AuthHandler) ToggleBlock(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "id")
	if userID == "" {
		respondError(w, http.StatusBadRequest, "ID de usuario requerido")
		return
	}
	user, err := h.adminUsers.ToggleBlock(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, userToResponse(user))
}

func (h *AuthHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "id")
	if userID == "" {
		respondError(w, http.StatusBadRequest, "ID de usuario requerido")
		return
	}
	if err := h.adminUsers.DeleteUser(r.Context(), userID); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Usuario eliminado"})
}

func (h *AuthHandler) ListAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.adminUsers.ListAll(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, usersToResponse(users))
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value("user_id").(string)
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "no autorizado")
		return
	}

	// Fetch full user from DB to get all fields
	user, err := h.login.GetUserByID(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error al obtener usuario")
		return
	}

	respondJSON(w, http.StatusOK, userToResponse(user))
}

func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value("user_id").(string)
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "no autorizado")
		return
	}

	var input struct {
		Name     string `json:"name"`
		LastName string `json:"last_name"`
		Phone    string `json:"phone"`
		Email    string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if input.Name == "" || input.LastName == "" || input.Phone == "" || input.Email == "" {
		respondError(w, http.StatusBadRequest, "todos los campos son requeridos: nombre, apellido, teléfono, email")
		return
	}

	// Update customer record (profile data is for the customer)
	if err := h.login.UpdateCustomerProfile(r.Context(), userID, input.Name, input.LastName, input.Phone, input.Email); err != nil {
		respondError(w, http.StatusInternalServerError, "error al guardar perfil")
		return
	}

	// Also update user so profile_complete works (lastName + phone)
	user, err := h.login.GetUserByID(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusNotFound, "usuario no encontrado")
		return
	}
	user.Name = input.Name
	user.LastName = input.LastName
	user.Phone = input.Phone
	user.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
	_ = h.login.UpdateProfile(r.Context(), user)

	writeTokenResponse(w, user)
}

// --- Helpers ---

const accessTokenDuration = 30 * time.Minute
const refreshTokenDuration = 7 * 24 * time.Hour

func buildAccessToken(user *domain.User) string {
	return buildToken(user, JWTSecret(), accessTokenDuration)
}

func buildRefreshToken(user *domain.User) string {
	return buildToken(user, JWTSecret()+"-refresh", refreshTokenDuration)
}

func buildToken(user *domain.User, secret string, expiry time.Duration) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":   user.ID,
		"username":  user.Username,
		"name":      user.Name,
		"last_name": user.LastName,
		"email":     user.Email,
		"phone":     user.Phone,
		"role":      user.Role,
		"blocked":   user.Blocked,
		"exp":       time.Now().Add(expiry).Unix(),
	})
	s, _ := token.SignedString([]byte(secret))
	return s
}

func writeTokenResponse(w http.ResponseWriter, user *domain.User) {
	accessToken := buildAccessToken(user)
	refreshToken := buildRefreshToken(user)

	respondJSON(w, http.StatusOK, map[string]any{
		"token":         accessToken,
		"refresh_token": refreshToken,
		"user":          userToResponse(user),
	})
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var input struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if input.RefreshToken == "" {
		respondError(w, http.StatusBadRequest, "refresh_token es requerido")
		return
	}

	secret := JWTSecret() + "-refresh"
	token, err := jwt.Parse(input.RefreshToken, func(t *jwt.Token) (any, error) {
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		respondError(w, http.StatusUnauthorized, "refresh_token inválido o expirado")
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		respondError(w, http.StatusUnauthorized, "refresh_token inválido")
		return
	}

	userID, _ := claims["user_id"].(string)
	role, _ := claims["role"].(string)
	username, _ := claims["username"].(string)

	// Buscar usuario actualizado en DB para obtener datos frescos
	user, err := h.login.GetUserByID(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "usuario no encontrado")
		return
	}
	_ = role
	_ = username

	writeTokenResponse(w, user)
}

func userToResponse(u *domain.User) map[string]any {
	return map[string]any{
		"id":               u.ID,
		"username":         u.Username,
		"name":             u.Name,
		"last_name":        u.LastName,
		"email":            u.Email,
		"phone":            u.Phone,
		"role":             u.Role,
		"blocked":          u.Blocked,
		"email_verified":   u.EmailVerified,
		"profile_complete": u.ProfileComplete(),
	}
}

func usersToResponse(users []*domain.User) []map[string]any {
	resp := make([]map[string]any, 0, len(users))
	for _, u := range users {
		resp = append(resp, userToResponse(u))
	}
	return resp
}

func JWTSecret() string {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "perfumeria-dev-secret-key-2026"
	}
	return s
}
