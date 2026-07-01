package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/ayf/perfumeria/internal/application/usecase/reporting"
)

type ReportHandler struct {
	dailySales *reporting.DailySales
	topProducts *reporting.TopProducts
	lowStock    *reporting.LowStock
}

func NewReportHandler(d *reporting.DailySales, t *reporting.TopProducts, l *reporting.LowStock) *ReportHandler {
	return &ReportHandler{dailySales: d, topProducts: t, lowStock: l}
}

func (h *ReportHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/daily", h.DailySales)
	r.Get("/top-products", h.TopProducts)
	r.Get("/low-stock", h.LowStock)
	return r
}

type DailyReportResponse struct {
	Date              string           `json:"date"`
	TotalAmount       int64            `json:"total_amount"`
	SalesCount        int              `json:"sales_count"`
	PaymentBreakdown  map[string]int64 `json:"payment_breakdown"`
}

func (h *ReportHandler) DailySales(w http.ResponseWriter, r *http.Request) {
	dateStr := r.URL.Query().Get("date")
	date := time.Now()

	if dateStr != "" {
		if t, err := time.Parse("2006-01-02", dateStr); err == nil {
			date = t
		}
	}

	report, err := h.dailySales.Execute(r.Context(), date)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	pb := make(map[string]int64, len(report.PaymentBreakdown))
	for method, cents := range report.PaymentBreakdown {
		pb[method] = cents
	}

	resp := DailyReportResponse{
		Date:             report.Date,
		TotalAmount:      report.TotalAmount,
		SalesCount:       report.SalesCount,
		PaymentBreakdown: pb,
	}

	respondJSON(w, http.StatusOK, resp)
}

func (h *ReportHandler) TopProducts(w http.ResponseWriter, r *http.Request) {
	fromStr := r.URL.Query().Get("from")
	toStr := r.URL.Query().Get("to")
	limitStr := r.URL.Query().Get("limit")

	from := time.Now().Add(-7 * 24 * time.Hour)
	to := time.Now()
	limit := 10

	if fromStr != "" {
		if t, err := time.Parse("2006-01-02", fromStr); err == nil {
			from = t
		}
	}
	if toStr != "" {
		if t, err := time.Parse("2006-01-02", toStr); err == nil {
			to = t.Add(24*time.Hour - time.Second)
		}
	}
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	items, err := h.topProducts.Execute(r.Context(), from, to, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	type TopProduct struct {
		ProductID    string `json:"product_id"`
		ProductName  string `json:"product_name"`
		TotalQty     int    `json:"total_qty"`
		TotalRevenue int64  `json:"total_revenue"`
	}

	resp := make([]TopProduct, len(items))
	for i, item := range items {
		resp[i] = TopProduct{
			ProductID:    item.ProductID,
			ProductName:  item.ProductName,
			TotalQty:     item.TotalQty,
			TotalRevenue: item.TotalRevenue,
		}
	}
	respondJSON(w, http.StatusOK, resp)
}

func (h *ReportHandler) LowStock(w http.ResponseWriter, r *http.Request) {
	items, err := h.lowStock.Execute(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := make(map[string]any)
	products := make([]map[string]any, len(items))
	for i, item := range items {
		products[i] = map[string]any{
			"id":            item.Product.ID,
			"name":          item.Product.Name,
			"current_stock": item.CurrentStock,
			"min_stock":     item.MinimumStock,
			"deficit":       item.Deficit,
		}
	}
	resp["products"] = products
	resp["count"] = len(products)

	respondJSON(w, http.StatusOK, resp)
}
