package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/ayf/perfumeria/internal/domain"
	"github.com/ayf/perfumeria/internal/application/usecase/sales"
)

type SaleHandler struct {
	register *sales.RegisterSale
	cancel   *sales.CancelSale
	query    *sales.QuerySales
}

func NewSaleHandler(reg *sales.RegisterSale, can *sales.CancelSale, q *sales.QuerySales) *SaleHandler {
	return &SaleHandler{register: reg, cancel: can, query: q}
}

func (h *SaleHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.Register)
	r.Get("/", h.Query)
	r.Post("/{id}/cancel", h.Cancel)
	return r
}

func (h *SaleHandler) Register(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Lines []struct {
			ProductID   string `json:"product_id"`
			ProductName string `json:"product_name"`
			Quantity    int    `json:"quantity"`
			UnitPrice   int64  `json:"unit_price"`
			Discount    int64  `json:"discount"`
		} `json:"lines"`
		CustomerID *string `json:"customer_id"`
		Payments   []struct {
			Method string `json:"method"`
			Amount int64  `json:"amount"`
		} `json:"payments"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	if len(input.Payments) == 0 {
		respondError(w, http.StatusBadRequest, "at least one payment is required")
		return
	}

	domainLines := make([]sales.SaleLineInput, len(input.Lines))
	for i, l := range input.Lines {
		unitPrice, err := domain.NewMoney(l.UnitPrice)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid unit price")
			return
		}
		discount, err := domain.NewMoney(l.Discount)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid discount")
			return
		}
		domainLines[i] = sales.SaleLineInput{
			ProductID:   l.ProductID,
			ProductName: l.ProductName,
			Quantity:    l.Quantity,
			UnitPrice:   unitPrice,
			Discount:    discount,
		}
	}

	payments := make([]sales.PaymentInput, len(input.Payments))
	for i, pm := range input.Payments {
		payments[i] = sales.PaymentInput{
			Method: pm.Method,
			Amount: pm.Amount,
		}
	}

	sale, err := h.register.Execute(r.Context(), sales.RegisterSaleInput{
		Lines:      domainLines,
		CustomerID: input.CustomerID,
		Payments:   payments,
	})
	if err != nil {
		respondError(w, statusFromDomain(err), err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, saleToResponse(sale))
}

func (h *SaleHandler) Query(w http.ResponseWriter, r *http.Request) {
	fromStr := r.URL.Query().Get("from")
	toStr := r.URL.Query().Get("to")
	customerID := r.URL.Query().Get("customer")

	from := time.Now().Add(-24 * time.Hour)
	to := time.Now()

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

	sales, err := h.query.Execute(r.Context(), sales.QuerySalesInput{
		From:       from,
		To:         to,
		CustomerID: customerID,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := make([]SaleResponse, len(sales))
	for i, s := range sales {
		resp[i] = saleToResponse(s)
	}
	respondJSON(w, http.StatusOK, resp)
}

func (h *SaleHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var input struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	sale, err := h.cancel.Execute(r.Context(), sales.CancelSaleInput{
		SaleID: id,
		Reason: input.Reason,
	})
	if err != nil {
		respondError(w, statusFromDomain(err), err.Error())
		return
	}

	respondJSON(w, http.StatusOK, saleToResponse(sale))
}
