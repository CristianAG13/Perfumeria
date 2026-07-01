package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/ayf/perfumeria/internal/application/usecase/categories"
)

type CategoryHandler struct {
	create *categories.CreateCategory
	list   *categories.ListCategories
	update *categories.UpdateCategory
}

func NewCategoryHandler(create *categories.CreateCategory, list *categories.ListCategories, update *categories.UpdateCategory) *CategoryHandler {
	return &CategoryHandler{create: create, list: list, update: update}
}

func (h *CategoryHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.Create)
	r.Get("/", h.List)
	r.Patch("/{id}", h.Update)
	return r
}

func (h *CategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name        string `json:"name"`
		Image       string `json:"image"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	c, err := h.create.Execute(r.Context(), categories.CreateCategoryInput{
		Name:        input.Name,
		Image:       input.Image,
		Description: input.Description,
	})
	if err != nil {
		respondError(w, statusFromDomain(err), err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, categoryToResponse(c))
}

func (h *CategoryHandler) List(w http.ResponseWriter, r *http.Request) {
	categories, err := h.list.Execute(r.Context())
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

func (h *CategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var input struct {
		Name        string `json:"name"`
		Image       string `json:"image"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	c, err := h.update.Execute(r.Context(), categories.UpdateCategoryInput{
		ID:          id,
		Name:        input.Name,
		Image:       input.Image,
		Description: input.Description,
	})
	if err != nil {
		respondError(w, statusFromDomain(err), err.Error())
		return
	}

	respondJSON(w, http.StatusOK, categoryToResponse(c))
}
