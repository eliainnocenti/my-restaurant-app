-- ============================================================================
-- Database Schema for Restaurant Configurator
-- ============================================================================

-- Disable foreign key constraints while dropping tables
PRAGMA foreign_keys = OFF;

-- Drop existing tables if any
DROP TABLE IF EXISTS order_ingredients;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS ingredient_incompatibilities;
DROP TABLE IF EXISTS ingredient_requirements;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS sizes;
DROP TABLE IF EXISTS base_dishes;
DROP TABLE IF EXISTS users;

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. Users table: store user credentials
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    email  TEXT    NOT NULL UNIQUE,
    name   TEXT,
    hash   TEXT    NOT NULL,
    salt   TEXT    NOT NULL,
    secret TEXT
);

-- ============================================================================
-- 2. Base dishes table
-- ============================================================================
CREATE TABLE base_dishes (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE
);

-- ============================================================================
-- 3. Sizes table: defines size options with price and max ingredients
-- ============================================================================
CREATE TABLE sizes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    label           TEXT    NOT NULL UNIQUE,
    base_price      REAL    NOT NULL,
    max_ingredients INTEGER NOT NULL
);

-- ============================================================================
-- 4. Ingredients table
-- ============================================================================
CREATE TABLE ingredients (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL UNIQUE,
    price        REAL    NOT NULL,
    availability INTEGER -- NULL = unlimited
);

-- ============================================================================
-- 5. Ingredient requirements table
-- ============================================================================
CREATE TABLE ingredient_requirements (
    ingredient_id INTEGER NOT NULL,
    required_id   INTEGER NOT NULL,
    PRIMARY KEY (ingredient_id, required_id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
    FOREIGN KEY (required_id)   REFERENCES ingredients(id)
);

-- ============================================================================
-- 6. Ingredient incompatibilities table
-- ============================================================================
CREATE TABLE ingredient_incompatibilities (
    ingredient_id        INTEGER NOT NULL,
    incompatible_with_id INTEGER NOT NULL,
    PRIMARY KEY (ingredient_id, incompatible_with_id),
    FOREIGN KEY (ingredient_id)        REFERENCES ingredients(id),
    FOREIGN KEY (incompatible_with_id) REFERENCES ingredients(id)
);

-- ============================================================================
-- 7. Orders table
-- ============================================================================
CREATE TABLE orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    base_dish_id  INTEGER NOT NULL,
    size_id       INTEGER NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status        TEXT    NOT NULL CHECK(status IN ('pending','confirmed','cancelled')),
    -- used_2fa      BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (user_id)      REFERENCES users(id),
    FOREIGN KEY (base_dish_id) REFERENCES base_dishes(id),
    FOREIGN KEY (size_id)      REFERENCES sizes(id)
);

-- ============================================================================
-- 8. Order item ingredients table
-- ============================================================================
CREATE TABLE order_ingredients (
    order_id      INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    PRIMARY KEY (order_id, ingredient_id),
    FOREIGN KEY (order_id)      REFERENCES orders(id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);
