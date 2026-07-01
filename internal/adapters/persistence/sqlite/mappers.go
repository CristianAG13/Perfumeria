package sqlite

import (
	"database/sql"
	"errors"
	"time"

	"github.com/ayf/perfumeria/internal/domain"
)

func wrapNotFound(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return domain.ErrNotFound
	}
	return err
}

func scanProduct(row interface{ Scan(dest ...any) error }) (*domain.Product, error) {
	var id, name, brand, categoryID, categoryName, barcode, image, description, gender string
	var saleCents, costCents, minStock, currentStock, discountPercent int
	var active, showInStore, belowCost int
	var createdAt, updatedAt string

	err := row.Scan(&id, &name, &brand, &categoryID, &categoryName, &barcode, &image, &description, &gender, &saleCents, &costCents, &minStock, &discountPercent, &active, &showInStore, &belowCost, &createdAt, &updatedAt, &currentStock)
	if err != nil {
		return nil, wrapNotFound(err)
	}

	salePrice, _ := domain.NewMoney(int64(saleCents))
	costPrice, _ := domain.NewMoney(int64(costCents))

	return &domain.Product{
		ID:              id,
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
		CurrentStock:    currentStock,
		Active:          active == 1,
		ShowInStore:     showInStore == 1,
		PriceBelowCost:  belowCost == 1,
		DiscountPercent: discountPercent,
		CreatedAt:       parseTime(createdAt),
		UpdatedAt:       parseTime(updatedAt),
	}, nil
}

func scanCategory(row interface{ Scan(dest ...any) error }) (*domain.Category, error) {
	var id, name, image, createdAt, updatedAt string

	err := row.Scan(&id, &name, &image, &createdAt, &updatedAt)
	if err != nil {
		return nil, wrapNotFound(err)
	}

	return &domain.Category{
		ID:        id,
		Name:      name,
		Image:     image,
		CreatedAt: parseTime(createdAt),
		UpdatedAt: parseTime(updatedAt),
	}, nil
}

func scanSale(row interface{ Scan(dest ...any) error }) (*domain.Sale, error) {
	var id, status, cancelReason, createdAt string
	var customerID sql.NullString
	var totalCents int64

	err := row.Scan(&id, &customerID, &totalCents, &status, &cancelReason, &createdAt)
	if err != nil {
		return nil, wrapNotFound(err)
	}

	total, _ := domain.NewMoney(totalCents)

	s := &domain.Sale{
		ID:           id,
		Total:        total,
		Status:       domain.SaleStatus(status),
		CancelReason: cancelReason,
		CreatedAt:    parseTime(createdAt),
		Lines:        []domain.SaleLine{},
	}
	if customerID.Valid {
		s.CustomerID = &customerID.String
	}
	return s, nil
}

func scanSaleLine(row interface{ Scan(dest ...any) error }) (domain.SaleLine, error) {
	var id int
	var saleID, productID, productName string
	var qty, unitCents, discCents, subCents int

	err := row.Scan(&id, &saleID, &productID, &productName, &qty, &unitCents, &discCents, &subCents)
	if err != nil {
		return domain.SaleLine{}, err
	}

	unitPrice, _ := domain.NewMoney(int64(unitCents))
	discount, _ := domain.NewMoney(int64(discCents))
	subtotal, _ := domain.NewMoney(int64(subCents))

	return domain.SaleLine{
		ProductID:   productID,
		ProductName: productName,
		Quantity:    qty,
		UnitPrice:   unitPrice,
		Discount:    discount,
		Subtotal:    subtotal,
	}, nil
}

func scanStockMovement(row interface{ Scan(dest ...any) error }) (*domain.StockMovement, error) {
	var id, productID, mtype, reason, createdAt string
	var qty int
	var saleID sql.NullString

	err := row.Scan(&id, &productID, &mtype, &qty, &reason, &saleID, &createdAt)
	if err != nil {
		return nil, err
	}

	m := &domain.StockMovement{
		ID:        id,
		ProductID: productID,
		Type:      mtype,
		Quantity:  qty,
		Reason:    reason,
		CreatedAt: parseTime(createdAt),
	}
	if saleID.Valid {
		m.SaleID = &saleID.String
	}
	return m, nil
}

func parseTime(s string) time.Time {
	t, err := time.Parse("2006-01-02 15:04:05", s)
	if err != nil {
		return time.Now().UTC()
	}
	return t
}

func productToRow(p *domain.Product) map[string]any {
	active := 0
	if p.Active {
		active = 1
	}
	showInStore := 0
	if p.ShowInStore {
		showInStore = 1
	}
	belowCost := 0
	if p.PriceBelowCost {
		belowCost = 1
	}
	return map[string]any{
		"id":                p.ID,
		"name":              p.Name,
		"brand":             p.Brand,
		"category_id":       p.CategoryID,
		"category_name":     p.CategoryName,
		"barcode":           p.Barcode,
		"image":             p.Image,
		"description":       p.Description,
		"gender":            p.Gender,
		"discount_percent":  p.DiscountPercent,
		"sale_price_cents":  p.SalePrice.Cents(),
		"cost_price_cents":  p.CostPrice.Cents(),
		"min_stock":         p.MinStock,
		"active":            active,
		"show_in_store":     showInStore,
		"price_below_cost":  belowCost,
		"created_at":        p.CreatedAt.Format("2006-01-02 15:04:05"),
		"updated_at":        p.CreatedAt.Format("2006-01-02 15:04:05"),
	}
}

func categoryToRow(c *domain.Category) map[string]any {
	return map[string]any{
		"id":         c.ID,
		"name":       c.Name,
		"image":      c.Image,
		"created_at": c.CreatedAt.Format("2006-01-02 15:04:05"),
		"updated_at": c.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}
