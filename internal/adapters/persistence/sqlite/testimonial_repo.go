package sqlite

import (
	"context"
	"database/sql"
	"errors"

	"github.com/ayf/perfumeria/internal/domain"
)

type TestimonialRepo struct {
	db *DB
}

func NewTestimonialRepo(db *DB) *TestimonialRepo {
	return &TestimonialRepo{db: db}
}

const testimonialCols = "id, name, text, rating, avatar_url, active, created_at, updated_at"

func scanTestimonial(row interface{ Scan(dest ...any) error }) (*domain.Testimonial, error) {
	t := &domain.Testimonial{}
	var active int
	var createdAt, updatedAt string
	err := row.Scan(&t.ID, &t.Name, &t.Text, &t.Rating, &t.AvatarURL, &active, &createdAt, &updatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	t.Active = active == 1
	t.CreatedAt = parseTime(createdAt)
	t.UpdatedAt = parseTime(updatedAt)
	return t, nil
}

func (r *TestimonialRepo) Save(ctx context.Context, t *domain.Testimonial) error {
	_, err := exec(ctx, r.db,
		`INSERT INTO testimonials (`+testimonialCols+`)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET name=excluded.name, text=excluded.text,
		   rating=excluded.rating, avatar_url=excluded.avatar_url,
		   active=excluded.active, updated_at=excluded.updated_at`,
		t.ID, t.Name, t.Text, t.Rating, t.AvatarURL, boolInt(t.Active), t.CreatedAt, t.UpdatedAt,
	)
	return err
}

func (r *TestimonialRepo) FindByID(ctx context.Context, id string) (*domain.Testimonial, error) {
	row := queryRow(ctx, r.db, `SELECT `+testimonialCols+` FROM testimonials WHERE id = ?`, id)
	return scanTestimonial(row)
}

func (r *TestimonialRepo) ListActive(ctx context.Context) ([]*domain.Testimonial, error) {
	rows, err := queryRows(ctx, r.db,
		`SELECT `+testimonialCols+` FROM testimonials WHERE active = 1 ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanTestimonials(rows)
}

func (r *TestimonialRepo) ListAll(ctx context.Context) ([]*domain.Testimonial, error) {
	rows, err := queryRows(ctx, r.db,
		`SELECT `+testimonialCols+` FROM testimonials ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanTestimonials(rows)
}

func (r *TestimonialRepo) Delete(ctx context.Context, id string) error {
	_, err := exec(ctx, r.db, `DELETE FROM testimonials WHERE id = ?`, id)
	return err
}

func scanTestimonials(rows *sql.Rows) ([]*domain.Testimonial, error) {
	var testimonials []*domain.Testimonial
	for rows.Next() {
		t, err := scanTestimonial(rows)
		if err != nil {
			return nil, err
		}
		testimonials = append(testimonials, t)
	}
	return testimonials, rows.Err()
}
