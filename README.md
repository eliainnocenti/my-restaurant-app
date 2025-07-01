<!-- [![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/xnU44QZi) -->
# Exam #2: "Restaurant"

![polito_logo](resources/logo_polito.jpg)

## Student: s345388 INNOCENTI ELIA 

Text

## React Client Application Routes

- Route `/`: page content and purpose
- Route `/something/:param`: page content and purpose, param specification
- ...

## API Server

- POST `/api/login`
  - request parameters and request body content
  - response body content
- GET `/api/something`
  - request parameters
  - response body content
- POST `/api/something`
  - request parameters and request body content
  - response body content
- ...

## Database Tables

- Table `users` - contains user authentication data with columns: id (PK, auto-increment), email (unique), name, hash (password hash), salt, secret (2FA secret)
- Table `base_dishes` - contains available dish types with columns: id (PK, auto-increment), name (unique) - stores Pizza, Pasta, Salad
- Table `sizes` - contains size options with columns: id (PK, auto-increment), label (unique), base_price, max_ingredients - defines Small/Medium/Large with pricing and ingredient limits
- Table `ingredients` - contains available ingredients with columns: id (PK, auto-increment), name (unique), price, availability (NULL means unlimited stock)
- Table `ingredient_requirements` - junction table defining ingredient dependencies with columns: ingredient_id, required_id (composite PK) - e.g., mozzarella requires tomatoes
- Table `ingredient_incompatibilities` - junction table defining ingredient conflicts with columns: ingredient_id, incompatible_with_id (composite PK) - e.g., eggs incompatible with mushrooms
- Table `orders` - contains customer orders with columns: id (PK, auto-increment), user_id (FK), base_dish_id (FK), size_id (FK), created_at (timestamp), status (pending/confirmed/cancelled)
- Table `order_ingredients` - junction table linking orders to ingredients with columns: order_id, ingredient_id (composite PK)

## Main React Components

- `ListOfSomething` (in `List.js`): component purpose and main functionality
- `GreatButton` (in `GreatButton.js`): component purpose and main functionality
- ...

(only _main_ components, minor ones may be skipped)

## Screenshot

![Screenshot](./resources/screenshots/screenshot.png)

## Users Credentials

| Email       | Name   | Password | 2FA Available |
|-------------|--------|----------|---------------|
| u1@rest.com | Andrea | pwd      | Yes           |
| u2@rest.com | Elia   | pwd      | Yes           |
| u3@rest.com | Renato | pwd      | Yes           |
| u4@rest.com | Simone | pwd      | Yes           |

## Pre-loaded Orders

The database contains sample orders for testing:

**Andrea (u1@rest.com):**
- Small Pizza with mozzarella, tomatoes, olives (confirmed, 2024-01-20 12:30:00)
- Small Salad with eggs, carrots (confirmed, 2024-01-20 12:35:00)

**Elia (u2@rest.com):**
- Medium Pasta with tuna, olives, parmesan, mozzarella, tomatoes (confirmed, 2024-01-21 13:15:00)
- Large Pizza with ham, eggs, olives, potatoes (confirmed, 2024-01-21 13:20:00)

*Note: Additional users (Renato and Simone) are available for testing but have no pre-loaded orders.*
