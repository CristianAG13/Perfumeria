package sqlite

import "fmt"

type migration struct {
	version int
	desc    string
	sql     string
}

// migrations is the ordered list of all database schema changes.
// Once applied, a migration is never modified — add new entries at the end.
var migrations = []migration{
	{version: 1, desc: "schema inicial", sql: migrationInitial},
	{version: 2, desc: "gender en products", sql: `ALTER TABLE products ADD COLUMN gender TEXT NOT NULL DEFAULT 'unisex'`},
	{version: 3, desc: "discount_percent en products", sql: `ALTER TABLE products ADD COLUMN discount_percent INTEGER NOT NULL DEFAULT 0`},
	{version: 4, desc: "description en products", sql: `ALTER TABLE products ADD COLUMN description TEXT NOT NULL DEFAULT ''`},
	{version: 5, desc: "email en users", sql: `ALTER TABLE users ADD COLUMN email TEXT`},
	{version: 6, desc: "email_verified en users", sql: `ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0`},
	{version: 7, desc: "google_id en users", sql: `ALTER TABLE users ADD COLUMN google_id TEXT`},
	{version: 8, desc: "name en users", sql: `ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT ''`},
	{version: 9, desc: "poblar email desde username", sql: `UPDATE users SET email = username WHERE email IS NULL`},
	{version: 10, desc: "poblar name desde username", sql: `UPDATE users SET name = username WHERE name = ''`},
	{version: 11, desc: "last_name en users", sql: `ALTER TABLE users ADD COLUMN last_name TEXT NOT NULL DEFAULT ''`},
	{version: 12, desc: "phone en users", sql: `ALTER TABLE users ADD COLUMN phone TEXT NOT NULL DEFAULT ''`},
	{version: 13, desc: "blocked en users", sql: `ALTER TABLE users ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0`},
	{version: 14, desc: "last_name en customers", sql: `ALTER TABLE customers ADD COLUMN last_name TEXT NOT NULL DEFAULT ''`},
	{version: 15, desc: "notes en customers", sql: `ALTER TABLE customers ADD COLUMN notes TEXT NOT NULL DEFAULT ''`},
	{version: 16, desc: "tabla testimonials", sql: `
		CREATE TABLE IF NOT EXISTS testimonials (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			text TEXT NOT NULL,
			rating INTEGER NOT NULL DEFAULT 5,
			avatar_url TEXT NOT NULL DEFAULT '',
			active INTEGER NOT NULL DEFAULT 1,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)
	`},
	{version: 17, desc: "customer records para users existentes",
		sql: `INSERT OR IGNORE INTO customers (id, name, phone, email, notes, created_at, updated_at)
		 SELECT u.id, u.name, u.phone, u.email, '', u.created_at, u.updated_at
		 FROM users u WHERE u.role = 'customer'`},
}

// latestVersion returns the highest version number among all migrations.
func latestVersion() int {
	if len(migrations) == 0 {
		return 0
	}
	return migrations[len(migrations)-1].version
}

const migrationInitial = `
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    category_id TEXT NOT NULL DEFAULT '',
    category_name TEXT NOT NULL DEFAULT '',
    barcode TEXT NOT NULL UNIQUE,
    image TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    sale_price_cents INTEGER NOT NULL,
    cost_price_cents INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    show_in_store INTEGER NOT NULL DEFAULT 0,
    price_below_cost INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    last_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    total_cents INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    cancel_reason TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

CREATE TABLE IF NOT EXISTS sale_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    discount_cents INTEGER NOT NULL DEFAULT 0,
    subtotal_cents INTEGER NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_sale_lines_sale ON sale_lines(sale_id);

CREATE TABLE IF NOT EXISTS payment_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id TEXT NOT NULL,
    method TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);

CREATE INDEX IF NOT EXISTS idx_payment_lines_sale ON payment_lines(sale_id);

CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    sale_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_sale ON stock_movements(sale_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    email TEXT UNIQUE,
    email_verified INTEGER NOT NULL DEFAULT 0,
    google_id TEXT,
    password_hash TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'admin',
    blocked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);

CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`

// ErrMigrationFailed is returned when a migration step fails to execute.
// Wraps the original error with the migration version for diagnostics.
type ErrMigrationFailed struct {
	Version int
	Desc    string
	Err     error
}

func (e *ErrMigrationFailed) Error() string {
	return fmt.Sprintf("migration v%d (%s): %v", e.Version, e.Desc, e.Err)
}

func (e *ErrMigrationFailed) Unwrap() error { return e.Err }
