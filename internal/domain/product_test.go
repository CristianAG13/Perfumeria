package domain

import (
	"testing"
)

func validProductArgs() (string, string, string, string, string, string, string, string, Money, Money, int, int) {
	salePrice, _ := NewMoney(5000)   // 50.00
	costPrice, _ := NewMoney(3000)   // 30.00
	return "Perfume Channel", "Channel", "cat1", "Perfumes", "123456789", "chanel.jpg", "Un perfume elegante", "ella", salePrice, costPrice, 5, 0
}

func TestNewProduct(t *testing.T) {
	t.Run("valid product", func(t *testing.T) {
		p, err := NewProduct(validProductArgs())
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if p.Name != "Perfume Channel" {
			t.Errorf("name = %q", p.Name)
		}
		if p.ID == "" {
			t.Error("expected non-empty ID")
		}
		if !p.Active {
			t.Error("expected product to be active by default")
		}
		if !p.ShowInStore {
			t.Error("expected show_in_store to be true by default")
		}
		if p.PriceBelowCost {
				t.Error("expected price_below_cost false when sale > cost")
			}
		_ = p.CreatedAt.IsZero()
		_ = p.UpdatedAt.IsZero()
	})

	t.Run("empty name", func(t *testing.T) {
		_, brand, catID, catName, barcode, image, desc, gender, salePrice, costPrice, minStock, disc := validProductArgs()
		_, err := NewProduct("", brand, catID, catName, barcode, image, desc, gender, salePrice, costPrice, minStock, disc)
		if err == nil {
			t.Fatal("expected error for empty name")
		}
	})

	t.Run("empty barcode", func(t *testing.T) {
		name, brand, catID, catName, _, image, desc, gender, salePrice, costPrice, minStock, disc := validProductArgs()
		_, err := NewProduct(name, brand, catID, catName, "", image, desc, gender, salePrice, costPrice, minStock, disc)
		if err == nil {
			t.Fatal("expected error for empty barcode")
		}
	})

	t.Run("zero sale price", func(t *testing.T) {
		name, brand, catID, catName, barcode, image, desc, gender, _, costPrice, minStock, disc := validProductArgs()
		zeroPrice, _ := NewMoney(0)
		_, err := NewProduct(name, brand, catID, catName, barcode, image, desc, gender, zeroPrice, costPrice, minStock, disc)
		if err == nil {
			t.Fatal("expected error for zero sale price")
		}
	})

	t.Run("negative min stock", func(t *testing.T) {
		name, brand, catID, catName, barcode, image, desc, gender, salePrice, costPrice, _, disc := validProductArgs()
		_, err := NewProduct(name, brand, catID, catName, barcode, image, desc, gender, salePrice, costPrice, -1, disc)
		if err == nil {
			t.Fatal("expected error for negative min stock")
		}
	})

	t.Run("invalid gender", func(t *testing.T) {
		name, brand, catID, catName, barcode, image, desc, _, salePrice, costPrice, minStock, disc := validProductArgs()
		_, err := NewProduct(name, brand, catID, catName, barcode, image, desc, "otro", salePrice, costPrice, minStock, disc)
		if err == nil {
			t.Fatal("expected error for invalid gender")
		}
	})

	t.Run("valid genders", func(t *testing.T) {
		for _, g := range []string{"ella", "el", "unisex"} {
			name, brand, catID, catName, barcode, image, desc, _, salePrice, costPrice, minStock, disc := validProductArgs()
			p, err := NewProduct(name, brand, catID, catName, barcode, image, desc, g, salePrice, costPrice, minStock, disc)
			if err != nil {
				t.Errorf("gender %q should be valid: %v", g, err)
			}
			if p.Gender != g {
				t.Errorf("gender = %q, want %q", p.Gender, g)
			}
		}
	})

	t.Run("invalid discount percent", func(t *testing.T) {
		name, brand, catID, catName, barcode, image, desc, gender, salePrice, costPrice, minStock, _ := validProductArgs()
		_, err := NewProduct(name, brand, catID, catName, barcode, image, desc, gender, salePrice, costPrice, minStock, -1)
		if err == nil {
			t.Fatal("expected error for negative discount percent")
		}
		_, err = NewProduct(name, brand, catID, catName, barcode, image, desc, gender, salePrice, costPrice, minStock, 101)
		if err == nil {
			t.Fatal("expected error for discount > 100")
		}
	})

	t.Run("discount with zero price", func(t *testing.T) {
		name, brand, catID, catName, barcode, image, desc, gender, _, costPrice, minStock, _ := validProductArgs()
		zeroPrice, _ := NewMoney(0)
		_, err := NewProduct(name, brand, catID, catName, barcode, image, desc, gender, zeroPrice, costPrice, minStock, 10)
		if err == nil {
			t.Fatal("expected error for discount on zero price")
		}
	})

	t.Run("price below cost detection", func(t *testing.T) {
		name, brand, catID, catName, barcode, image, desc, gender, _, _, minStock, disc := validProductArgs()
		lowPrice, _ := NewMoney(1000)
		highCost, _ := NewMoney(5000)
		p, err := NewProduct(name, brand, catID, catName, barcode, image, desc, gender, lowPrice, highCost, minStock, disc)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !p.PriceBelowCost {
			t.Error("expected price_below_cost when sale < cost")
		}
	})
}

func TestProductHasDiscount(t *testing.T) {
	tests := []struct {
		name    string
		discount int
		want    bool
	}{
		{"no discount", 0, false},
		{"with discount", 10, true},
		{"full discount", 100, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			name, brand, catID, catName, barcode, image, desc, gender, salePrice, costPrice, minStock, _ := validProductArgs()
			p, err := NewProduct(name, brand, catID, catName, barcode, image, desc, gender, salePrice, costPrice, minStock, tt.discount)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if p.HasDiscount() != tt.want {
				t.Errorf("HasDiscount() = %v, want %v", p.HasDiscount(), tt.want)
			}
		})
	}
}

func TestProductDiscountedPrice(t *testing.T) {
	t.Run("no discount", func(t *testing.T) {
		salePrice, _ := NewMoney(10000) // 100.00
		p := &Product{SalePrice: salePrice, DiscountPercent: 0}
		got := p.DiscountedPrice()
		if got.Cents() != 10000 {
			t.Errorf("discounted = %d, want 10000", got.Cents())
		}
	})

	t.Run("10% discount", func(t *testing.T) {
		salePrice, _ := NewMoney(10000)
		p := &Product{SalePrice: salePrice, DiscountPercent: 10}
		got := p.DiscountedPrice()
		if got.Cents() != 9000 {
			t.Errorf("discounted = %d, want 9000 (10%% off 10000)", got.Cents())
		}
	})

	t.Run("50% discount", func(t *testing.T) {
		salePrice, _ := NewMoney(10000)
		p := &Product{SalePrice: salePrice, DiscountPercent: 50}
		got := p.DiscountedPrice()
		if got.Cents() != 5000 {
			t.Errorf("discounted = %d, want 5000", got.Cents())
		}
	})

	t.Run("100% discount", func(t *testing.T) {
		salePrice, _ := NewMoney(10000)
		p := &Product{SalePrice: salePrice, DiscountPercent: 100}
		got := p.DiscountedPrice()
		if got.Cents() != 0 {
			t.Errorf("discounted = %d, want 0", got.Cents())
		}
	})

	t.Run("uneven division rounds down", func(t *testing.T) {
		salePrice, _ := NewMoney(9999) // 99.99
		p := &Product{SalePrice: salePrice, DiscountPercent: 33}
		got := p.DiscountedPrice()
		// 9999 * 67 / 100 = 6699.33 → 6699 (int64 division truncates)
		if got.Cents() != 6699 {
			t.Errorf("discounted = %d, want 6699", got.Cents())
		}
	})
}

func TestProductDeactivate(t *testing.T) {
	p, _ := NewProduct(validProductArgs())
	if !p.Active {
		t.Fatal("expected active by default")
	}

	p.Deactivate()
	if p.Active {
		t.Error("expected product to be inactive after Deactivate()")
	}
}

func TestProductUpdate(t *testing.T) {
	t.Run("valid update", func(t *testing.T) {
		p, _ := NewProduct(validProductArgs())
		newPrice, _ := NewMoney(8000)
		err := p.Update("Nuevo nombre", "Nueva marca", "cat2", "Nueva cat", "nueva.jpg", "nueva desc", "el", newPrice, newPrice, 10, 20)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if p.Name != "Nuevo nombre" {
			t.Errorf("name = %q", p.Name)
		}
		if p.Gender != "el" {
			t.Errorf("gender = %q", p.Gender)
		}
		if p.MinStock != 10 {
			t.Errorf("minStock = %d", p.MinStock)
		}
	})

	t.Run("empty name on update", func(t *testing.T) {
		p, _ := NewProduct(validProductArgs())
		err := p.Update("", "brand", "cat", "cat", "img", "desc", "ella", p.SalePrice, p.CostPrice, 5, 0)
		if err == nil {
			t.Fatal("expected error for empty name")
		}
	})

	t.Run("zero price on update", func(t *testing.T) {
		p, _ := NewProduct(validProductArgs())
		zero, _ := NewMoney(0)
		err := p.Update("Name", "brand", "cat", "cat", "img", "desc", "ella", zero, p.CostPrice, 5, 0)
		if err == nil {
			t.Fatal("expected error for zero price")
		}
	})
}

func TestProductSetShowInStore(t *testing.T) {
	p, _ := NewProduct(validProductArgs())
	if !p.ShowInStore {
		t.Fatal("expected true by default")
	}

	p.SetShowInStore(false)
	if p.ShowInStore {
		t.Error("expected false after SetShowInStore(false)")
	}

	p.SetShowInStore(true)
	if !p.ShowInStore {
		t.Error("expected true after SetShowInStore(true)")
	}
}
