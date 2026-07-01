package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/ayf/perfumeria/internal/adapters/http/middleware"
	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/application/usecase/products"
	"github.com/ayf/perfumeria/internal/application/usecase/categories"
	"github.com/ayf/perfumeria/internal/application/usecase/sales"
	"github.com/ayf/perfumeria/internal/domain"
)

type StoreHandler struct {
	searchProducts    *products.SearchProducts
	listCategories    *categories.ListCategories
	registerSale      *sales.RegisterSale
	querySales        *sales.QuerySales
	emailSender       ports.EmailSender
	notificationEmail string
}

func NewStoreHandler(sp *products.SearchProducts, lc *categories.ListCategories, rs *sales.RegisterSale, qs *sales.QuerySales, es ports.EmailSender, notificationEmail string) *StoreHandler {
	return &StoreHandler{searchProducts: sp, listCategories: lc, registerSale: rs, querySales: qs, emailSender: es, notificationEmail: notificationEmail}
}

func (h *StoreHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/products", h.Products)
	r.Get("/categories", h.Categories)
	return r
}

type checkoutLineInput struct {
	ProductID   string `json:"product_id"`
	ProductName string `json:"product_name"`
	Quantity    int    `json:"quantity"`
	UnitPrice   int64  `json:"unit_price"`
}

type checkoutInput struct {
	Lines []checkoutLineInput `json:"lines"`
}

func (h *StoreHandler) Checkout(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "no autorizado")
		return
	}

	var input checkoutInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	if len(input.Lines) == 0 {
		respondError(w, http.StatusBadRequest, "carrito vacío")
		return
	}

	saleLines := make([]sales.SaleLineInput, len(input.Lines))
	var total int64
	for i, l := range input.Lines {
		price, err := domain.NewMoney(l.UnitPrice)
		if err != nil {
			respondError(w, http.StatusBadRequest, "precio inválido")
			return
		}
		saleLines[i] = sales.SaleLineInput{
			ProductID:   l.ProductID,
			ProductName: l.ProductName,
			Quantity:    l.Quantity,
			UnitPrice:   price,
			Discount:    domain.Money{}, // sin descuento en checkout de tienda
		}
		lineTotal := price.Mul(l.Quantity)
		total += lineTotal.Cents()
	}

	customerID := userID // user_id == customer_id

	_, err := h.registerSale.Execute(r.Context(), sales.RegisterSaleInput{
		Lines:      saleLines,
		CustomerID: &customerID,
		Payments: []sales.PaymentInput{
			{Method: "whatsapp", Amount: total},
		},
	})
	if err != nil {
		respondError(w, statusFromDomain(err), err.Error())
		return
	}

	// Enviar notificación por email al administrador
	if h.emailSender != nil && h.notificationEmail != "" {
		customerName, _ := r.Context().Value(middleware.NameKey).(string)
		subject := fmt.Sprintf("Nuevo pedido recibido — %s", customerName)
		body := buildOrderEmail(customerName, input.Lines)
		if err := h.emailSender.Send(r.Context(), h.notificationEmail, subject, body); err != nil {
			// logueamos pero no fallamos la respuesta
			fmt.Printf("error enviando email de notificación: %v\n", err)
		}
	}

	respondJSON(w, http.StatusCreated, map[string]string{"status": "ok"})

}

func buildOrderEmail(customerName string, lines []checkoutLineInput) string {
	items := ""
	for _, l := range lines {
		price := float64(l.UnitPrice) / 100
		subtotal := price * float64(l.Quantity)
		items += fmt.Sprintf("<tr><td style='padding:8px;border-bottom:1px solid #eee'>%s</td><td style='padding:8px;border-bottom:1px solid #eee'>x%d</td><td style='padding:8px;border-bottom:1px solid #eee'>₡%.0f</td><td style='padding:8px;border-bottom:1px solid #eee;text-align:right'>₡%.0f</td></tr>",
			l.ProductName, l.Quantity, price, subtotal)
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;padding:24px;background:#f9f9f9">
<div style="max-width:560px;margin:auto;background:white;border-radius:12px;padding:32px">
<h2 style="margin:0 0 8px;color:#1a1a2e">Nuevo pedido 🎉</h2>
<p style="color:#666;margin:0 0 24px">Recibiste un pedido de <strong>%s</strong></p>
<table style="width:100%%;border-collapse:collapse;font-size:14px">
<thead><tr style="background:#f3f4f6"><th style="padding:8px;text-align:left">Producto</th><th style="padding:8px;text-align:left">Cant</th><th style="padding:8px;text-align:left">Precio</th><th style="padding:8px;text-align:right">Subtotal</th></tr></thead>
<tbody>%s</tbody>
</table>
<p style="margin-top:24px;padding-top:16px;border-top:2px solid #f3f4f6;font-size:13px;color:#999">
Este pedido se registró con método de pago <strong>WhatsApp</strong>. Contactá al cliente para coordinar pago y entrega.
</p>
</div>
</body>
</html>`, customerName, items)
}

func (h *StoreHandler) MyOrders(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)
	if userID == "" {
		respondError(w, http.StatusUnauthorized, "no autorizado")
		return
	}

	// user_id == customer_id
	salesList, err := h.querySales.Execute(r.Context(), sales.QuerySalesInput{
		CustomerID: userID,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := make([]SaleResponse, len(salesList))
	for i, s := range salesList {
		resp[i] = saleToResponse(s)
	}
	respondJSON(w, http.StatusOK, resp)
}

func (h *StoreHandler) Products(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category_id")
	gender := r.URL.Query().Get("gender")

	products, err := h.searchProducts.Execute(r.Context(), products.SearchProductsInput{
		Category: category,
		Gender:   gender,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := make([]ProductResponse, 0, len(products))
	for _, p := range products {
		if p.Active && p.ShowInStore {
			resp = append(resp, productToResponse(p))
		}
	}
	respondJSON(w, http.StatusOK, resp)
}

func (h *StoreHandler) Categories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.listCategories.Execute(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := make([]CategoryResponse, len(categories))
	for i, c := range categories {
		resp[i] = categoryToResponse(c)
	}
	respondJSON(w, http.StatusOK, resp)
}
