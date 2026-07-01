# Customers Specification

## Purpose

Gestionar la información de los clientes que compran en la perfumería, manteniendo un historial de sus compras para referencia y fidelización básica.

## Requirements

### Requirement: Create Customer

The system MUST allow creating a customer with name, tax id (DNI/CUIT), phone, email and notes.

#### Scenario: Successful creation with tax id

- GIVEN a unique tax id "20123456780"
- WHEN the operator submits a customer with that tax id
- THEN the customer is persisted with a generated id
- AND total purchases start at 0

#### Scenario: Customer without tax id (walk-in)

- GIVEN no tax id provided
- WHEN the operator creates a "walk-in" customer
- THEN the customer is persisted with tax id null
- AND can be used in sales

### Requirement: Update Customer

The system MUST allow updating name, tax id, phone, email and notes of an existing customer.

#### Scenario: Update phone and email

- GIVEN an existing customer
- WHEN the operator updates the phone and email fields
- THEN the system persists the new values
- AND historical sales still reference the same customer id

### Requirement: Search Customers

The system MUST allow searching customers by name, tax id or phone, returning matches in less than 200ms for up to 5,000 customers.

#### Scenario: Search by partial name

- GIVEN customers "Juan Pérez" and "Juana Díaz"
- WHEN the operator types "jua"
- THEN both customers are returned, ordered by name

#### Scenario: Search by exact tax id

- GIVEN a customer with tax id "20123456780"
- WHEN the operator types "20123456780"
- THEN exactly that customer is returned

### Requirement: Customer Purchase History

The system MUST expose, for a given customer, the list of their sales ordered by date descending with total amount.

#### Scenario: Retrieve history of a customer with 3 sales

- GIVEN a customer with sales on 2026-05-01, 2026-05-10 and 2026-05-20
- WHEN the operator opens the customer detail
- THEN the system returns the 3 sales in descending date order
- AND displays the total spent across all of them
