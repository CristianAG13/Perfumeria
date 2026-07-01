package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/ayf/perfumeria/internal/domain"
	"github.com/ayf/perfumeria/internal/application/usecase/products"
)

type ProductHandler struct {
	create     *products.CreateProduct
	update     *products.UpdateProduct
	deactivate *products.DeactivateProduct
	search     *products.SearchProducts
}

func NewProductHandler(c *products.CreateProduct, u *products.UpdateProduct, d *products.DeactivateProduct, s *products.SearchProducts) *ProductHandler {
	return &ProductHandler{create: c, update: u, deactivate: d, search: s}
}

func (h *ProductHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.Create)
	r.Get("/", h.Search)
	r.Patch("/{id}", h.Update)
	r.Delete("/{id}", h.Deactivate)
	return r
}

func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name            string `json:"name"`
		Brand           string `json:"brand"`
		CategoryID      string `json:"category_id"`
		CategoryName    string `json:"category"`
		Barcode         string `json:"barcode"`
		Image           string `json:"image"`
		Description     string `json:"description"`
		Gender          string `json:"gender"`
		DiscountPercent int    `json:"discount_percent"`
		SalePrice       int64  `json:"sale_price"`
		CostPrice       int64  `json:"cost_price"`
		MinStock        int    `json:"min_stock"`
		ShowInStore     *bool  `json:"show_in_store"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	salePrice, err := domain.NewMoney(input.SalePrice)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid sale price")
		return
	}
	costPrice, err := domain.NewMoney(input.CostPrice)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid cost price")
		return
	}

	product, err := h.create.Execute(r.Context(), products.CreateProductInput{
		Name:            input.Name,
		Brand:           input.Brand,
		CategoryID:      input.CategoryID,
		CategoryName:    input.CategoryName,
		Barcode:         input.Barcode,
		Image:           input.Image,
		Description:     input.Description,
		Gender:          input.Gender,
		DiscountPercent: input.DiscountPercent,
		SalePrice:       salePrice,
		CostPrice:       costPrice,
		MinStock:        input.MinStock,
		ShowInStore:     input.ShowInStore,
	})
	if err != nil {
		respondError(w, statusFromDomain(err), err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, productToResponse(product))
}

func (h *ProductHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var input struct {
		Name            string `json:"name"`
		Brand           string `json:"brand"`
		CategoryID      string `json:"category_id"`
		CategoryName    string `json:"category"`
		Image           string `json:"image"`
		Description     string `json:"description"`
		Gender          string `json:"gender"`
		DiscountPercent int    `json:"discount_percent"`
		SalePrice       int64  `json:"sale_price"`
		CostPrice       int64  `json:"cost_price"`
		MinStock        int    `json:"min_stock"`
		ShowInStore     *bool  `json:"show_in_store"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	salePrice, err := domain.NewMoney(input.SalePrice)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid sale price")
		return
	}
	costPrice, err := domain.NewMoney(input.CostPrice)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid cost price")
		return
	}

	product, err := h.update.Execute(r.Context(), products.UpdateProductInput{
		ProductID:       id,
		Name:            input.Name,
		Brand:           input.Brand,
		CategoryID:      input.CategoryID,
		CategoryName:    input.CategoryName,
		Image:           input.Image,
		Description:     input.Description,
		Gender:          input.Gender,
		DiscountPercent: input.DiscountPercent,
		SalePrice:       salePrice,
		CostPrice:       costPrice,
		MinStock:        input.MinStock,
		ShowInStore:     input.ShowInStore,
	})
	if err != nil {
		respondError(w, statusFromDomain(err), err.Error())
		return
	}

	respondJSON(w, http.StatusOK, productToResponse(product))
}

func (h *ProductHandler) Deactivate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.deactivate.Execute(r.Context(), id); err != nil {
		respondError(w, statusFromDomain(err), err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ProductHandler) Search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	category := r.URL.Query().Get("category_id")
	gender := r.URL.Query().Get("gender")

	products, err := h.search.Execute(r.Context(), products.SearchProductsInput{
		Query:    q,
		Category: category,
		Gender:   gender,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := make([]ProductResponse, len(products))
	for i, p := range products {
		resp[i] = productToResponse(p)
	}
	respondJSON(w, http.StatusOK, resp)
}
