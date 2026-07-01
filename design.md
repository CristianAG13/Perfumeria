# Design: Sistema de Gestión Perfumería A y F (MVP)

## Technical Approach

Backend Go con arquitectura hexagonal estricta. El dominio (entidades, value objects, casos de uso) vive en `internal/domain` y `internal/application`, sin imports de SQLite, HTTP ni nada externo. Los adapters (`internal/adapters/...`) implementan los ports definidos en `application/`. Wails v2 embebe el bundle React compilado y expone el binario como `.exe` nativo. SQLite como única persistencia, en un solo archivo `perfumeria.db` junto al ejecutable.

## Architecture Decisions

### Decision: Hexagonal con ports en `application/`, impls en `adapters/`

**Choice**: Casos de uso definen interfaces (`ProductRepository`, `SaleRepository`); adapters las implementan.
**Alternatives**: Capas tradicionales (repo → service → handler), monolito sin separación.
**Rationale**: Cambiar SQLite por Postgres mañana, o exponer API a web real, no toca el dominio. La inversión de dependencias es el precio a pagar una sola vez y los beneficios duran años.

### Decision: `modernc.org/sqlite` (puro Go) sobre `mattn/go-sqlite3`

**Choice**: Driver SQLite 100% Go.
**Alternatives**: `mattn/go-sqlite3` (requiere CGO con gcc en Windows).
**Rationale**: CGO en Windows duele (toolchain C, problemas de build, distribución). Puro Go = `go build` y listo, sin DLLs externas.

### Decision: Wails v2 sobre Wails v3 / Electron / Tauri

**Choice**: Wails v2 con WebView2 (ya viene en Windows 10/11).
**Alternatives**: Electron (binarios enormes, RAM), Tauri (Rust, doble stack).
**Rationale**: Un solo lenguaje backend, WebView2 nativo, binario pequeño, ya tenemos Go como stack acordado.

### Decision: `chi` como router HTTP

**Choice**: `github.com/go-chi/chi/v5`.
**Alternatives**: `gin` (más rápido en benchmarks pero más opinado), `net/http` puro (más verboso).
**Rationale**: chi es minimalista, idiomático, middleware chainable, compatible con `net/http` estándar. Para una API interna no necesitamos el DSL de gin.

### Decision: UUIDs como strings para IDs públicos, INTEGER autoincrement para FKs internas

**Choice**: IDs de dominio son UUID v4 (string), PKs de DB son INTEGER autoincrement. Mapeo en repositorio.
**Alternatives**: UUIDs en DB (más espacio, índices más lentos), enteros everywhere (acopla dominio a DB).
**Rationale**: Dominio portable, DB eficiente. Trade-off menor: hay un mapping, pero queda aislado en el adapter.

### Decision: Stock como suma de movimientos (event sourcing parcial), no columna `current_stock`

**Choice**: `stock_movements` es la fuente de verdad. Stock actual = `SUM(quantity) WHERE product_id = X`.
**Alternatives**: Columna desnormalizada `products.current_stock` actualizada por triggers/transacciones.
**Rationale**: Auditoría completa gratis, regenerar stock = `SUM`, imposible de corromper por bug en UPDATE. Con índice en `product_id` el `SUM` es <1ms.

### Decision: Money como `int64` centavos en dominio, formateo en UI

**Choice**: Tipo `Money` en `domain/money.go` que envuelve `int64` representando centavos.
**Alternatives**: `float64` (impreciso, error clásico con 0.1+0.2).
**Rationale**: NUNCA se usa float para dinero. Centavos en int64 eliminan redondeos. Display formatea en pesos.

### Decision: React Router v6 + TanStack Query

**Choice**: React Router para navegación, TanStack Query para state de servidor.
**Alternatives**: Redux/Zustand para todo, fetch manual con useEffect.
**Rationale**: TanStack Query maneja caché, revalidación y loading states. No reinventamos la rueda. Para 5 pantallas no necesitamos store global.

## Data Flow

Venta (caso crítico, atraviesa todas las capas):

```
[React: SalePage]
     │ submit(saleForm)
     ▼
[HTTP POST /api/sales]  ← chi router
     │
     ▼
[RegisterSaleHandler]  ← adapter/http
     │ valida DTO, llama al caso de uso
     ▼
[RegisterSale.Execute]  ← application/usecase
     │ 1. Load products
     │ 2. Validate stock
     │ 3. Build Sale aggregate
     │ 4. tx.Begin
     │ 5. saleRepo.Save(sale)
     │ 6. stockRepo.Append(movements)
     │ 7. tx.Commit
     ▼
[SQLite] ← una sola transacción ACID
     │
     ▼
Response: Sale JSON → React actualiza UI
```

## File Changes

| Path | Action | Description |
|---|---|---|
| `cmd/perfumeria/main.go` | Create | Entry point, wiring de dependencias con composition root |
| `internal/domain/product.go` | Create | Entidad Product, errores de dominio |
| `internal/domain/customer.go` | Create | Entidad Customer |
| `internal/domain/sale.go` | Create | Sale aggregate + SaleLine + value objects |
| `internal/domain/stock_movement.go` | Create | StockMovement entity |
| `internal/domain/money.go` | Create | Tipo Money (int64 centavos) |
| `internal/domain/errors.go` | Create | Errores de dominio tipados (NotFound, InsufficientStock, etc.) |
| `internal/application/ports/repositories.go` | Create | Interfaces: ProductRepository, CustomerRepository, SaleRepository, StockRepository |
| `internal/application/usecase/products/` | Create | CreateProduct, UpdateProduct, DeactivateProduct, SearchProducts |
| `internal/application/usecase/customers/` | Create | CreateCustomer, UpdateCustomer, SearchCustomers, GetHistory |
| `internal/application/usecase/sales/` | Create | RegisterSale, CancelSale, QuerySales |
| `internal/application/usecase/stock/` | Create | RecordMovement, AdjustStock, GetCurrentStock, ListLowStock |
| `internal/application/usecase/reporting/` | Create | DailySales, TopProducts, LowStock |
| `internal/adapters/persistence/sqlite/db.go` | Create | Conexión, migración, tx helper |
| `internal/adapters/persistence/sqlite/mappers.go` | Create | Conversión domain ↔ row |
| `internal/adapters/persistence/sqlite/product_repo.go` | Create | Implementación ProductRepository |
| `internal/adapters/persistence/sqlite/customer_repo.go` | Create | Implementación CustomerRepository |
| `internal/adapters/persistence/sqlite/sale_repo.go` | Create | Implementación SaleRepository |
| `internal/adapters/persistence/sqlite/stock_repo.go` | Create | Implementación StockRepository |
| `internal/adapters/http/router.go` | Create | Setup chi, middlewares, rutas |
| `internal/adapters/http/handlers/*.go` | Create | Handlers por recurso, DTOs, validación |
| `migrations/0001_initial.sql` | Create | Esquema: products, customers, sales, sale_lines, stock_movements |
| `frontend/src/main.tsx` | Create | Entry React |
| `frontend/src/App.tsx` | Create | Router + layout |
| `frontend/src/pages/Products.tsx` | Create | ABM productos |
| `frontend/src/pages/Customers.tsx` | Create | ABM clientes |
| `frontend/src/pages/Sales.tsx` | Create | Punto de venta |
| `frontend/src/pages/SaleHistory.tsx` | Create | Historial de ventas |
| `frontend/src/pages/Reports.tsx` | Create | Reportes (3 tabs) |
| `frontend/src/components/...` | Create | Componentes reutilizables (Button, Input, Table, Modal) |
| `frontend/src/lib/api.ts` | Create | Cliente HTTP tipado para el backend |
| `wails.json` | Create | Config Wails (proyecto, build, bundle) |
| `go.mod` / `go.sum` | Create | Dependencias Go |
| `package.json` / `tsconfig.json` | Create | Dependencias React |
| `Makefile` | Create | Targets: dev, build, test, migrate |

## Interfaces / Contracts

```go
// internal/application/ports/repositories.go
type ProductRepository interface {
    Save(ctx context.Context, p *domain.Product) error
    FindByID(ctx context.Context, id string) (*domain.Product, error)
    FindByBarcode(ctx context.Context, barcode string) (*domain.Product, error)
    Search(ctx context.Context, query SearchProductsQuery) ([]*domain.Product, error)
    ListBelowMinimum(ctx context.Context) ([]*domain.Product, error)
}

type SaleRepository interface {
    Save(ctx context.Context, s *domain.Sale) error
    FindByID(ctx context.Context, id string) (*domain.Sale, error)
    FindByCustomer(ctx context.Context, customerID string, from, to time.Time) ([]*domain.Sale, error)
    FindByDateRange(ctx context.Context, from, to time.Time) ([]*domain.Sale, error)
}

type StockRepository interface {
    Append(ctx context.Context, m *domain.StockMovement) error
    CurrentStock(ctx context.Context, productID string) (int, error)
    ListLowStock(ctx context.Context) ([]LowStockItem, error)
}

// Use case — application/usecase/sales/register.go
type RegisterSale struct {
    products ProductRepository
    sales    SaleRepository
    stock    StockRepository
    tx       Transactor  // port para transacciones
}

func (uc *RegisterSale) Execute(ctx context.Context, input RegisterSaleInput) (*domain.Sale, error)
```

API HTTP (subset representativo):

| Method | Path | Handler | Request DTO | Response |
|---|---|---|---|---|
| POST | `/api/products` | CreateProduct | CreateProductRequest | ProductResponse |
| GET | `/api/products?q=...` | SearchProducts | - | `[]ProductResponse` |
| POST | `/api/sales` | RegisterSale | RegisterSaleRequest | SaleResponse |
| GET | `/api/sales?from=...&to=...` | QuerySales | - | `[]SaleResponse` |
| POST | `/api/sales/{id}/cancel` | CancelSale | `{reason}` | SaleResponse |
| GET | `/api/reports/daily?date=...` | DailyReport | - | DailyReportResponse |
| GET | `/api/reports/top-products?from=...&to=...&limit=10` | TopProducts | - | `[]TopProductResponse` |

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Domain | Entidades, value objects, invariantes | Tests unitarios en `domain/*_test.go` con stdlib `testing` |
| Application | Casos de uso con repositorios mockeados | Tests unitarios con interfaces mock generadas a mano (sin librería pesada) |
| Adapters (SQLite) | Repositorios con DB en memoria `:memory:` | Tests de integración que ejecutan migrations + repos |
| HTTP | Handlers con `httptest` | Tests de contrato request/response |
| E2E | Flujo crítico: crear producto → vender → ver reporte | Test que levanta el backend en memoria + llama HTTP real |

Smoke test manual: abrir la app, registrar una venta, ver el reporte del día.

## Migration / Rollout

No hay sistema previo. La primera ejecución corre `0001_initial.sql` que crea todas las tablas. Seeds opcionales: 5 productos de ejemplo y 1 cliente walk-in. Sin feature flags, es el MVP completo.

## Open Questions

- [ ] ¿Confirmás el seed inicial de 5 productos o querés arrancar con DB vacía?
- [ ] ¿Idioma de la UI: español neutro o regional (Argentina)?
- [ ] ¿La cancelación de venta pide confirmación con un modal o un input de razón obligatorio?
