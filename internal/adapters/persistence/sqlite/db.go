package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	_ "modernc.org/sqlite"
)

type DB struct {
	*sql.DB
	path string
}

func NewDB(path string) (*DB, error) {
	if path == "" {
		exe, err := os.Executable()
		if err != nil {
			return nil, fmt.Errorf("get executable: %w", err)
		}
		path = filepath.Join(filepath.Dir(exe), "perfumeria.db")
	}

	db, err := sql.Open("sqlite", path+"?_pragma=journal_mode(WAL)&_pragma=foreign_keys(ON)")
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping sqlite: %w", err)
	}

	return &DB{DB: db, path: path}, nil
}

func (d *DB) Path() string { return d.path }

func (d *DB) RunMigrations(ctx context.Context) error {
	// Ensure the tracking table exists (must run outside the version loop).
	if _, err := d.DB.ExecContext(ctx,
		`CREATE TABLE IF NOT EXISTS schema_migrations (
			version INTEGER PRIMARY KEY,
			applied_at TEXT NOT NULL DEFAULT (datetime('now'))
		)`); err != nil {
		return fmt.Errorf("create schema_migrations table: %w", err)
	}

	// Collect already-applied versions.
	applied := map[int]bool{}
	rows, err := d.DB.QueryContext(ctx, `SELECT version FROM schema_migrations ORDER BY version`)
	if err != nil {
		return fmt.Errorf("query applied migrations: %w", err)
	}
	for rows.Next() {
		var v int
		if err := rows.Scan(&v); err != nil {
			rows.Close()
			return fmt.Errorf("scan migration version: %w", err)
		}
		applied[v] = true
	}
	rows.Close()

	for _, m := range migrations {
		if applied[m.version] {
			continue
		}
		if _, err := d.DB.ExecContext(ctx, m.sql); err != nil {
			// tolerate ALTER TABLE ADD COLUMN on an already-existing column
			if strings.Contains(err.Error(), "duplicate column") {
				goto record
			}
			return &ErrMigrationFailed{Version: m.version, Desc: m.desc, Err: err}
		}
	record:
		if _, err := d.DB.ExecContext(ctx,
			`INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)`, m.version,
		); err != nil {
			return fmt.Errorf("record migration v%d: %w", m.version, err)
		}
	}

	return nil
}

func (d *DB) ExecContext(ctx context.Context, query string) (sql.Result, error) {
	return d.DB.ExecContext(ctx, query)
}

func (d *DB) WithinTx(ctx context.Context, fn func(ctx context.Context) error) error {
	tx, err := d.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}

	txCtx := context.WithValue(ctx, txKey{}, tx)

	if err := fn(txCtx); err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("rollback: %v (original: %w)", rbErr, err)
		}
		return err
	}

	return tx.Commit()
}

type txKey struct{}

func TxFromContext(ctx context.Context) (*sql.Tx, bool) {
	tx, ok := ctx.Value(txKey{}).(*sql.Tx)
	return tx, ok
}

func (d *DB) Close() error {
	return d.DB.Close()
}
