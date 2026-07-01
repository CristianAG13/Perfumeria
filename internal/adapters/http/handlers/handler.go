package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/ayf/perfumeria/internal/domain"
)

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

func statusFromDomain(err error) int {
	switch {
	case err == nil:
		return http.StatusOK
	case errors.Is(err, domain.ErrNotFound):
		return http.StatusNotFound
	case errors.Is(err, domain.ErrDuplicateBarcode):
		return http.StatusConflict
	case errors.Is(err, domain.ErrInsufficientStock):
		return http.StatusConflict
	case errors.Is(err, domain.ErrAlreadyCancelled):
		return http.StatusConflict
	case errors.Is(err, domain.ErrReasonRequired):
		return http.StatusBadRequest
	case errors.Is(err, domain.ErrInvalidInput):
		return http.StatusBadRequest
	default:
		return http.StatusInternalServerError
	}
}

type ProductResponse struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Brand           string `json:"brand"`
	CategoryID      string `json:"category_id"`
	Category        string `json:"category"`
	Barcode         string `json:"barcode"`
	Image           string `json:"image"`
	Description     string `json:"description"`
	Gender          string `json:"gender"`
	DiscountPercent int    `json:"discount_percent"`
	DiscountPrice   int64  `json:"discount_price"`
	SalePrice       int64  `json:"sale_price"`
	CostPrice       int64  `json:"cost_price"`
	MinStock        int    `json:"min_stock"`
	CurrentStock    int    `json:"current_stock"`
	Active          bool   `json:"active"`
	ShowInStore     bool   `json:"show_in_store"`
	PriceBelowCost  bool   `json:"price_below_cost"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
}

type CategoryResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Image       string `json:"image"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type CustomerResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type PaymentResponse struct {
	Method string `json:"method"`
	Amount int64  `json:"amount"`
}

type SaleLineResponse struct {
	ProductID   string `json:"product_id"`
	ProductName string `json:"product_name"`
	Quantity    int    `json:"quantity"`
	UnitPrice   int64  `json:"unit_price"`
	Discount    int64  `json:"discount"`
	Subtotal    int64  `json:"subtotal"`
}

type SaleResponse struct {
	ID            string             `json:"id"`
	CustomerID    *string            `json:"customer_id"`
	Total         int64              `json:"total"`
	Payments      []PaymentResponse  `json:"payments"`
	Status        string             `json:"status"`
	CancelReason  string             `json:"cancel_reason"`
	Lines         []SaleLineResponse `json:"lines"`
	CreatedAt     string             `json:"created_at"`
}

func productToResponse(p *domain.Product) ProductResponse {
	return ProductResponse{
		ID:              p.ID,
		Name:            p.Name,
		Brand:           p.Brand,
		CategoryID:      p.CategoryID,
		Category:        p.CategoryName,
		Barcode:         p.Barcode,
		Image:           p.Image,
		Description:     p.Description,
		Gender:          p.Gender,
		DiscountPercent: p.DiscountPercent,
		DiscountPrice:   p.DiscountedPrice().Cents(),
		SalePrice:       p.SalePrice.Cents(),
		CostPrice:       p.CostPrice.Cents(),
		MinStock:        p.MinStock,
		CurrentStock:    p.CurrentStock,
		Active:          p.Active,
		ShowInStore:     p.ShowInStore,
		PriceBelowCost:  p.PriceBelowCost,
		CreatedAt:       p.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:       p.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

func customerToResponse(c *domain.Customer) CustomerResponse {
	return CustomerResponse{
		ID:        c.ID,
		Name:      c.Name,
		LastName:  c.LastName,
		Phone:     c.Phone,
		Email:     c.Email,
		CreatedAt: c.CreatedAt,
		UpdatedAt: c.UpdatedAt,
	}
}

func saleToResponse(s *domain.Sale) SaleResponse {
	payments := make([]PaymentResponse, len(s.PaymentLines))
	for i, pm := range s.PaymentLines {
		payments[i] = PaymentResponse{
			Method: pm.Method,
			Amount: pm.Amount,
		}
	}

	r := SaleResponse{
		ID:           s.ID,
		CustomerID:   s.CustomerID,
		Total:        s.Total.Cents(),
		Payments:     payments,
		Status:       string(s.Status),
		CancelReason: s.CancelReason,
		Lines:        make([]SaleLineResponse, len(s.Lines)),
		CreatedAt:    s.CreatedAt.Format("2006-01-02 15:04:05"),
	}
	for i, l := range s.Lines {
		r.Lines[i] = SaleLineResponse{
			ProductID:   l.ProductID,
			ProductName: l.ProductName,
			Quantity:    l.Quantity,
			UnitPrice:   l.UnitPrice.Cents(),
			Discount:    l.Discount.Cents(),
			Subtotal:    l.Subtotal.Cents(),
		}
	}
	return r
}

func categoryToResponse(c *domain.Category) CategoryResponse {
	return CategoryResponse{
		ID:          c.ID,
		Name:        c.Name,
		Image:       c.Image,
		Description: c.Description,
		CreatedAt:   c.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:   c.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}
