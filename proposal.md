# Proposal: Sistema de Gestión Interno — Perfumería A y F (MVP)

## Intent

Construir el MVP del sistema de gestión interno para una perfumería física, que cubra el ciclo operativo diario: alta y mantenimiento de productos, control de stock, registro de ventas, administración de clientes y reportes básicos. La aplicación correrá como escritorio en una sola PC de la tienda, con la base de datos local.

El problema: hoy el negocio no tiene un sistema unificado — el control de stock, ventas y clientes se hace en papel o planillas sueltas, lo que genera errores de inventario, pérdida de ventas por falta de visibilidad y cero trazabilidad.

## Scope

### In Scope (MVP)
- ABM de Productos (nombre, marca, categoría, precio venta, costo, stock mínimo, código de barras)
- ABM de Clientes (nombre, DNI/CUIT, contacto, observaciones)
- Control de Stock con movimientos (entrada, salida por venta, ajuste manual)
- Registro de Ventas con múltiples ítems, descuento por ítem, medios de pago
- Búsqueda y consulta de historial de ventas
- Reportes básicos: ventas por día, productos más vendidos, stock bajo mínimo
- Persistencia local (SQLite embebido)
- Búsqueda rápida de productos por nombre/código en el punto de venta

### Out of Scope (deferido)
- Proveedores y órdenes de compra
- Cuentas corrientes y créditos a clientes
- Caja, turnos y arqueos
- Roles de usuario y autenticación
- Facturación electrónica / AFIP
- Sincronización en la nube o multi-sucursal
- App móvil

## Capabilities

### New Capabilities
- `products`: alta, baja, modificación, búsqueda y listado de productos
- `stock`: registro de movimientos, consulta de stock actual y alertas de stock bajo mínimo
- `customers`: alta, modificación, búsqueda y listado de clientes
- `sales`: registro de ventas con múltiples ítems, consulta de historial
- `reporting`: reportes de ventas, productos más vendidos, productos con stock bajo mínimo

### Modified Capabilities
- None (proyecto nuevo desde cero)

## Approach

**Arquitectura**: Hexagonal (Ports & Adapters) en backend Go. El dominio (entidades, casos de uso, reglas de negocio) vive en el centro y NO conoce nada de la UI ni de SQLite. Las dependencias apuntan hacia adentro.

**Capas**:
- `domain/`: entidades puras (Product, Customer, Sale, StockMovement) y reglas de negocio
- `application/`: casos de uso (CreateProduct, RegisterSale, AddStockMovement, etc.) que orquestan el dominio
- `adapters/persistence/`: implementación de repositorios con SQLite
- `adapters/http/`: API HTTP que expone los casos de uso
- `adapters/ui/` (React): frontend web embebido que consume la API HTTP

**Distribución**: El binario Go compila y embebe el bundle de React. Se distribuye como un único `.exe` para Windows. Al ejecutarse, levanta el servidor HTTP local en un puerto interno y abre la ventana nativa con WebView.

**Por qué Hexagonal y no capas tradicional**: permite cambiar SQLite por Postgres mañana, o exponer la misma API a una web real, sin tocar el dominio. Para un sistema que va a usarse 5+ años, esta decisión se paga sola.

**Stack técnico**:
- Backend: Go 1.22+ con `chi` o `gin` para HTTP
- Base de datos: SQLite (vía `modernc.org/sqlite` puro Go, sin CGO)
- Frontend: React 18 + Vite + TypeScript
- Empaquetado: `Wails v2` (integra backend Go + frontend web en un binario nativo Windows)
- Migrations: `golang-migrate` con archivos SQL versionados

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `domain/` | New | Entidades, value objects, errores de dominio |
| `application/` | New | Casos de uso (commands y queries) |
| `adapters/persistence/sqlite/` | New | Repositorios concretos con SQLite |
| `adapters/http/` | New | Handlers HTTP, DTOs, validación |
| `adapters/ui/` | New | React app: pantallas de productos, ventas, clientes, reportes |
| `migrations/` | New | Archivos SQL de esquema inicial |
| `cmd/app/main.go` | New | Entry point, configuración, wiring de dependencias |
| `go.mod` | New | Dependencias backend |
| `package.json` | New | Dependencias frontend |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stock negativo por ventas concurrentes | Low | Transacciones SQLite + validación en dominio (no permitir stock negativo) |
| Pérdida de datos por corrupción de SQLite | Med | Backup automático diario del archivo .db a carpeta local |
| UI lenta con miles de productos | Low | Paginación en listados, búsqueda por índice en SQLite |
| Cambios de precio históricos se pierden | Med | La venta guarda precio al momento — se congela, no se recalcula |
| Usuario no técnico | Med | UX simple, atajos de teclado, búsqueda predictiva |

## Rollback Plan

MVP nuevo, sin sistema previo que reemplazar. Si el proyecto se discontinúa, se elimina el binario y la carpeta de datos. No hay datos existentes en riesgo.

## Dependencies

- Wails v2 instalado en la máquina de desarrollo
- Go 1.22+ y Node 18+ como herramientas de build
- Windows 10/11 como sistema operativo objetivo

## Success Criteria

- [ ] El operador puede registrar una venta de 3 productos a un cliente en menos de 30 segundos
- [ ] El sistema descuenta stock automáticamente al registrar una venta
- [ ] Un producto con stock por debajo del mínimo aparece marcado y en el reporte correspondiente
- [ ] El reporte de ventas del día muestra total facturado y desglose por medio de pago
- [ ] La aplicación arranca en menos de 3 segundos en una PC con Windows 10
- [ ] La base de datos se puede respaldar copiando un solo archivo
