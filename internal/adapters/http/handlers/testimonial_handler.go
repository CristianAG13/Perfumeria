package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/ayf/perfumeria/internal/application/usecase/testimonials"
	"github.com/ayf/perfumeria/internal/domain"
)

type TestimonialHandler struct {
	create     *testimonials.CreateTestimonial
	listAll    *testimonials.ListAllTestimonials
	listActive *testimonials.ListActiveTestimonials
	delete     *testimonials.DeleteTestimonial
}

func NewTestimonialHandler(create *testimonials.CreateTestimonial, listAll *testimonials.ListAllTestimonials, listActive *testimonials.ListActiveTestimonials, del *testimonials.DeleteTestimonial) *TestimonialHandler {
	return &TestimonialHandler{create: create, listAll: listAll, listActive: listActive, delete: del}
}

func (h *TestimonialHandler) AdminRoutes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.Create)
	r.Get("/", h.List)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *TestimonialHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name      string `json:"name"`
		Text      string `json:"text"`
		Rating    int    `json:"rating"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	t, err := h.create.Execute(r.Context(), testimonials.CreateTestimonialInput{
		Name:      input.Name,
		Text:      input.Text,
		Rating:    input.Rating,
		AvatarURL: input.AvatarURL,
	})
	if err != nil {
		respondError(w, statusFromDomain(err), err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, testimonialToResponse(t))
}

func (h *TestimonialHandler) List(w http.ResponseWriter, r *http.Request) {
	list, err := h.listAll.Execute(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := make([]TestimonialResponse, len(list))
	for i, t := range list {
		resp[i] = testimonialToResponse(t)
	}
	respondJSON(w, http.StatusOK, resp)
}

func (h *TestimonialHandler) ListActive(w http.ResponseWriter, r *http.Request) {
	list, err := h.listActive.Execute(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	resp := make([]TestimonialResponse, len(list))
	for i, t := range list {
		resp[i] = testimonialToResponse(t)
	}
	respondJSON(w, http.StatusOK, resp)
}

func (h *TestimonialHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.delete.Execute(r.Context(), id); err != nil {
		respondError(w, statusFromDomain(err), err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type TestimonialResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Text      string `json:"text"`
	Rating    int    `json:"rating"`
	AvatarURL string `json:"avatar_url"`
	Active    bool   `json:"active"`
	CreatedAt string `json:"created_at"`
}

func testimonialToResponse(t *domain.Testimonial) TestimonialResponse {
	return TestimonialResponse{
		ID:        t.ID,
		Name:      t.Name,
		Text:      t.Text,
		Rating:    t.Rating,
		AvatarURL: t.AvatarURL,
		Active:    t.Active,
		CreatedAt: t.CreatedAt.Format("2006-01-02"),
	}
}
