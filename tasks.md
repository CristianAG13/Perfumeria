# Tasks: Sistema de Gestión Perfumería A y F (MVP)

## Phase 1: Foundation (Infraestructura)

- [x] 1.1 Inicializar módulo Go (`go mod init github.com/.../perfumeria`) y crear estructura de carpetas `cmd/`, `internal/{domain,application,adapters}/`
- [x] 1.2 Instalar dependencias: `chi/v5`, `modernc.org/sqlite`, `google/uuid`, `golang-migrate`
- [x] 1.3 Crear `internal/domain/money.go` con tipo `Money` (int64 centavos) + tests
- [x] 1.4 Crear `internal/domain/errors.go` con errores tipados (`ErrNotFound`, `ErrInsufficientStock`, `ErrDuplicateBarcode`, etc.)
- [x] 1.5 Crear entidades de dominio: `product.go`, `customer.go`, `stock_movement.go`, `sale.go` + tests de invariantes
- [x] 1.6 Definir ports en `internal/application/ports/repositories.go` (interfaces de repos)
- [x] 1.7 Definir port `Transactor` para transacciones + interface `UnitOfWork` si se prefiere
- [x] 1.8 Escribir `migrations/0001_initial.sql` con esquema: `products`, `customers`, `sales`, `sale_lines`, `stock_movements` + índices
- [x] 1.9 Implementar `internal/adapters/persistence/sqlite/db.go` (conexión, ejecución de migrations, `WithTx` helper)
- [x] 1.10 Crear `internal/adapters/persistence/sqlite/mappers.go` (conversión domain ↔ row)

## Phase 2: Repositorios SQLite (Adapter de Persistencia)

- [x] 2.1 Implementar `ProductRepository` con `Save`, `FindByID`, `FindByBarcode`, `Search`, `ListBelowMinimum` + tests con `:memory:`
- [x] 2.2 Implementar `CustomerRepository` con `Save`, `FindByID`, `Search` + tests
- [x] 2.3 Implementar `StockRepository` con `Append`, `CurrentStock` (SUM), `ListLowStock` + tests
- [x] 2.4 Implementar `SaleRepository` con `Save` (que persiste sale + líneas en tx), `FindByID`, `FindByCustomer`, `FindByDateRange` + tests
- [x] 2.5 Crear seed inicial: `migrations/0002_seed.sql` con 5 productos de ejemplo + cliente walk-in

## Phase 3: Casos de Uso (Application Layer)

- [x] 3.1 `application/usecase/products/create_product.go` + test con repo mock (valida barcode único, registra stock inicial)
- [x] 3.2 `application/usecase/products/update_product.go` + test (no permite cambiar barcode, advertencia precio< costo)
- [x] 3.3 `application/usecase/products/deactivate_product.go` + test (soft-delete preserva historial)
- [x] 3.4 `application/usecase/customers/create_customer.go` + test (tax id opcional, walk-in)
- [x] 3.5 `application/usecase/customers/update_customer.go` + test
- [x] 3.6 `application/usecase/stock/record_movement.go` + test (valida razón obligatoria en ajustes)
- [x] 3.7 `application/usecase/stock/adjust_stock.go` + test
- [x] 3.8 `application/usecase/sales/register_sale.go` + test (atomicidad: valida stock, persiste sale + líneas + stock_movements en una tx)
- [x] 3.9 `application/usecase/sales/cancel_sale.go` + test (registra stock_movement inverso tipo "cancellation")
- [x] 3.10 `application/usecase/reporting/daily_sales.go` + test (excluye canceladas)
- [x] 3.11 `application/usecase/reporting/top_products.go` + test
- [x] 3.12 `application/usecase/reporting/low_stock.go` + test (excluye inactivos)

## Phase 4: HTTP API (Adapter HTTP)

- [x] 4.1 `adapters/http/router.go` con chi setup + middlewares (logger, recover, CORS para dev)
- [x] 4.2 `adapters/http/dto.go` con structs request/response y funciones de mapeo
- [x] 4.3 Handlers de products: `POST /api/products`, `GET /api/products?q=`, `PATCH /api/products/{id}`, `DELETE /api/products/{id}`
- [x] 4.4 Handlers de customers: `POST`, `GET ?q=`, `PATCH`
- [x] 4.5 Handlers de sales: `POST /api/sales`, `GET ?from=&to=&customer=`, `POST /api/sales/{id}/cancel`
- [x] 4.6 Handlers de stock: `POST /api/stock/movements` (ajuste manual con razón)
- [x] 4.7 Handlers de reports: `GET /api/reports/daily?date=`, `/top-products?from=&to=&limit=`, `/low-stock`
- [ ] 4.8 Tests con `httptest` para cada handler (cubren happy path + error states de las specs)

## Phase 5: Composition Root + Wails

- [x] 5.1 `cmd/perfumeria/main.go`: composition root — instanciar DB, repos, casos de uso, router HTTP
- [x] 5.2 Configurar Wails v2: `wails.json` + `app.go` con `OnStartup` que monta el router en el contexto
- [x] 5.3 Embeber assets del frontend React compilado en el binario Go con `//go:embed`
- [x] 5.4 Makefile con targets: `dev` (wails dev), `build` (wails build → .exe), `test`, `migrate`

## Phase 6: Frontend React

- [x] 6.1 Inicializar proyecto Vite + React + TypeScript en `frontend/`, instalar React Router v6 + TanStack Query + Axios
- [x] 6.2 `lib/api.ts`: cliente HTTP tipado que envuelve el backend (funciones `createProduct`, `registerSale`, etc.)
- [x] 6.3 Componentes base: `Button`, `Input`, `Select`, `Table`, `Modal`, `Toast` (estilos con Tailwind o CSS modules)
- [x] 6.4 `App.tsx` con router + layout (sidebar con nav a 5 secciones)
- [x] 6.5 Página `Products.tsx`: tabla con búsqueda, modal de alta/edición, botón desactivar
- [x] 6.6 Página `Customers.tsx`: tabla con búsqueda, modal de alta/edición
- [x] 6.7 Página `Sales.tsx` (Punto de Venta): input de búsqueda de producto, carrito de líneas, selección de cliente, medios de pago, total
- [x] 6.8 Página `SaleHistory.tsx`: tabla con filtro por fecha y cliente, botón cancelar con modal de razón obligatoria
- [x] 6.9 Página `Reports.tsx` con 3 tabs: Ventas del día, Más vendidos, Stock bajo mínimo
- [x] 6.10 i18n: todas las strings en español neutro centralizadas en un objeto `messages`

## Phase 7: E2E + Verificación

- [ ] 7.1 Test E2E del flujo crítico: crear producto → crear cliente → registrar venta → verificar stock descontado → cancelar venta → verificar stock restaurado
- [ ] 7.2 Test E2E de reportes: registrar 3 ventas en distintas fechas → consultar top products y daily report
- [ ] 7.3 Smoke test manual: `wails dev`, abrir la app, recorrer las 5 pantallas
- [ ] 7.4 Validar contra specs: cada `Scenario` de cada `Requirement` debe tener al menos un test que lo cubra (unit, integración o E2E)
- [ ] 7.5 Backup manual: copiar `perfumeria.db` y verificar que la copia abre sin corrupción
