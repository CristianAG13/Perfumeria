# Sales Specification

## Purpose

Registrar las transacciones de venta realizadas en la perfumería, asegurando la integridad del stock, la trazabilidad de los precios aplicados y la correcta asociación con clientes cuando aplique.

## Requirements

### Requirement: Register Sale

The system MUST allow registering a sale with one or more line items, a customer (optional, may be "walk-in"), payment method, and an optional global discount.

#### Scenario: Sale with multiple items, customer and cash payment

- GIVEN customer "Juan Pérez" and products A (price 1000, stock 10) and B (price 500, stock 5)
- WHEN the operator registers a sale with 2 units of A, 1 unit of B, customer Juan and payment "cash"
- THEN the sale is persisted with total 2500
- AND product A stock becomes 8
- AND product B stock becomes 4
- AND a stock movement of type "sale" is recorded for each item

#### Scenario: Sale with per-line discount

- GIVEN product A with price 1000
- WHEN the operator registers a sale with 1 unit of A and a line discount of 100
- THEN the line subtotal is 900
- AND the sale total reflects that adjustment

#### Scenario: Sale without customer (walk-in)

- GIVEN products A and B with sufficient stock
- WHEN the operator registers a sale without selecting a customer
- THEN the sale is persisted with customer null
- AND stock movements are still recorded

### Requirement: Reject Sale with Insufficient Stock

The system MUST reject an entire sale (atomically) if any line item exceeds available stock.

#### Scenario: Multi-item sale rejected because one item has no stock

- GIVEN product A with stock 5 and product B with stock 0
- WHEN the operator attempts a sale with 2 A and 1 B
- THEN the sale is rejected
- AND no stock movement is recorded for any product
- AND the error identifies product B as the cause

### Requirement: Freeze Price at Sale Time

The system MUST record the unit price of each line at the moment of the sale, regardless of subsequent product price changes.

#### Scenario: Historical sale shows original price

- GIVEN a sale registered on 2026-05-01 with product A at price 1000
- AND the product A price is updated to 1200 on 2026-05-15
- WHEN the operator views the sale from 2026-05-01
- THEN the line shows unit price 1000 (not 1200)

### Requirement: Cancel Sale

The system MUST allow cancelling a previously registered sale, restoring the stock of all its line items.

#### Scenario: Cancel a sale that reduced stock

- GIVEN a sale from yesterday that reduced product A stock from 10 to 7
- WHEN the operator cancels the sale with reason "customer return"
- THEN the sale is marked as cancelled
- AND a stock movement of type "cancellation" with quantity +3 is recorded for product A
- AND product A current stock becomes 10 again

#### Scenario: Cancelling an already-cancelled sale is rejected

- GIVEN a sale already cancelled
- WHEN the operator attempts to cancel it again
- THEN the system rejects the request
- AND returns "sale is already cancelled" error

### Requirement: Query Sales History

The system MUST allow querying sales by date range and/or customer, ordered by date descending.

#### Scenario: Sales of a specific day

- GIVEN sales registered on 2026-05-20 (5 sales) and 2026-05-21 (3 sales)
- WHEN the operator requests sales for 2026-05-20
- THEN the system returns exactly 5 sales
- AND the daily total is displayed

#### Scenario: Sales of a specific customer

- GIVEN customer Juan with 3 sales and customer María with 2 sales
- WHEN the operator filters sales by customer Juan
- THEN exactly 3 sales are returned
