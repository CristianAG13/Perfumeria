package sqlite

import (
	"context"
	"database/sql"
	"errors"

	"github.com/ayf/perfumeria/internal/domain"
)

type UserRepo struct {
	db *DB
}

func NewUserRepo(db *DB) *UserRepo {
	return &UserRepo{db: db}
}

const userCols = "id, username, name, last_name, email, email_verified, google_id, password_hash, phone, role, blocked, created_at, updated_at"

func scanUser(row interface{ Scan(dest ...any) error }) (*domain.User, error) {
	u := &domain.User{}
	var email, googleID sql.NullString
	var emailVerified, blocked int
	err := row.Scan(&u.ID, &u.Username, &u.Name, &u.LastName, &email, &emailVerified, &googleID, &u.PasswordHash, &u.Phone, &u.Role, &blocked, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	u.Email = email.String
	u.GoogleID = googleID.String
	u.EmailVerified = emailVerified == 1
	u.Blocked = blocked == 1
	return u, nil
}

func (r *UserRepo) FindByUsername(ctx context.Context, username string) (*domain.User, error) {
	row := queryRow(ctx, r.db, `SELECT `+userCols+` FROM users WHERE username = ?`, username)
	u, err := scanUser(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return u, err
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	row := queryRow(ctx, r.db, `SELECT `+userCols+` FROM users WHERE email = ?`, email)
	u, err := scanUser(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return u, err
}

func (r *UserRepo) FindByGoogleID(ctx context.Context, googleID string) (*domain.User, error) {
	row := queryRow(ctx, r.db, `SELECT `+userCols+` FROM users WHERE google_id = ?`, googleID)
	u, err := scanUser(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return u, err
}

func (r *UserRepo) FindByID(ctx context.Context, id string) (*domain.User, error) {
	row := queryRow(ctx, r.db, `SELECT `+userCols+` FROM users WHERE id = ?`, id)
	u, err := scanUser(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	return u, err
}

func (r *UserRepo) Create(ctx context.Context, user *domain.User) error {
	emailVerified := 0
	if user.EmailVerified {
		emailVerified = 1
	}
	blocked := 0
	if user.Blocked {
		blocked = 1
	}
	_, err := exec(ctx, r.db,
		`INSERT INTO users (id, username, name, last_name, email, email_verified, google_id, password_hash, phone, role, blocked, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		user.ID, user.Username, user.Name, user.LastName, nullableStr(user.Email), emailVerified, nullableStr(user.GoogleID),
		user.PasswordHash, user.Phone, user.Role, blocked, user.CreatedAt, user.UpdatedAt,
	)
	return err
}

func (r *UserRepo) Update(ctx context.Context, user *domain.User) error {
	emailVerified := 0
	if user.EmailVerified {
		emailVerified = 1
	}
	blocked := 0
	if user.Blocked {
		blocked = 1
	}
	_, err := exec(ctx, r.db,
		`UPDATE users SET username=?, name=?, last_name=?, email=?, email_verified=?, google_id=?, password_hash=?, phone=?, role=?, blocked=?, updated_at=? WHERE id=?`,
		user.Username, user.Name, user.LastName, nullableStr(user.Email), emailVerified, nullableStr(user.GoogleID),
		user.PasswordHash, user.Phone, user.Role, blocked, user.UpdatedAt, user.ID,
	)
	return err
}

func (r *UserRepo) ListByRole(ctx context.Context, role string) ([]*domain.User, error) {
	rows, err := queryRows(ctx, r.db, `SELECT `+userCols+` FROM users WHERE role = ? ORDER BY username`, role)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *UserRepo) Delete(ctx context.Context, id string) error {
	_, err := exec(ctx, r.db, `DELETE FROM users WHERE id = ?`, id)
	return err
}

func (r *UserRepo) ListAll(ctx context.Context) ([]*domain.User, error) {
	rows, err := queryRows(ctx, r.db, `SELECT `+userCols+` FROM users ORDER BY role, username`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func nullableStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
