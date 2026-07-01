# Reporting Specification

## Purpose

Proveer al operador información agregada sobre las operaciones del negocio para la toma de decisiones diarias: ventas por período, productos más vendidos y alertas de stock.

## Requirements

### Requirement: Daily Sales Report

The system MUST provide a sales report for a given date (or date range) showing total amount, number of sales, and breakdown by payment method.

#### Scenario: Report for a day with sales

- GIVEN 3 sales on 2026-05-20: one for $1000 cash, one for $2000 card, one for $500 cash
- WHEN the operator requests the report for 2026-05-20
- THEN total amount is $3500
- AND number of sales is 3
- AND cash total is $1500 with 2 sales
- AND card total is $2000 with 1 sale

#### Scenario: Report for a day with no sales

- GIVEN no sales on 2026-05-21
- WHEN the operator requests the report for 2026-05-21
- THEN the system returns total $0, 0 sales, and empty breakdown

### Requirement: Top Selling Products Report

The system MUST provide a report of the top N products by quantity sold within a date range.

#### Scenario: Top 10 products of the week

- GIVEN sales of the last 7 days totaling 50 different products sold
- WHEN the operator requests top 10 products for that range
- THEN the system returns exactly 10 products
- AND they are ordered by total quantity sold descending
- AND each product shows total quantity and total revenue

#### Scenario: Top products excluding cancelled sales

- GIVEN a sale that was cancelled after being recorded
- WHEN the operator requests the top products report
- THEN cancelled sales are excluded from totals

### Requirement: Low Stock Report

The system MUST provide a list of active products whose current stock is at or below their minimum stock.

#### Scenario: List low stock products

- GIVEN product A (stock 3, min 5), product B (stock 10, min 5), product C (stock 5, min 5)
- WHEN the operator requests the low stock report
- THEN products A and C are returned
- AND they are ordered by stock ascending (A first, then C)
- AND each row shows current stock, minimum stock and deficit (min - current)

#### Scenario: Inactive products are excluded

- GIVEN an inactive product with stock 0 and min 5
- WHEN the operator requests the low stock report
- THEN the inactive product is NOT included
