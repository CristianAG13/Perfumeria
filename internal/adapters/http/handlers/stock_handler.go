package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/ayf/perfumeria/internal/application/usecase/stock"
)

type StockHandler struct {
	recordEntry *stock.RecordEntry
	adjustStock *stock.AdjustStock
}

func NewStockHandler(r *stock.RecordEntry, a *stock.AdjustStock) *StockHandler {
	return &StockHandler{recordEntry: r, adjustStock: a}
}

func (h *StockHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/entries", h.RecordEntry)
	r.Post("/adjustments", h.Adjust)
	return r
}

func (h *StockHandler) RecordEntry(w http.ResponseWriter, r *http.Request) {
	var input struct {
		ProductID string `json:"product_id"`
		Quantity  int    `json:"quantity"`
		Reason    string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	movement, err := h.recordEntry.Execute(r.Context(), stock.RecordEntryInput{
		ProductID: input.ProductID,
		Quantity:  input.Quantity,
		Reason:    input.Reason,
	})
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, movement)
}

func (h *StockHandler) Adjust(w http.ResponseWriter, r *http.Request) {
	var input struct {
		ProductID string `json:"product_id"`
		Quantity  int    `json:"quantity"`
		Reason    string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	movement, err := h.adjustStock.Execute(r.Context(), stock.AdjustStockInput{
		ProductID: input.ProductID,
		Quantity:  input.Quantity,
		Reason:    input.Reason,
	})
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, movement)
}
