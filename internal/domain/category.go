package domain

import (
	"errors"
	"strings"
	"time"
	"github.com/google/uuid"
)

type Category struct {
	ID          string
	Name        string
	Image       string
	Description string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func NewCategory(name, image, description string) (*Category, error) {
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("category name is required")
	}
	now := time.Now().UTC()
	return &Category{
		ID:          uuid.NewString(),
		Name:        name,
		Image:       image,
		Description: description,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

func (c *Category) Update(name, image, description string) error {
	if strings.TrimSpace(name) == "" {
		return errors.New("category name is required")
	}
	c.Name = name
	c.Image = image
	c.Description = description
	c.UpdatedAt = time.Now().UTC()
	return nil
}
