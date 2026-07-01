package sqlite

import (
	"context"
	"fmt"
	"time"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type SaleRepo struct {
	db *DB
}

func NewSaleRepo(db *DB) *SaleRepo {
	return &SaleRepo{db: db}
}

func (r *SaleRepo) Save(ctx context.Context, s *domain.Sale, movements []*domain.StockMovement) error {
	paymentMethod := s.PaymentLines[0].Method

	_, err := exec(ctx, r.db,
		`INSERT INTO sales (id, customer_id, total_cents, payment_method, status, cancel_reason, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		s.ID, s.CustomerID, s.Total.Cents(), paymentMethod, s.Status, s.CancelReason,
		s.CreatedAt.Format("2006-01-02 15:04:05"),
	)
	if err != nil {
		return fmt.Errorf("save sale: %w", err)
	}

	for _, pm := range s.PaymentLines {
		_, err := exec(ctx, r.db,
			`INSERT INTO payment_lines (sale_id, method, amount_cents) VALUES (?, ?, ?)`,
			s.ID, pm.Method, pm.Amount)
		if err != nil {
			return fmt.Errorf("save payment line: %w", err)
		}
	}

	for _, l := range s.Lines {
		_, err := exec(ctx, r.db,
			`INSERT INTO sale_lines (sale_id, product_id, product_name, quantity, unit_price_cents, discount_cents, subtotal_cents)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			s.ID, l.ProductID, l.ProductName, l.Quantity, l.UnitPrice.Cents(), l.Discount.Cents(), l.Subtotal.Cents(),
		)
		if err != nil {
			return fmt.Errorf("save sale line: %w", err)
		}
	}

	for _, m := range movements {
		_, err := exec(ctx, r.db,
			`INSERT INTO stock_movements (id, product_id, type, quantity, reason, sale_id, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			m.ID, m.ProductID, m.Type, m.Quantity, m.Reason, m.SaleID, m.CreatedAt.Format("2006-01-02 15:04:05"),
		)
		if err != nil {
			return fmt.Errorf("save stock movement: %w", err)
		}
	}

	return nil
}

func (r *SaleRepo) FindByID(ctx context.Context, id string) (*domain.Sale, error) {
	row := queryRow(ctx, r.db,
		`SELECT id, customer_id, total_cents, status, cancel_reason, created_at
		 FROM sales WHERE id = ?`, id)
	s, err := scanSale(row)
	if err != nil {
		return nil, err
	}

	lines, err := r.loadLines(ctx, id)
	if err != nil {
		return nil, err
	}
	s.Lines = lines

	payments, err := r.loadPayments(ctx, id)
	if err != nil {
		return nil, err
	}
	s.PaymentLines = payments

	return s, nil
}

func (r *SaleRepo) FindByCustomer(ctx context.Context, customerID string, from, to time.Time) ([]*domain.Sale, error) {
	return r.findSales(ctx,
		`WHERE customer_id = ? AND created_at >= ? AND created_at <= ?`,
		customerID, from.Format("2006-01-02 15:04:05"), to.Format("2006-01-02 15:04:05"))
}

func (r *SaleRepo) FindByDateRange(ctx context.Context, from, to time.Time) ([]*domain.Sale, error) {
	return r.findSales(ctx,
		`WHERE created_at >= ? AND created_at <= ?`,
		from.Format("2006-01-02 15:04:05"), to.Format("2006-01-02 15:04:05"))
}

func (r *SaleRepo) Cancel(ctx context.Context, saleID, reason string, movements []*domain.StockMovement) error {
	_, err := exec(ctx, r.db,
		`UPDATE sales SET status = ?, cancel_reason = ? WHERE id = ?`,
		domain.SaleStatusCancelled, reason, saleID)
	if err != nil {
		return fmt.Errorf("cancel sale: %w", err)
	}

	for _, m := range movements {
		_, err := exec(ctx, r.db,
			`INSERT INTO stock_movements (id, product_id, type, quantity, reason, sale_id, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			m.ID, m.ProductID, m.Type, m.Quantity, m.Reason, m.SaleID, m.CreatedAt.Format("2006-01-02 15:04:05"),
		)
		if err != nil {
			return fmt.Errorf("cancel stock movement: %w", err)
		}
	}

	return nil
}

func (r *SaleRepo) DailyReport(ctx context.Context, date time.Time) (*ports.DailyReportResult, error) {
	start := date.Format("2006-01-02") + " 00:00:00"
	end := date.Format("2006-01-02") + " 23:59:59"

	rows, err := queryRows(ctx, r.db,
		`SELECT pl.method, COUNT(DISTINCT pl.sale_id), COALESCE(SUM(pl.amount_cents), 0)
		 FROM payment_lines pl
		 JOIN sales s ON s.id = pl.sale_id
		 WHERE s.created_at >= ? AND s.created_at <= ? AND s.status = 'active'
		 GROUP BY pl.method`, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := &ports.DailyReportResult{
		Date:             date.Format("2006-01-02"),
		PaymentBreakdown: make(map[string]int64),
	}

	for rows.Next() {
		var method string
		var count int
		var total int64
		if err := rows.Scan(&method, &count, &total); err != nil {
			return nil, err
		}
		result.TotalAmount += total
		result.PaymentBreakdown[method] = total
	}

	totalSalesRow := queryRow(ctx, r.db,
		`SELECT COUNT(*) FROM sales WHERE created_at >= ? AND created_at <= ? AND status = 'active'`, start, end)
	totalSalesRow.Scan(&result.SalesCount)

	return result, rows.Err()
}

func (r *SaleRepo) TopProducts(ctx context.Context, from, to time.Time, limit int) ([]ports.TopProductItem, error) {
	if limit <= 0 {
		limit = 10
	}

	rows, err := queryRows(ctx, r.db,
		`SELECT sl.product_id, sl.product_name,
		        SUM(sl.quantity) as total_qty,
		        SUM(sl.subtotal_cents) as total_revenue
		 FROM sale_lines sl
		 JOIN sales s ON s.id = sl.sale_id
		 WHERE s.created_at >= ? AND s.created_at <= ? AND s.status = 'active'
		 GROUP BY sl.product_id
		 ORDER BY total_qty DESC
		 LIMIT ?`, from.Format("2006-01-02 15:04:05"), to.Format("2006-01-02 15:04:05"), limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []ports.TopProductItem
	for rows.Next() {
		var item ports.TopProductItem
		if err := rows.Scan(&item.ProductID, &item.ProductName, &item.TotalQty, &item.TotalRevenue); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *SaleRepo) findSales(ctx context.Context, where string, args ...any) ([]*domain.Sale, error) {
	q := fmt.Sprintf(`SELECT id, customer_id, total_cents, status, cancel_reason, created_at
		FROM sales %s ORDER BY created_at DESC`, where)
	rows, err := queryRows(ctx, r.db, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sales []*domain.Sale
	for rows.Next() {
		s, err := scanSale(rows)
		if err != nil {
			return nil, err
		}
		lines, err := r.loadLines(ctx, s.ID)
		if err != nil {
			return nil, err
		}
		s.Lines = lines
		payments, err := r.loadPayments(ctx, s.ID)
		if err != nil {
			return nil, err
		}
		s.PaymentLines = payments
		sales = append(sales, s)
	}
	return sales, rows.Err()
}

func (r *SaleRepo) loadLines(ctx context.Context, saleID string) ([]domain.SaleLine, error) {
	rows, err := queryRows(ctx, r.db,
		`SELECT id, sale_id, product_id, product_name, quantity, unit_price_cents, discount_cents, subtotal_cents
		 FROM sale_lines WHERE sale_id = ? ORDER BY id ASC`, saleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lines []domain.SaleLine
	for rows.Next() {
		l, err := scanSaleLine(rows)
		if err != nil {
			return nil, err
		}
		lines = append(lines, l)
	}
	return lines, rows.Err()
}

func (r *SaleRepo) loadPayments(ctx context.Context, saleID string) ([]domain.PaymentLine, error) {
	rows, err := queryRows(ctx, r.db,
		`SELECT method, amount_cents FROM payment_lines WHERE sale_id = ? ORDER BY rowid ASC`, saleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []domain.PaymentLine
	for rows.Next() {
		var pm domain.PaymentLine
		if err := rows.Scan(&pm.Method, &pm.Amount); err != nil {
			return nil, err
		}
		payments = append(payments, pm)
	}
	return payments, rows.Err()
}

var _ ports.SaleRepository = (*SaleRepo)(nil)
