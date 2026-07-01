package sqlite

import (
	"context"
	"database/sql"
)

func exec(ctx context.Context, db *DB, query string, args ...any) (sql.Result, error) {
	if tx, ok := TxFromContext(ctx); ok {
		return tx.ExecContext(ctx, query, args...)
	}
	return db.DB.ExecContext(ctx, query, args...)
}

func queryRows(ctx context.Context, db *DB, query string, args ...any) (*sql.Rows, error) {
	if tx, ok := TxFromContext(ctx); ok {
		return tx.QueryContext(ctx, query, args...)
	}
	return db.DB.QueryContext(ctx, query, args...)
}

// escapeLike escapa los caracteres comodín de LIKE (% y _) para que
// el usuario pueda buscar términos como "100%" o "test_" sin falsos positivos.
func escapeLike(s string) string {
	escaped := make([]byte, 0, len(s))
	for i := 0; i < len(s); i++ {
		switch s[i] {
		case '%', '_':
			escaped = append(escaped, '\\', s[i])
		default:
			escaped = append(escaped, s[i])
		}
	}
	return string(escaped)
}

// likePattern envuelve el término en % y escapa caracteres especiales de LIKE.
func likePattern(s string) string {
	return "%" + escapeLike(s) + "%"
}

func boolInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

func queryRow(ctx context.Context, db *DB, query string, args ...any) *sql.Row {
	if tx, ok := TxFromContext(ctx); ok {
		return tx.QueryRowContext(ctx, query, args...)
	}
	return db.DB.QueryRowContext(ctx, query, args...)
}
