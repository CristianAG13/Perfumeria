package sqlite

import (
	"context"

	"github.com/ayf/perfumeria/internal/domain"
)

type CategoryRepo struct {
	db *DB
}

func NewCategoryRepo(db *DB) *CategoryRepo {
	return &CategoryRepo{db: db}
}

func (r *CategoryRepo) Save(ctx context.Context, c *domain.Category) error {
	row := categoryToRow(c)
	_, err := exec(ctx, r.db,
		`INSERT INTO categories (id, name, image, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET name=excluded.name, image=excluded.image, updated_at=excluded.updated_at`,
		row["id"], row["name"], row["image"], row["created_at"], row["updated_at"],
	)
	return err
}

func (r *CategoryRepo) FindByID(ctx context.Context, id string) (*domain.Category, error) {
	row := queryRow(ctx, r.db,
		`SELECT id, name, image, created_at, updated_at FROM categories WHERE id = ?`, id)
	return scanCategory(row)
}

func (r *CategoryRepo) ListAll(ctx context.Context) ([]*domain.Category, error) {
	rows, err := queryRows(ctx, r.db,
		`SELECT id, name, image, created_at, updated_at FROM categories ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []*domain.Category
	for rows.Next() {
		c, err := scanCategory(rows)
		if err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	return categories, rows.Err()
}
