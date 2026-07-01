# Products Specification

## Purpose

Gestionar el catálogo de productos comercializados por la perfumería. Un producto representa un artículo vendible identificable, con precio, costo y datos fiscales básicos.

## Requirements

### Requirement: Create Product

The system MUST allow creating a new product with name, brand, category, barcode, sale price, cost price, minimum stock and initial stock.

#### Scenario: Successful creation with valid data

- GIVEN a unique barcode and valid positive prices
- WHEN the operator submits the create form
- THEN the product is persisted with a generated id
- AND initial stock is recorded as a stock movement of type "initial"

#### Scenario: Duplicate barcode rejection

- GIVEN an existing product with barcode "7790000001"
- WHEN the operator attempts to create another product with the same barcode
- THEN the system rejects the request
- AND returns a "barcode already exists" error

#### Scenario: Sale price below cost warning

- GIVEN a product with cost 1000
- WHEN the operator creates the product with sale price 800
- THEN the system creates the product
- AND flags a warning that sale price is below cost

### Requirement: Update Product

The system MUST allow updating name, brand, category, sale price, cost price and minimum stock of an existing product.

#### Scenario: Update price and minimum stock

- GIVEN an existing product with sale price 1000 and minimum stock 5
- WHEN the operator updates sale price to 1200 and minimum stock to 10
- THEN the system persists the new values
- AND previous sale prices in historical sales remain unchanged

#### Scenario: Update non-existent product

- GIVEN no product with id 999
- WHEN the operator attempts to update product 999
- THEN the system returns a "product not found" error

### Requirement: Deactivate Product

The system MUST allow soft-deleting a product (deactivation) preserving historical sales references.

#### Scenario: Deactivate product with sales history

- GIVEN a product that appears in 20 past sales
- WHEN the operator deactivates the product
- THEN the product is marked as inactive
- AND it does not appear in the active product search
- AND historical sales still show the product name and the price at the time of sale

### Requirement: Search Products

The system MUST allow searching active products by name, brand, category or barcode, returning matches in less than 200ms for catalogs up to 10,000 products.

#### Scenario: Search by partial name

- GIVEN a catalog with "Perfume Chanel N°5" and "Perfume Dior Sauvage"
- WHEN the operator types "chanel"
- THEN the system returns "Perfume Chanel N°5" as the first result

#### Scenario: Search by exact barcode

- GIVEN a product with barcode "7790000001"
- WHEN the operator scans or types "7790000001"
- THEN the system returns exactly that product
