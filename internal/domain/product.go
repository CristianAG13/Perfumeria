package domain

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Product struct {
	ID             string
	Name           string
	Brand          string
	CategoryID     string
	CategoryName   string
	Barcode        string
	Image          string
	Description    string
	SalePrice      Money
	CostPrice      Money
	MinStock       int
	CurrentStock   int
	Active         bool
	ShowInStore    bool
	PriceBelowCost bool
	Gender         string
	DiscountPercent int
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (p *Product) HasDiscount() bool {
	return p.DiscountPercent > 0
}

func (p *Product) DiscountedPrice() Money {
	if p.DiscountPercent <= 0 {
		return p.SalePrice
	}
	cents := p.SalePrice.Cents() * int64(100-p.DiscountPercent) / 100
	m, _ := NewMoney(cents)
	return m
}

func NewProduct(name, brand, categoryID, categoryName, barcode, image, description, gender string, salePrice, costPrice Money, minStock, discountPercent int) (*Product, error) {
	if strings.TrimSpace(name) == "" {
		return nil, fmt.Errorf("product name is required: %w", ErrInvalidInput)
	}
	if strings.TrimSpace(barcode) == "" {
		return nil, fmt.Errorf("barcode is required: %w", ErrInvalidInput)
	}
	if salePrice.IsZero() {
		return nil, fmt.Errorf("sale price must be greater than zero: %w", ErrInvalidInput)
	}
	if minStock < 0 {
		return nil, fmt.Errorf("min stock cannot be negative: %w", ErrInvalidInput)
	}
	if gender != "ella" && gender != "el" && gender != "unisex" {
		return nil, fmt.Errorf("gender must be ella, el or unisex: %w", ErrInvalidInput)
	}
	if discountPercent < 0 || discountPercent > 100 {
		return nil, fmt.Errorf("discount percent must be between 0 and 100: %w", ErrInvalidInput)
	}
	if discountPercent > 0 && salePrice.Cents() == 0 {
		return nil, fmt.Errorf("cannot set discount on a product with zero price: %w", ErrInvalidInput)
	}

	now := time.Now().UTC()
	return &Product{
		ID:              uuid.NewString(),
		Name:            name,
		Brand:           brand,
		CategoryID:      categoryID,
		CategoryName:    categoryName,
		Barcode:         barcode,
		Image:           image,
		Description:     description,
		Gender:          gender,
		SalePrice:       salePrice,
		CostPrice:       costPrice,
		MinStock:        minStock,
		Active:          true,
		ShowInStore:     true,
		PriceBelowCost:  salePrice.LessThan(costPrice),
		DiscountPercent: discountPercent,
		CreatedAt:       now,
		UpdatedAt:       now,
	}, nil
}

func (p *Product) Deactivate() {
	p.Active = false
	p.UpdatedAt = time.Now().UTC()
}

func (p *Product) Update(name, brand, categoryID, categoryName, image, description, gender string, salePrice, costPrice Money, minStock, discountPercent int) error {
	if strings.TrimSpace(name) == "" {
		return fmt.Errorf("product name is required: %w", ErrInvalidInput)
	}
	if salePrice.IsZero() {
		return fmt.Errorf("sale price must be greater than zero: %w", ErrInvalidInput)
	}
	if minStock < 0 {
		return fmt.Errorf("min stock cannot be negative: %w", ErrInvalidInput)
	}
	if gender != "ella" && gender != "el" && gender != "unisex" {
		return fmt.Errorf("gender must be ella, el or unisex: %w", ErrInvalidInput)
	}
	if discountPercent < 0 || discountPercent > 100 {
		return fmt.Errorf("discount percent must be between 0 and 100: %w", ErrInvalidInput)
	}
	p.Name = name
	p.Brand = brand
	p.CategoryID = categoryID
	p.CategoryName = categoryName
	p.Image = image
	p.Description = description
	p.Gender = gender
	p.SalePrice = salePrice
	p.CostPrice = costPrice
	p.MinStock = minStock
	p.DiscountPercent = discountPercent
	p.PriceBelowCost = salePrice.LessThan(costPrice)
	p.UpdatedAt = time.Now().UTC()
	return nil
}

func (p *Product) SetShowInStore(show bool) {
	p.ShowInStore = show
	p.UpdatedAt = time.Now().UTC()
}
