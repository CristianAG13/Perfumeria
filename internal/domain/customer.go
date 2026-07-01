package domain

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Customer struct {
	ID        string
	Name      string
	LastName  string
	Phone     string
	Email     string
	CreatedAt string
	UpdatedAt string
}

func NewCustomer(name, lastName, phone, email string) (*Customer, error) {
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("customer name is required")
	}
	now := time.Now().UTC().Format("2006-01-02 15:04:05")
	return &Customer{
		ID:        uuid.NewString(),
		Name:      name,
		LastName:  lastName,
		Phone:     phone,
		Email:     email,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

func (c *Customer) Update(name, lastName, phone, email string) error {
	if strings.TrimSpace(name) == "" {
		return errors.New("customer name is required")
	}
	c.Name = name
	c.LastName = lastName
	c.Phone = phone
	c.Email = email
	c.UpdatedAt = time.Now().UTC().Format("2006-01-02 15:04:05")
	return nil
}
