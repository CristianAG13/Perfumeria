package sqlite

import (
	"context"
	"database/sql"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type StockRepo struct {
	db *DB
}

func NewStockRepo(db *DB) *StockRepo {
	return &StockRepo{db: db}
}

func (r *StockRepo) Append(ctx context.Context, m *domain.StockMovement) error {
	_, err := exec(ctx, r.db,
		`INSERT INTO stock_movements (id, product_id, type, quantity, reason, sale_id, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		m.ID, m.ProductID, m.Type, m.Quantity, m.Reason, m.SaleID, m.CreatedAt.Format("2006-01-02 15:04:05"),
	)
	return err
}

func (r *StockRepo) AppendBatch(ctx context.Context, movements []*domain.StockMovement) error {
	for _, m := range movements {
		if err := r.Append(ctx, m); err != nil {
			return err
		}
	}
	return nil
}

func (r *StockRepo) CurrentStock(ctx context.Context, productID string) (int, error) {
	var sum sql.NullInt64
	row := queryRow(ctx, r.db,
		`SELECT SUM(quantity) FROM stock_movements WHERE product_id = ?`, productID)
	err := row.Scan(&sum)
	if err != nil {
		return 0, err
	}
	return int(sum.Int64), nil
}

func (r *StockRepo) ListBelowMinimum(ctx context.Context) ([]ports.LowStockItem, error) {
	rows, err := queryRows(ctx, r.db,
		`SELECT p.id, p.name, p.brand, p.category_id, p.category_name, p.barcode, p.image, p.sale_price_cents, p.cost_price_cents, p.min_stock, p.active, p.show_in_store, p.price_below_cost, p.created_at, p.updated_at,
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
		var active, showInStore, belowCost int
		var saleCents, costCents int64
		var createdAt, updatedAt string
		var currentStock int

		err := rows.Scan(&p.ID, &p.Name, &p.Brand, &p.CategoryID, &p.CategoryName, &p.Barcode, &p.Image,
			&saleCents, &costCents, &p.MinStock, &active, &showInStore, &belowCost,
			&createdAt, &updatedAt, &currentStock)
		if err != nil {
			return nil, err
		}

		p.SalePrice, _ = domain.NewMoney(saleCents)
		p.CostPrice, _ = domain.NewMoney(costCents)
		p.Active = active == 1
		p.ShowInStore = showInStore == 1
		p.PriceBelowCost = belowCost == 1
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

func (r *StockRepo) FindByProduct(ctx context.Context, productID string, limit, offset int) ([]*domain.StockMovement, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := queryRows(ctx, r.db,
		`SELECT id, product_id, type, quantity, reason, sale_id, created_at
		 FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
		productID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var movements []*domain.StockMovement
	for rows.Next() {
		m, err := scanStockMovement(rows)
		if err != nil {
			return nil, err
		}
		movements = append(movements, m)
	}
	return movements, rows.Err()
}
