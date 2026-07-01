package domain

import (
	"testing"
)

func TestNewCategory(t *testing.T) {
	t.Run("valid category", func(t *testing.T) {
		c, err := NewCategory("Perfumes", "perfumes.jpg", "Categoría de perfumes")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if c.ID == "" {
			t.Error("expected non-empty ID")
		}
		if c.Name != "Perfumes" {
			t.Errorf("name = %q", c.Name)
		}
		if c.Image != "perfumes.jpg" {
			t.Errorf("image = %q", c.Image)
		}
		if c.Description != "Categoría de perfumes" {
			t.Errorf("description = %q", c.Description)
		}
		if c.CreatedAt.IsZero() {
			t.Error("expected non-zero CreatedAt")
		}
	})

	t.Run("empty name", func(t *testing.T) {
		_, err := NewCategory("", "img.jpg", "desc")
		if err == nil {
			t.Fatal("expected error for empty name")
		}
	})

	t.Run("whitespace name", func(t *testing.T) {
		_, err := NewCategory("   ", "img.jpg", "desc")
		if err == nil {
			t.Fatal("expected error for whitespace-only name")
		}
	})

	t.Run("empty image and description", func(t *testing.T) {
		c, err := NewCategory("Perfumes", "", "")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if c.Image != "" || c.Description != "" {
			t.Error("empty optional fields should be allowed")
		}
	})
}

func TestCategoryUpdate(t *testing.T) {
	t.Run("valid update", func(t *testing.T) {
		c, _ := NewCategory("Perfumes", "perfumes.jpg", "desc")
		err := c.Update("Maquillaje", "maquillaje.jpg", "Categoría de maquillaje")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if c.Name != "Maquillaje" {
			t.Errorf("name = %q", c.Name)
		}
		if c.Image != "maquillaje.jpg" {
			t.Errorf("image = %q", c.Image)
		}
		if c.Description != "Categoría de maquillaje" {
			t.Errorf("description = %q", c.Description)
		}
	})

	t.Run("empty name on update", func(t *testing.T) {
		c, _ := NewCategory("Perfumes", "perfumes.jpg", "desc")
		err := c.Update("", "img.jpg", "desc")
		if err == nil {
			t.Fatal("expected error for empty name")
		}
	})
}
