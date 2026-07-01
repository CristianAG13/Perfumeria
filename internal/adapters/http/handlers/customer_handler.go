package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/ayf/perfumeria/internal/application/usecase/customers"
)

type CustomerHandler struct {
	create *customers.CreateCustomer
	update *customers.UpdateCustomer
	search *customers.SearchCustomers
}

func NewCustomerHandler(c *customers.CreateCustomer, u *customers.UpdateCustomer, s *customers.SearchCustomers) *CustomerHandler {
	return &CustomerHandler{create: c, update: u, search: s}
}

func (h *CustomerHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.Create)
	r.Get("/", h.Search)
	r.Patch("/{id}", h.Update)
	return r
}

func (h *CustomerHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name     string `json:"name"`
		LastName string `json:"last_name"`
		Phone    string `json:"phone"`
		Email    string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	customer, err := h.create.Execute(r.Context(), customers.CreateCustomerInput{
		Name:     input.Name,
		LastName: input.LastName,
		Phone:    input.Phone,
		Email:    input.Email,
	})
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, customerToResponse(customer))
}

func (h *CustomerHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var input struct {
		Name     string `json:"name"`
		LastName string `json:"last_name"`
		Phone    string `json:"phone"`
		Email    string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	customer, err := h.update.Execute(r.Context(), customers.UpdateCustomerInput{
		CustomerID: id,
		Name:       input.Name,
		LastName:   input.LastName,
		Phone:      input.Phone,
		Email:      input.Email,
	})
	if err != nil {
		respondError(w, statusFromDomain(err), err.Error())
		return
	}

	respondJSON(w, http.StatusOK, customerToResponse(customer))
}

func (h *CustomerHandler) Search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	customers, err := h.search.Execute(r.Context(), q)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := make([]CustomerResponse, len(customers))
	for i, c := range customers {
		resp[i] = customerToResponse(c)
	}
	respondJSON(w, http.StatusOK, resp)
}
