package ports

import (
	"context"
	"time"
	"github.com/ayf/perfumeria/internal/domain"
)

type SearchProductsQuery struct {
	Query           string
	Category        string
	Gender          string
	OnlyShowInStore bool
	Limit           int
	Offset          int
}

type LowStockItem struct {
	Product      domain.Product
	CurrentStock int
	MinimumStock int
	Deficit      int
}

type ProductRepository interface {
	Save(ctx context.Context, p *domain.Product) error
	FindByID(ctx context.Context, id string) (*domain.Product, error)
	FindByBarcode(ctx context.Context, barcode string) (*domain.Product, error)
	Search(ctx context.Context, q SearchProductsQuery) ([]*domain.Product, error)
	ListByCategory(ctx context.Context, categoryID string) ([]*domain.Product, error)
	ListBelowMinimum(ctx context.Context) ([]LowStockItem, error)
}

type CategoryRepository interface {
	Save(ctx context.Context, c *domain.Category) error
	FindByID(ctx context.Context, id string) (*domain.Category, error)
	ListAll(ctx context.Context) ([]*domain.Category, error)
}

type CustomerRepository interface {
	Save(ctx context.Context, c *domain.Customer) error
	FindByID(ctx context.Context, id string) (*domain.Customer, error)
	Search(ctx context.Context, query string) ([]*domain.Customer, error)
	Delete(ctx context.Context, id string) error
}

type StockRepository interface {
	Append(ctx context.Context, m *domain.StockMovement) error
	AppendBatch(ctx context.Context, movements []*domain.StockMovement) error
	CurrentStock(ctx context.Context, productID string) (int, error)
	ListBelowMinimum(ctx context.Context) ([]LowStockItem, error)
	FindByProduct(ctx context.Context, productID string, limit, offset int) ([]*domain.StockMovement, error)
}

type TopProductItem struct {
	ProductID    string
	ProductName  string
	TotalQty     int
	TotalRevenue int64
}

type SaleRepository interface {
	Save(ctx context.Context, s *domain.Sale, movements []*domain.StockMovement) error
	FindByID(ctx context.Context, id string) (*domain.Sale, error)
	FindByCustomer(ctx context.Context, customerID string, from, to time.Time) ([]*domain.Sale, error)
	FindByDateRange(ctx context.Context, from, to time.Time) ([]*domain.Sale, error)
	Cancel(ctx context.Context, saleID string, reason string, movements []*domain.StockMovement) error
	DailyReport(ctx context.Context, date time.Time) (*DailyReportResult, error)
	TopProducts(ctx context.Context, from, to time.Time, limit int) ([]TopProductItem, error)
}

type UserRepository interface {
	FindByUsername(ctx context.Context, username string) (*domain.User, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByGoogleID(ctx context.Context, googleID string) (*domain.User, error)
	Create(ctx context.Context, user *domain.User) error
	Update(ctx context.Context, user *domain.User) error
	Delete(ctx context.Context, id string) error
	FindByID(ctx context.Context, id string) (*domain.User, error)
	ListByRole(ctx context.Context, role string) ([]*domain.User, error)
	ListAll(ctx context.Context) ([]*domain.User, error)
}

type TestimonialRepository interface {
	Save(ctx context.Context, t *domain.Testimonial) error
	FindByID(ctx context.Context, id string) (*domain.Testimonial, error)
	ListActive(ctx context.Context) ([]*domain.Testimonial, error)
	ListAll(ctx context.Context) ([]*domain.Testimonial, error)
	Delete(ctx context.Context, id string) error
}

type DailyReportResult struct {
	Date          string
	TotalAmount   int64
	SalesCount    int
	PaymentBreakdown map[string]int64
}
