package sqlite

import (
	"context"
	"fmt"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type ProductRepo struct {
	db *DB
}

func NewProductRepo(db *DB) *ProductRepo {
	return &ProductRepo{db: db}
}

const productCols = "id, name, brand, category_id, category_name, barcode, image, description, gender, sale_price_cents, cost_price_cents, min_stock, discount_percent, active, show_in_store, price_below_cost, created_at, updated_at"

func (r *ProductRepo) Save(ctx context.Context, p *domain.Product) error {
	row := productToRow(p)
	_, err := exec(ctx, r.db,
		`INSERT INTO products (`+productCols+`)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET name=excluded.name, brand=excluded.brand,
		   category_id=excluded.category_id, category_name=excluded.category_name,
		   barcode=excluded.barcode, image=excluded.image, description=excluded.description,
		   gender=excluded.gender,
		   sale_price_cents=excluded.sale_price_cents, cost_price_cents=excluded.cost_price_cents,
		   min_stock=excluded.min_stock, discount_percent=excluded.discount_percent,
		   active=excluded.active, show_in_store=excluded.show_in_store,
		   price_below_cost=excluded.price_below_cost, updated_at=excluded.updated_at`,
		row["id"], row["name"], row["brand"], row["category_id"], row["category_name"],
		row["barcode"], row["image"], row["description"], row["gender"],
		row["sale_price_cents"], row["cost_price_cents"], row["min_stock"],
		row["discount_percent"],
		row["active"], row["show_in_store"], row["price_below_cost"], row["created_at"], row["updated_at"],
	)
	return err
}

func (r *ProductRepo) FindByID(ctx context.Context, id string) (*domain.Product, error) {
	row := queryRow(ctx, r.db,
		`SELECT `+productCols+`,
		        COALESCE((SELECT SUM(quantity) FROM stock_movements WHERE product_id = products.id), 0) as current_stock
		 FROM products WHERE id = ?`, id)
	return scanProduct(row)
}

func (r *ProductRepo) FindByBarcode(ctx context.Context, barcode string) (*domain.Product, error) {
	row := queryRow(ctx, r.db,
		`SELECT `+productCols+`,
		        COALESCE((SELECT SUM(quantity) FROM stock_movements WHERE product_id = products.id), 0) as current_stock
		 FROM products WHERE barcode = ?`, barcode)
	return scanProduct(row)
}

func (r *ProductRepo) Search(ctx context.Context, q ports.SearchProductsQuery) ([]*domain.Product, error) {
	where := "WHERE active = 1"
	args := []any{}

	if q.Query != "" {
		where += " AND (name LIKE ? OR brand LIKE ? OR barcode LIKE ?) ESCAPE '\\'"
		like := likePattern(q.Query)
		args = append(args, like, like, like)
	}
	if q.Category != "" {
		where += " AND category_id = ?"
		args = append(args, q.Category)
	}
	if q.Gender != "" {
		where += " AND (gender = ? OR gender = 'unisex')"
		args = append(args, q.Gender)
	}
	if q.OnlyShowInStore {
		where += " AND show_in_store = 1"
	}

	limit := q.Limit
	if limit <= 0 {
		limit = 50
	}
	offset := q.Offset
	if offset < 0 {
		offset = 0
	}

	rows, err := queryRows(ctx, r.db,
		fmt.Sprintf(`SELECT `+productCols+`,
		               COALESCE((SELECT SUM(quantity) FROM stock_movements WHERE product_id = products.id), 0) as current_stock
		 FROM products %s ORDER BY name LIMIT ? OFFSET ?`, where),
		append(args, limit, offset)...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []*domain.Product
	for rows.Next() {
		p, err := scanProduct(rows)
		if err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, rows.Err()
}

func (r *ProductRepo) ListByCategory(ctx context.Context, categoryID string) ([]*domain.Product, error) {
	rows, err := queryRows(ctx, r.db,
		`SELECT `+productCols+`,
		        COALESCE((SELECT SUM(quantity) FROM stock_movements WHERE product_id = products.id), 0) as current_stock
		 FROM products WHERE active = 1 AND category_id = ? ORDER BY name`, categoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []*domain.Product
	for rows.Next() {
		p, err := scanProduct(rows)
		if err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, rows.Err()
}

func (r *ProductRepo) ListBelowMinimum(ctx context.Context) ([]ports.LowStockItem, error) {
	rows, err := queryRows(ctx, r.db,
		`SELECT p.`+productCols+`,
		        COALESCE((SELECT SUM(quantity) FROM stock_movements WHERE product_id = p.id), 0) as current_stock
		 FROM products p
		 WHERE p.active = 1
		   AND COALESCE((SELECT SUM(quantity) FROM stock_movements WHERE product_id = p.id), 0) <= p.min_stock
		 ORDER BY current_stock ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []ports.LowStockItem
	for rows.Next() {
		var p domain.Product
		var active, showInStore, belowCost, discountPercent int
		var saleCents, costCents int64
		var createdAt, updatedAt string
		var currentStock int

		err := rows.Scan(&p.ID, &p.Name, &p.Brand, &p.CategoryID, &p.CategoryName, &p.Barcode, &p.Image, &p.Description, &p.Gender,
			&saleCents, &costCents, &p.MinStock, &discountPercent, &active, &showInStore, &belowCost,
			&createdAt, &updatedAt, &currentStock)
		if err != nil {
			return nil, err
		}

		p.SalePrice, _ = domain.NewMoney(saleCents)
		p.CostPrice, _ = domain.NewMoney(costCents)
		p.Active = active == 1
		p.ShowInStore = showInStore == 1
		p.PriceBelowCost = belowCost == 1
		p.DiscountPercent = discountPercent
		p.CreatedAt = parseTime(createdAt)
		p.UpdatedAt = parseTime(updatedAt)

		items = append(items, ports.LowStockItem{
			Product:      p,
			CurrentStock: currentStock,
			MinimumStock: p.MinStock,
			Deficit:      p.MinStock - currentStock,
		})
	}
	return items, rows.Err()
}
