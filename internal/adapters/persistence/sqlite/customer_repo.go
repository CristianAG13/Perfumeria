package sqlite

import (
	"context"
	"database/sql"
	"errors"

	"github.com/ayf/perfumeria/internal/domain"
)

type CustomerRepo struct {
	db *DB
}

func NewCustomerRepo(db *DB) *CustomerRepo {
	return &CustomerRepo{db: db}
}

const customerCols = "id, name, last_name, phone, email, created_at, updated_at"

func scanCustomer(row interface{ Scan(dest ...any) error }) (*domain.Customer, error) {
	c := &domain.Customer{}
	err := row.Scan(&c.ID, &c.Name, &c.LastName, &c.Phone, &c.Email, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return c, nil
}

func (r *CustomerRepo) Save(ctx context.Context, c *domain.Customer) error {
	_, err := exec(ctx, r.db,
		`INSERT INTO customers (`+customerCols+`)
		 VALUES (?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET name=excluded.name, last_name=excluded.last_name, phone=excluded.phone,
		   email=excluded.email, updated_at=excluded.updated_at`,
		c.ID, c.Name, c.LastName, c.Phone, c.Email, c.CreatedAt, c.UpdatedAt,
	)
	return err
}

func (r *CustomerRepo) FindByID(ctx context.Context, id string) (*domain.Customer, error) {
	row := queryRow(ctx, r.db,
		`SELECT `+customerCols+` FROM customers WHERE id = ?`, id)
	return scanCustomer(row)
}

func (r *CustomerRepo) Delete(ctx context.Context, id string) error {
	_, err := exec(ctx, r.db, `DELETE FROM customers WHERE id = ?`, id)
	return err
}

func (r *CustomerRepo) Search(ctx context.Context, query string) ([]*domain.Customer, error) {
	like := likePattern(query)
	rows, err := queryRows(ctx, r.db,
		`SELECT `+customerCols+` FROM customers WHERE name LIKE ? ESCAPE '\'
		 OR last_name LIKE ? ESCAPE '\' OR phone LIKE ? ESCAPE '\' OR email LIKE ? ESCAPE '\'
		 ORDER BY name LIMIT 50`, like, like, like, like)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var customers []*domain.Customer
	for rows.Next() {
		c, err := scanCustomer(rows)
		if err != nil {
			return nil, err
		}
		customers = append(customers, c)
	}
	return customers, rows.Err()
}
