package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/ayf/perfumeria/internal/adapters/http/handlers"
	authmw "github.com/ayf/perfumeria/internal/adapters/http/middleware"
)

func NewRouter(
	productH *handlers.ProductHandler,
	customerH *handlers.CustomerHandler,
	saleH *handlers.SaleHandler,
	stockH *handlers.StockHandler,
	reportH *handlers.ReportHandler,
	categoryH *handlers.CategoryHandler,
	storeH *handlers.StoreHandler,
	authH *handlers.AuthHandler,
	testimonialH *handlers.TestimonialHandler,
	allowedOrigin string,
) http.Handler {
	if allowedOrigin == "" {
		allowedOrigin = "*"
	}

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(corsMiddleware(allowedOrigin))
	r.Use(coopMiddleware)

	authLimiter := authmw.NewRateLimiter(5, 1*time.Minute)

	r.Route("/api", func(r chi.Router) {
		// Public auth endpoints (no auth required) — rate limited
		r.Group(func(r chi.Router) {
			r.Use(authLimiter.Middleware)
			r.Post("/auth/login", authH.Login)
			r.Post("/auth/register", authH.Register)
			r.Post("/auth/forgot-password", authH.ForgotPassword)
		})

		r.Post("/auth/google", authH.GoogleAuth)
		r.Post("/auth/refresh", authH.Refresh)
		r.Get("/auth/verify-email", authH.VerifyEmail)
		r.Post("/auth/reset-password", authH.ResetPassword)

		// Authenticated user endpoints
		r.Group(func(r chi.Router) {
			r.Use(authmw.AuthMiddleware(handlers.JWTSecret()))

			r.Get("/auth/me", authH.Me)
			r.Patch("/auth/profile", authH.UpdateProfile)
			r.Post("/store/checkout", storeH.Checkout)
			r.Get("/store/orders", storeH.MyOrders)
		})

		// Admin-only routes
		r.Group(func(r chi.Router) {
			r.Use(authmw.AuthMiddleware(handlers.JWTSecret()))
			r.Use(authmw.AdminMiddleware)

			r.Post("/upload", handlers.UploadImage)
			r.Mount("/products", productH.Routes())
			r.Mount("/customers", customerH.Routes())
			r.Mount("/sales", saleH.Routes())
			r.Mount("/stock", stockH.Routes())
			r.Mount("/reports", reportH.Routes())
			r.Mount("/categories", categoryH.Routes())

			r.Get("/admin/users", authH.ListUsers)
			r.Get("/admin/users/all", authH.ListAllUsers)
			r.Get("/admin/admins", authH.ListAdmins)
			r.Post("/admin/users", authH.CreateAdmin)
			r.Post("/admin/users/{id}/promote", authH.PromoteToAdmin)
			r.Put("/admin/users/{id}/password", authH.ChangePassword)
			r.Post("/admin/users/{id}/toggle-block", authH.ToggleBlock)
			r.Delete("/admin/users/{id}", authH.DeleteUser)
		})

		r.Mount("/store", storeH.Routes())
		r.Get("/testimonials", testimonialH.ListActive)

		// Admin-only testimonial management
		r.Group(func(r chi.Router) {
			r.Use(authmw.AuthMiddleware(handlers.JWTSecret()))
			r.Use(authmw.AdminMiddleware)
			r.Mount("/admin/testimonials", testimonialH.AdminRoutes())
		})
	})

	return r
}

func corsMiddleware(origin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func coopMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin-allow-popups")
		w.Header().Set("Cross-Origin-Embedder-Policy", "unsafe-none")
		next.ServeHTTP(w, r)
	})
}
