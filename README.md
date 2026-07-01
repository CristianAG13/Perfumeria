# Perfumería A y F — Sistema de Gestión + Tienda Online

Sistema completo para perfumería física: gestión interna (productos, ventas, stock, clientes, reportes) + tienda online con landing, carrito, checkout y autenticación. Backend Go + Frontend React en un solo binario embebido.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Go 1.26+, chi router, modernc/sqlite (sin CGO) |
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS 4, TanStack Query, React Router v6 |
| DB | SQLite embebido (WAL mode, foreign keys, FTS5 para búsqueda) |
| Packaging | Binario único `.exe` con `//go:embed` del frontend compilado |
| PWA | vite-plugin-pwa, service worker con precaching + offline para store API |

## Build & Ejecución

```bash
# 1. Compilar el frontend
cd frontend && npm install && npm run build
cd ..

# 2. Compilar el binario (embebe el frontend)
go build -o perfumeria.exe .

# 3. Ejecutar
.\perfumeria.exe
# Abrir http://localhost:8080
```

### Desarrollo (hot reload)

```bash
# Terminal 1: backend
go run .

# Terminal 2: frontend (con proxy a :8080)
cd frontend && npm run dev
# Abrir http://localhost:5173
```

## Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `8080` | Puerto del servidor HTTP |
| `DB_PATH` | `./perfumeria.db` | Ruta del archivo SQLite |
| `JWT_SECRET` | (generado) | Secreto para firmar tokens JWT |
| `GOOGLE_CLIENT_ID` | — | Client ID de Google OAuth |
| `GINIPIO_API_KEY` | — | API Key para geolocalización |
| `SMTP_HOST` | — | Host SMTP para envío de emails |
| `SMTP_PORT` | — | Puerto SMTP |
| `SMTP_USER` | — | Usuario SMTP |
| `SMTP_PASS` | — | Contraseña SMTP |
| `NOTIFICATION_EMAIL` | (usa SMTP_USER) | Email para recibir notificaciones de pedidos |
| `CORS_ORIGIN` | `*` | Origen CORS permitido (producción: dominio exacto) |

## Funcionalidades

### 🏪 Tienda Online (Landing)
- **Landing atractiva** con carrusel hero, productos por categoría, gender filter (ella/él/unisex)
- **Catálogo de productos** con imágenes, precios, descuentos
- **Carrito de compras** lateral con cantidad, subtotales
- **Testimonios dinámicos** desde backend, admin CRUD + toggle activo/inactivo
- **SEO completo**: meta tags, Open Graph, Twitter Card, JSON-LD (schema.org/Store), sitemap.xml, robots.txt
- **PWA**: instalable como app en el celular, precarga de assets, offline parcial
- **Dark mode** nativo con toggle y persistencia

### 🔐 Autenticación & Roles
- Login con **email o username** (detecta @ automáticamente)
- **Google OAuth** con GIS (popup, token exchange)
- **Registro** con verificación por email
- **Refresh tokens** (access 30 min + refresh 7 días, auto-refresh en 401)
- **Roles**: `customer` (landing) y `admin` (dashboard completo)
- Recuperación de contraseña por email

### 📦 Gestión de Productos (Admin)
- ABM completo: nombre, marca, categoría, código de barras, gender, precios, stock mínimo, descuento
- **Subida de imágenes** vía upload a `./uploads/`, servidas como archivos estáticos
- Búsqueda por nombre, marca, código de barras
- Soft-delete (desactivación preserva historial)
- Alerta si precio de venta < precio de costo
- Control de visibilidad en tienda online

### 👥 Clientes
- ABM completo (nombre, teléfono, email, notas)
- Búsqueda por nombre, CUIT o teléfono
- Cliente "Consumidor Final" por defecto

### 📊 Stock
- **Event sourcing parcial**: cada movimiento queda registrado (tipo, cantidad, motivo, timestamp)
- Tipos: inicial, entrada, venta, ajuste, cancelación
- Stock actual = `SUM(quantity)` — imposible de corromper
- Stock negativo bloqueado en dominio
- Ajustes manuales requieren motivo obligatorio

### 🛒 Ventas (Punto de Venta)
- Búsqueda predictiva de productos por nombre o código
- Carrito con múltiples líneas, cantidad variable y descuento por ítem
- Medios de pago: efectivo, tarjeta, transferencia, otro
- Precio congelado al momento de la venta
- Validación de stock antes de confirmar (operación atómica)

### 📋 Historial de Ventas
- Filtro por rango de fechas y cliente
- Cancelación con modal y motivo obligatorio
- Stock se restaura automáticamente al cancelar

### 📈 Reportes
- **Ventas del día**: total facturado, cantidad, desglose por medio de pago
- **Más vendidos**: top N productos por cantidad en período (excluye canceladas)
- **Stock bajo**: productos activos con stock por debajo del mínimo

### 🛍️ Checkout (Cliente)
- **"Realizar pedido"** para usuarios autenticados: registra la venta en sistema con método "whatsapp"
- **Notificación por email** al administrador con detalle del pedido (productos, cantidades, total)
- Invitados: solo envío por WhatsApp

## Arquitectura

Hexagonal (Ports & Adapters):

```
main.go ─── http.Server
  ├── /api/* → chi router → handlers → use cases → repositorios (ports) → SQLite
  ├── /uploads/* → archivos estáticos (imágenes subidas)
  └── /* → SPA fallback (frontend embebido)
```

El dominio (`internal/domain/`) no importa SQLite ni HTTP. Los casos de uso (`internal/application/usecase/`) dependen de interfaces (`ports/`). Los adapters (`persistence/sqlite/`, `http/`) implementan esas interfaces.

### Flujo de una venta desde la tienda (checkout)

```
[Landing: Carrito] → click "Realizar pedido"
  │
  ▼
POST /api/store/checkout  ← autenticado con JWT
  │
  ▼
[StoreHandler.Checkout]  ← adapter/http
  │ 1. Decodifica items del carrito
  │ 2. Calcula totales
  │
  ▼
[RegisterSale.Execute]  ← use case
  │ 1. Valida stock de cada producto
  │ 2. Crea Sale + SaleLines + PaymentLine (whatsapp)
  │ 3. Crea StockMovements (venta, resta stock)
  │ 4. Persiste todo en una transacción ACID
  │
  ▼
[Email Notification]  ← si SMTP configurado
  │ Envía email HTML al admin con detalle del pedido
  │
  ▼
Response: "ok" → alert al cliente + WhatsApp
```

## Estructura del proyecto

```
├── main.go                                 # Entry point + embedding + graceful shutdown
├── internal/
│   ├── domain/                             # Entidades + value objects + errores
│   │   ├── product.go
│   │   ├── customer.go
│   │   ├── sale.go
│   │   ├── stock_movement.go
│   │   ├── category.go
│   │   ├── user.go
│   │   ├── testimonial.go
│   │   ├── money.go                        # int64 centavos
│   │   └── errors.go
│   ├── application/
│   │   ├── ports/                          # Interfaces (repos, email, transactor)
│   │   └── usecase/                        # Casos de uso por dominio
│   │       ├── products/
│   │       ├── customers/
│   │       ├── sales/
│   │       ├── stock/
│   │       ├── reporting/
│   │       ├── categories/
│   │       ├── auth/
│   │       └── testimonials/
│   └── adapters/
│       ├── persistence/sqlite/             # Repos + migraciones + mappers
│       ├── http/                           # Router + handlers + middleware
│       │   ├── handlers/
│       │   ├── middleware/                  # Auth, rate limit, CORS
│       │   ├── router.go
│       │   └── wiring.go                   # Composition root
│       └── email/                          # SMTP sender
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── icon.svg                        # PWA icon 512x512
│   │   ├── robots.txt
│   │   └── sitemap.xml
│   └── src/
│       ├── pages/                          # 18 páginas (admin + landing + auth)
│       ├── components/                     # UI kit + SEO + CartSidebar + etc.
│       ├── context/                        # AuthContext, ThemeContext
│       ├── lib/                            # api.ts, types.ts, format.ts
│       └── App.tsx                         # Router con layout + sidebar admin
├── uploads/                                # Imágenes subidas (runtime, no embebido)
├── Makefile
└── README.md
```

## API HTTP (principales endpoints)

### Públicos
| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/store/products` | Catálogo para tienda (filtro category_id, gender) |
| GET | `/api/store/categories` | Categorías activas |
| GET | `/api/testimonials` | Testimonios activos |
| POST | `/api/auth/login` | Login (email o username) |
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/google` | Google OAuth |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/verify-email` | Verificación de email |

### Autenticados (customer)
| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/auth/me` | Perfil del usuario |
| PATCH | `/api/auth/profile` | Actualizar perfil |
| POST | `/api/store/checkout` | Realizar pedido (registra venta) |

### Admin
| Método | Path | Descripción |
|--------|------|-------------|
| CRUD | `/api/products` | Gestión de productos |
| CRUD | `/api/categories` | Gestión de categorías |
| CRUD | `/api/customers` | Gestión de clientes |
| POST | `/api/sales` | Registrar venta |
| GET | `/api/sales` | Historial de ventas |
| POST | `/api/sales/{id}/cancel` | Cancelar venta |
| POST | `/api/stock/entries` | Entrada de stock |
| POST | `/api/stock/adjustments` | Ajuste manual |
| GET | `/api/reports/daily` | Reporte diario |
| GET | `/api/reports/top-products` | Productos más vendidos |
| GET | `/api/reports/low-stock` | Stock bajo |
| CRUD | `/api/admin/testimonials` | Gestión de testimonios |
| CRUD | `/api/admin/users` | Gestión de usuarios |
| POST | `/api/upload` | Subir imagen de producto |

## Testing

```bash
go test ./...           # Tests de dominio (27+ tests)
# Pendiente: tests de integración con SQLite :memory:
# Pendiente: tests de aplicación con mocks
```

## Roadmap / Pendientes

- [ ] Tests de integración (SQLite en memoria + handlers)
- [ ] Tests de aplicación (use cases con repositorios mockeados)
- [ ] Migraciones versionadas con golang-migrate
- [ ] Seed password por environment (hoy hardcodeado)
- [ ] Git init del repositorio
- [ ] Panel para que el cliente vea sus pedidos
- [ ] Deployment a producción
# Perfumeria
