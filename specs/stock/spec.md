# Stock Specification

## Purpose

Gestionar la cantidad disponible de cada producto y mantener un historial auditable de todos los movimientos que afectan el inventario. La cantidad actual es siempre la suma de todos los movimientos registrados para un producto.

## Requirements

### Requirement: Record Stock Movement

The system MUST record every stock change as a movement with type, quantity, timestamp, reason and reference (sale id, adjustment id, etc.).

#### Scenario: Initial stock on product creation

- GIVEN a new product created with initial stock 50
- WHEN the product is persisted
- THEN a movement of type "initial" with quantity 50 is recorded
- AND current stock is 50

#### Scenario: Stock entry by purchase

- GIVEN a product with current stock 10
- WHEN the operator registers an entry of 40 units
- THEN a movement of type "entry" with quantity 40 is recorded
- AND current stock becomes 50

#### Scenario: Stock output by sale

- GIVEN a product with current stock 20
- WHEN a sale of 3 units is confirmed
- THEN a movement of type "sale" with quantity -3 and reference to the sale id is recorded
- AND current stock becomes 17

### Requirement: Block Sale with Insufficient Stock

The system MUST NOT allow a sale to reduce stock below zero for any product.

#### Scenario: Sale rejected when stock insufficient

- GIVEN a product with current stock 2
- WHEN a sale attempt includes 5 units of that product
- THEN the system rejects the entire sale
- AND returns "insufficient stock for product X" with current and requested quantities

#### Scenario: Partial sale with mixed stock

- GIVEN product A with stock 10 and product B with stock 1
- WHEN a sale attempt includes 5 units of A and 2 units of B
- THEN the system rejects the sale (B insufficient)
- AND no movement is recorded for any product (atomic operation)

### Requirement: Manual Stock Adjustment

The system MUST allow registering manual stock adjustments (positive or negative) with a mandatory reason.

#### Scenario: Adjustment with negative quantity and reason

- GIVEN a product with stock 30
- WHEN the operator registers an adjustment of -2 with reason "broken bottle"
- THEN a movement of type "adjustment" with quantity -2 and the reason is recorded
- AND current stock becomes 28

#### Scenario: Adjustment without reason is rejected

- GIVEN a product with stock 30
- WHEN the operator attempts an adjustment without a reason
- THEN the system rejects the request
- AND returns "reason is required" error

### Requirement: Query Current Stock

The system MUST provide the current stock for a given product calculated as the sum of all its movements.

#### Scenario: Current stock of a product with multiple movements

- GIVEN movements: initial +50, entry +20, sale -8, adjustment -2
- WHEN the operator queries current stock
- THEN the system returns 60

### Requirement: Stock Below Minimum Alert

The system MUST allow querying all active products whose current stock is less than or equal to their configured minimum stock.

#### Scenario: List products below minimum

- GIVEN product A (stock 3, min 5), product B (stock 10, min 5), product C (stock 5, min 5)
- WHEN the operator requests the "below minimum" report
- THEN the system returns A and C
- AND orders them by stock ascending
