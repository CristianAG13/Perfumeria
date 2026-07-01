package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/ayf/perfumeria/internal/domain"
)

const (
	UserIDKey   = "user_id"
	UsernameKey = "username"
	NameKey     = "name"
	LastNameKey = "last_name"
	PhoneKey    = "phone"
	RoleKey     = "role"
	EmailKey    = "email"
)

func AuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
				http.Error(w, `{"error":"no autorizado"}`, http.StatusUnauthorized)
				return
			}

			tokenStr := strings.TrimPrefix(auth, "Bearer ")
			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
				return []byte(jwtSecret), nil
			})
			if err != nil || !token.Valid {
				http.Error(w, `{"error":"token inválido"}`, http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				http.Error(w, `{"error":"token inválido"}`, http.StatusUnauthorized)
				return
			}

			ctx := r.Context()
			ctx = context.WithValue(ctx, UserIDKey, claims["user_id"])
			ctx = context.WithValue(ctx, UsernameKey, claims["username"])
			ctx = context.WithValue(ctx, NameKey, claims["name"])
			ctx = context.WithValue(ctx, LastNameKey, claims["last_name"])
			ctx = context.WithValue(ctx, PhoneKey, claims["phone"])
			ctx = context.WithValue(ctx, RoleKey, claims["role"])
			ctx = context.WithValue(ctx, EmailKey, claims["email"])
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// AdminMiddleware checks that the authenticated user has admin role.
func AdminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role, _ := r.Context().Value(RoleKey).(string)
		if role != domain.RoleAdmin {
			http.Error(w, `{"error":"se requiere rol de administrador"}`, http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// OptionalAuthMiddleware extracts user info from token if present, but doesn't fail if missing.
// Used for endpoints that optionally need user context.
func OptionalAuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
				next.ServeHTTP(w, r)
				return
			}

			tokenStr := strings.TrimPrefix(auth, "Bearer ")
			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
				return []byte(jwtSecret), nil
			})
			if err != nil || !token.Valid {
				next.ServeHTTP(w, r)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				next.ServeHTTP(w, r)
				return
			}

			ctx := r.Context()
			ctx = context.WithValue(ctx, UserIDKey, claims["user_id"])
			ctx = context.WithValue(ctx, UsernameKey, claims["username"])
			ctx = context.WithValue(ctx, NameKey, claims["name"])
			ctx = context.WithValue(ctx, LastNameKey, claims["last_name"])
			ctx = context.WithValue(ctx, PhoneKey, claims["phone"])
			ctx = context.WithValue(ctx, RoleKey, claims["role"])
			ctx = context.WithValue(ctx, EmailKey, claims["email"])
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
