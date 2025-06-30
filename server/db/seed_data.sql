-- ============================================================================
-- Seed Data for Restaurant Configurator
-- ============================================================================

BEGIN TRANSACTION;

-- ----------------------------------------------------------------------------
-- 1. Users
-- ----------------------------------------------------------------------------
INSERT INTO users (id, email, name, hash, salt, secret) VALUES
    (1, 'u1@restaurant.com', 'Andrea', '15d3c4fca80fa608dcedeb65ac10eff78d20c88800d016369a3d2963742ea288', '72e4eeb14def3b21', 'LXBSMDTMSP2I5XFXIYRGFVWSFI'),
    (2, 'u2@restaurant.com', 'Elia',   '15d3c4fca80fa608dcedeb65ac10eff78d20c88800d016369a3d2963742ea288', '72e4eeb14def3b21', ''),
    (3, 'u3@restaurant.com', 'Renato', '15d3c4fca80fa608dcedeb65ac10eff78d20c88800d016369a3d2963742ea288', '72e4eeb14def3b21', 'LXBSMDTMSP2I5XFXIYRGFVWSFI'),
    (4, 'u4@restaurant.com', 'Simone', '15d3c4fca80fa608dcedeb65ac10eff78d20c88800d016369a3d2963742ea288', '72e4eeb14def3b21', 'LXBSMDTMSP2I5XFXIYRGFVWSFI');

-- ----------------------------------------------------------------------------
-- 2. Base Dishes
-- ----------------------------------------------------------------------------
INSERT INTO base_dishes (name) VALUES
    ('pizza'),
    ('pasta'),
    ('salad');

-- ----------------------------------------------------------------------------
-- 3. Sizes
-- ----------------------------------------------------------------------------
INSERT INTO sizes (label, base_price, max_ingredients) VALUES
    ('Small',  5.00, 3),
    ('Medium', 7.00, 5),
    ('Large',  9.00, 7);

-- ----------------------------------------------------------------------------
-- 4. Ingredients
-- ----------------------------------------------------------------------------
INSERT INTO ingredients (name, price, availability) VALUES
    ('mozzarella', 1.00, 3),
    ('tomatoes',   0.50, NULL),
    ('mushrooms',  0.80, 3),
    ('ham',        1.20, 2),
    ('olives',     0.70, NULL),
    ('tuna',       1.50, 2),
    ('eggs',       1.00, NULL),
    ('anchovies',  1.50, 1),
    ('parmesan',   1.20, NULL),
    ('carrots',    0.40, NULL),
    ('potatoes',   0.30, NULL);

-- ----------------------------------------------------------------------------
-- 5. Ingredient Requirements
-- ----------------------------------------------------------------------------
INSERT INTO ingredient_requirements (ingredient_id, required_id)
SELECT i.id, r.id
FROM ingredients i
JOIN ingredients r ON
    (i.name = 'tomatoes'   AND r.name = 'olives')     OR
    (i.name = 'parmesan'   AND r.name = 'mozzarella') OR
    (i.name = 'mozzarella' AND r.name = 'tomatoes')   OR
    (i.name = 'tuna'       AND r.name = 'olives');

-- ----------------------------------------------------------------------------
-- 6. Ingredient Incompatibilities (plus symmetric)
-- ----------------------------------------------------------------------------
INSERT INTO ingredient_incompatibilities (ingredient_id, incompatible_with_id)
SELECT i.id, j.id
FROM ingredients i
JOIN ingredients j ON
    (i.name = 'eggs'   AND j.name = 'mushrooms') OR
    (i.name = 'eggs'   AND j.name = 'tomatoes')  OR
    (i.name = 'ham'    AND j.name = 'mushrooms') OR
    (i.name = 'olives' AND j.name = 'anchovies');

INSERT INTO ingredient_incompatibilities (ingredient_id, incompatible_with_id)
SELECT incompatible_with_id, ingredient_id
FROM ingredient_incompatibilities;

-- ----------------------------------------------------------------------------
-- 7. Orders
-- ----------------------------------------------------------------------------

-- Andrea: two orders
INSERT INTO orders (user_id, base_dish_id, size_id, status, used_2fa) VALUES
    -- Andrea’s small pizza
    (1,
     (SELECT id FROM base_dishes WHERE name='pizza'),
     (SELECT id FROM sizes       WHERE label='Small'),
     'confirmed', TRUE),
    -- Andrea’s small salad
    (1,
     (SELECT id FROM base_dishes WHERE name='salad'),
     (SELECT id FROM sizes       WHERE label='Small'),
     'confirmed', TRUE);

-- Ingredients for Andrea’s small pizza
INSERT INTO order_ingredients (order_id, ingredient_id)
SELECT o.id, ing.id
FROM orders o
JOIN ingredients ing ON ing.name IN ('mozzarella', 'tomatoes', 'olives')
WHERE o.user_id=1
  AND o.base_dish_id=(SELECT id FROM base_dishes WHERE name='pizza')
  AND o.size_id     =(SELECT id FROM sizes       WHERE label='Small');

-- Ingredients for Andrea’s small salad
INSERT INTO order_ingredients (order_id, ingredient_id)
SELECT o.id, ing.id
FROM orders o
JOIN ingredients ing ON ing.name IN ('eggs','carrots')
WHERE o.user_id=1
  AND o.base_dish_id=(SELECT id FROM base_dishes WHERE name='salad')
  AND o.size_id     =(SELECT id FROM sizes       WHERE label='Small');

-- Elia: two orders
INSERT INTO orders (user_id, base_dish_id, size_id, status, used_2fa) VALUES
    -- Elia’s medium pasta
    (2,
     (SELECT id FROM base_dishes WHERE name='pasta'),
     (SELECT id FROM sizes       WHERE label='Medium'),
     'confirmed', FALSE),
    -- Elia’s large pizza
    (2,
     (SELECT id FROM base_dishes WHERE name='pizza'),
     (SELECT id FROM sizes       WHERE label='Large'),
     'confirmed', FALSE);

-- Ingredients for Elia’s medium pasta
INSERT INTO order_ingredients (order_id, ingredient_id)
SELECT o.id, ing.id
FROM orders o
JOIN ingredients ing ON ing.name IN ('tuna','olives','parmesan','mozzarella','tomatoes')
WHERE o.user_id=2
  AND o.base_dish_id=(SELECT id FROM base_dishes WHERE name='pasta')
  AND o.size_id     =(SELECT id FROM sizes       WHERE label='Medium');

-- Ingredients for Elia’s large pizza
INSERT INTO order_ingredients (order_id, ingredient_id)
SELECT o.id, ing.id
FROM orders o
JOIN ingredients ing ON ing.name IN ('ham','eggs','olives','potatoes')
WHERE o.user_id=2
  AND o.base_dish_id=(SELECT id FROM base_dishes WHERE name='pizza')
  AND o.size_id     =(SELECT id FROM sizes       WHERE label='Large');

-- Renato: two orders
INSERT INTO orders (user_id, base_dish_id, size_id, status, used_2fa) VALUES
    -- Renato’s small salad
    (3,
     (SELECT id FROM base_dishes WHERE name='salad'),
     (SELECT id FROM sizes       WHERE label='Small'),
     'confirmed', TRUE),
    -- Renato’s small pasta
    (3,
     (SELECT id FROM base_dishes WHERE name='pasta'),
     (SELECT id FROM sizes       WHERE label='Small'),
     'confirmed', TRUE);

-- Ingredients for Renato’s small salad
INSERT INTO order_ingredients (order_id, ingredient_id)
SELECT o.id, ing.id
FROM orders o
JOIN ingredients ing ON ing.name IN ('potatoes','anchovies')
WHERE o.user_id=3
  AND o.base_dish_id=(SELECT id FROM base_dishes WHERE name='salad')
  AND o.size_id     =(SELECT id FROM sizes       WHERE label='Small');

-- Ingredients for Renato’s small pasta
INSERT INTO order_ingredients (order_id, ingredient_id)
SELECT o.id, ing.id
FROM orders o
JOIN ingredients ing ON ing.name = 'mushrooms'
WHERE o.user_id=3
  AND o.base_dish_id=(SELECT id FROM base_dishes WHERE name='pasta')
  AND o.size_id     =(SELECT id FROM sizes       WHERE label='Small');

-- Simone: two orders
INSERT INTO orders (user_id, base_dish_id, size_id, status, used_2fa) VALUES
    -- Simone’s medium pizza
    (4,
     (SELECT id FROM base_dishes WHERE name='pizza'),
     (SELECT id FROM sizes       WHERE label='Medium'),
     'confirmed', TRUE),
    -- Simone’s large pasta
    (4,
     (SELECT id FROM base_dishes WHERE name='pasta'),
     (SELECT id FROM sizes       WHERE label='Large'),
     'confirmed', TRUE);

-- Ingredients for Simone’s medium pizza
INSERT INTO order_ingredients (order_id, ingredient_id)
SELECT o.id, ing.id
FROM orders o
JOIN ingredients ing ON ing.name IN ('mozzarella','tomatoes','olives')
WHERE o.user_id=4
  AND o.base_dish_id=(SELECT id FROM base_dishes WHERE name='pizza')
  AND o.size_id     =(SELECT id FROM sizes       WHERE label='Medium');

-- Ingredients for Simone’s large pasta
INSERT INTO order_ingredients (order_id, ingredient_id)
SELECT o.id, ing.id
FROM orders o
JOIN ingredients ing ON ing.name = 'eggs'
WHERE o.user_id=4
  AND o.base_dish_id=(SELECT id FROM base_dishes WHERE name='pasta')
  AND o.size_id     =(SELECT id FROM sizes       WHERE label='Large');

COMMIT;
