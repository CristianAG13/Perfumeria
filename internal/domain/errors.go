package domain

import "errors"

var (
	ErrNotFound          = errors.New("not found")
	ErrDuplicateBarcode  = errors.New("barcode already exists")
	ErrDuplicateTaxID    = errors.New("tax id already exists")
	ErrInsufficientStock = errors.New("insufficient stock")
	ErrInvalidInput      = errors.New("invalid input")
	ErrReasonRequired    = errors.New("reason is required")
	ErrAlreadyCancelled  = errors.New("sale is already cancelled")
	ErrNegativeStock     = errors.New("operation would result in negative stock")
)
