package http

import (
	"io/fs"
	"log"
	"net/http"
	"os"
	"path"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/ayf/perfumeria/internal/adapters/http/handlers"
	"github.com/ayf/perfumeria/internal/adapters/email"
	sqliteadapter "github.com/ayf/perfumeria/internal/adapters/persistence/sqlite"
	auc "github.com/ayf/perfumeria/internal/application/usecase/auth"
	catuc "github.com/ayf/perfumeria/internal/application/usecase/categories"
	cuc "github.com/ayf/perfumeria/internal/application/usecase/customers"
	puc "github.com/ayf/perfumeria/internal/application/usecase/products"
	ruc "github.com/ayf/perfumeria/internal/application/usecase/reporting"
	suc "github.com/ayf/perfumeria/internal/application/usecase/sales"
	stuc "github.com/ayf/perfumeria/internal/application/usecase/stock"
	teuc "github.com/ayf/perfumeria/internal/application/usecase/testimonials"
)

// NewApp builds the complete HTTP handler with all dependencies wired.
// If frontendFS is nil, the SPA fallback is skipped (API-only mode).
func NewApp(db *sqliteadapter.DB, corsOrigin string, frontendFS fs.FS) http.Handler {
	// Repositorios
	productRepo := sqliteadapter.NewProductRepo(db)
	customerRepo := sqliteadapter.NewCustomerRepo(db)
	stockRepo := sqliteadapter.NewStockRepo(db)
	saleRepo := sqliteadapter.NewSaleRepo(db)
	categoryRepo := sqliteadapter.NewCategoryRepo(db)
	userRepo := sqliteadapter.NewUserRepo(db)
	testimonialRepo := sqliteadapter.NewTestimonialRepo(db)

	// Handlers
	productH := handlers.NewProductHandler(
		puc.NewCreateProduct(productRepo, stockRepo, db),
		puc.NewUpdateProduct(productRepo),
		puc.NewDeactivateProduct(productRepo),
		puc.NewSearchProducts(productRepo),
	)
	customerH := handlers.NewCustomerHandler(
		cuc.NewCreateCustomer(customerRepo),
		cuc.NewUpdateCustomer(customerRepo),
		cuc.NewSearchCustomers(customerRepo),
	)
	saleH := handlers.NewSaleHandler(
		suc.NewRegisterSale(productRepo, saleRepo, stockRepo, db),
		suc.NewCancelSale(saleRepo, stockRepo, db),
		suc.NewQuerySales(saleRepo),
	)
	stockH := handlers.NewStockHandler(
		stuc.NewRecordEntry(stockRepo),
		stuc.NewAdjustStock(stockRepo),
	)
	reportH := handlers.NewReportHandler(
		ruc.NewDailySales(saleRepo),
		ruc.NewTopProducts(saleRepo),
		ruc.NewLowStock(productRepo),
	)
	categoryH := handlers.NewCategoryHandler(
		catuc.NewCreateCategory(categoryRepo),
		catuc.NewListCategories(categoryRepo),
		catuc.NewUpdateCategory(categoryRepo),
	)
	notifEmail := os.Getenv("NOTIFICATION_EMAIL")
	if notifEmail == "" {
		notifEmail = os.Getenv("SMTP_USER")
	}
	storeH := handlers.NewStoreHandler(
		puc.NewSearchProducts(productRepo),
		catuc.NewListCategories(categoryRepo),
		suc.NewRegisterSale(productRepo, saleRepo, stockRepo, db),
		suc.NewQuerySales(saleRepo),
		email.NewSMTPSender(),
		notifEmail,
	)
	authH := handlers.NewAuthHandler(
		auc.NewLogin(userRepo, customerRepo),
		auc.NewRegister(userRepo, customerRepo, email.NewSMTPSender()),
		auc.NewGoogleAuth(userRepo, customerRepo, email.NewSMTPSender()),
		auc.NewVerifyEmail(userRepo),
		auc.NewForgotPassword(userRepo, email.NewSMTPSender()),
		auc.NewResetPassword(userRepo),
		auc.NewAdminUsers(userRepo, customerRepo),
	)
	testimonialH := handlers.NewTestimonialHandler(
		teuc.NewCreateTestimonial(testimonialRepo),
		teuc.NewListAllTestimonials(testimonialRepo),
		teuc.NewListActiveTestimonials(testimonialRepo),
		teuc.NewDeleteTestimonial(testimonialRepo),
	)

	apiHandler := NewRouter(
		productH, customerH, saleH, stockH, reportH, categoryH, storeH, authH, testimonialH, corsOrigin,
	)

	r := chi.NewRouter()
	r.Handle("/api/*", apiHandler)

	// Serve uploaded files from local filesystem (creado en runtime, no embebido)
	uploadFS := http.FileServer(http.Dir("./uploads"))
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", uploadFS))

	if frontendFS != nil {
		mountSPA(r, frontendFS)
	} else {
		log.Println("frontend no disponible (modo API solamente)")
	}

	return r
}

func mountSPA(r chi.Router, assets fs.FS) {
	fileServer := http.FileServer(http.FS(assets))
	r.Handle("/*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		clean := path.Clean(r.URL.Path)
		if strings.HasPrefix(clean, "/api") {
			http.NotFound(w, r)
			return
		}
		_, err := fs.Stat(assets, strings.TrimPrefix(clean, "/"))
		if err != nil {
			r.URL.Path = "/"
		}
		fileServer.ServeHTTP(w, r)
	}))
	log.Println("frontend embebido disponible")
}
