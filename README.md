# Exam #2: "Restaurant"

![polito_logo](resources/logo_polito.jpg)

Full-stack web application for restaurant ordering with user authentication, 2FA support, and ingredient constraint management.

## React Client Application Routes

- Route `/`: Public menu browsing page showing dishes, sizes, and ingredients with login buttons for non-authenticated users
- Route `/login`: Authentication page with username/password login and optional 2FA flow
- Route `/configure`: Order configuration page for authenticated users to create custom orders with ingredient selection
- Route `/orders`: User order history page showing confirmed/cancelled orders with cancellation functionality (requires 2FA)

## API Server

The backend server provides a RESTful API for restaurant management with authentication, menu browsing, and order management capabilities. All endpoints are prefixed with `/api/`.

### Authentication APIs

#### `POST /api/sessions`
**Purpose:** User login with username and password  
**Request Body:**
```json
{
  "username": "u1@rest.com",
  "password": "pwd"
}
```
**Response:** User object with authentication status
```json
{
  "id": 1,
  "username": "u1@rest.com",
  "name": "Andrea",
  "canDoTotp": true,
  "isTotp": false
}
```
**Error Response (401):**
```json
{
  "error": "Incorrect username or password"
}
```

#### `GET /api/sessions/current`
**Purpose:** Get current user session information  
**Response:** Current user object with authentication status
```json
{
  "id": 1,
  "username": "u1@rest.com",
  "name": "Andrea",
  "canDoTotp": true,
  "isTotp": false
}
```
**Error Response (401):**
```json
{
  "error": "Not authenticated"
}
```

#### `DELETE /api/sessions/current`
**Purpose:** Logout current user and destroy session  
**Response:** Logout confirmation message
```json
{
  "message": "Logout successful"
}
```

#### `POST /api/login-totp`
**Purpose:** Verify TOTP code for two-factor authentication  
**Authentication:** Required (user must be logged in)  
**Request Body:**
```json
{
  "code": "123456"
}
```
**Validation:** Code must be exactly 6 numeric digits  
**Response:** TOTP verification result with upgraded session
```json
{
  "otp": "authorized"
}
```
**Error Responses:**
- **401 (Invalid Code):**
```json
{
  "error": "Invalid TOTP code"
}
```

#### `POST /api/skip-totp`
**Purpose:** Skip TOTP verification (partial authentication)  
**Authentication:** Required (user must be logged in)  
**Response:** Confirmation with authentication limitations
```json
{
  "message": "Proceeding with partial authentication",
  "limitations": ["Cannot cancel orders", "Limited to basic operations"]
}
```

### Restaurant Data APIs (Public)

#### `GET /api/base-dishes`
**Purpose:** Get all base dish types (pizza, pasta, salad, etc.)  
**Response:** Array of base dish categories
```json
[
  {
    "id": 2,
    "name": "Pasta"
  },
  {
    "id": 1,
    "name": "Pizza"
  },
  {
    "id": 3,
    "name": "Salad"
  }
]
```

#### `GET /api/sizes`
**Purpose:** Get all available sizes with pricing and constraints  
**Response:** Array of size options
```json
[
  {
    "id": 1,
    "label": "Small",
    "basePrice": 5,
    "maxIngredients": 3
  },
  {
    "id": 2,
    "label": "Medium",
    "basePrice": 7,
    "maxIngredients": 5
  },
  {
    "id": 3,
    "label": "Large",
    "basePrice": 9,
    "maxIngredients": 7
  }
]
```

#### `GET /api/ingredients`
**Purpose:** Get all ingredients with constraints and availability  
**Response:** Array of ingredients with business rules
```json
[
  {
    "id": 8,
    "name": "anchovies",
    "price": 1.5,
    "availability": 1,
    "requires": [],
    "incompatible": [
      "olives"
    ]
  },
  {
    "id": 10,
    "name": "carrots",
    "price": 0.4,
    "availability": null,
    "requires": [],
    "incompatible": []
  },
  {
    "id": 7,
    "name": "eggs",
    "price": 1,
    "availability": null,
    "requires": [],
    "incompatible": [
      "tomatoes",
      "mushrooms"
    ]
  },
  {
    "id": 4,
    "name": "ham",
    "price": 1.2,
    "availability": 2,
    "requires": [],
    "incompatible": [
      "mushrooms"
    ]
  },
  {
    "id": 1,
    "name": "mozzarella",
    "price": 1,
    "availability": 3,
    "requires": [
      "tomatoes"
    ],
    "incompatible": []
  },
  {
    "id": 3,
    "name": "mushrooms",
    "price": 0.8,
    "availability": 3,
    "requires": [],
    "incompatible": [
      "ham",
      "eggs"
    ]
  },
  {
    "id": 5,
    "name": "olives",
    "price": 0.7,
    "availability": null,
    "requires": [],
    "incompatible": [
      "anchovies"
    ]
  },
  {
    "id": 9,
    "name": "parmesan",
    "price": 1.2,
    "availability": null,
    "requires": [
      "mozzarella"
    ],
    "incompatible": []
  },
  {
    "id": 11,
    "name": "potatoes",
    "price": 0.3,
    "availability": null,
    "requires": [],
    "incompatible": []
  },
  {
    "id": 2,
    "name": "tomatoes",
    "price": 0.5,
    "availability": null,
    "requires": [
      "olives"
    ],
    "incompatible": [
      "eggs"
    ]
  },
  {
    "id": 6,
    "name": "tuna",
    "price": 1.5,
    "availability": 2,
    "requires": [
      "olives"
    ],
    "incompatible": []
  }
]
```

### Order Management APIs (Authentication Required)

#### `GET /api/orders`
**Purpose:** Get current user's order history  
**Authentication:** Required  
**Response:** Array of user orders with full details
```json
[
  {
    "id": 2,
    "userId": 1,
    "dishName": "Salad",
    "dishSize": "Small",
    "dishPrice": 5,
    "totalPrice": 6.4,
    "orderDate": "2024-01-20 12:35:00",
    "status": "confirmed",
    "ingredients": [
      "eggs",
      "carrots"
    ],
    "ingredientPrices": [
      1,
      0.4
    ]
  },
  {
    "id": 1,
    "userId": 1,
    "dishName": "Pizza",
    "dishSize": "Small",
    "dishPrice": 5,
    "totalPrice": 7.2,
    "orderDate": "2024-01-20 12:30:00",
    "status": "confirmed",
    "ingredients": [
      "mozzarella",
      "tomatoes",
      "olives"
    ],
    "ingredientPrices": [
      1,
      0.5,
      0.7
    ]
  }
]
```
**Error Response (401):**
```json
{
  "error": "Not authenticated"
}
```

#### `POST /api/orders`
**Purpose:** Create a new order with selected dish and ingredients  
**Authentication:** Required  
**Request Body:**
```json
{
  "dishId": "1_2",
  "ingredientIds": [1, 2, 3]
}
```
**Validation Rules:**
- `dishId` must be a string in format "baseDishId_sizeId"
- `ingredientIds` must be an array of ingredient IDs
- Ingredient availability is checked and decremented
- Size capacity limits are enforced (max ingredients per size)
- Ingredient requirements and incompatibilities are validated

**Success Response (201):**
```json
{
  "id": 5,
  "dishId": "1_2",
  "ingredientIds": [1, 2, 5],
  "totalPrice": 9.2,
  "message": "Order created successfully"
}
```

**Error Responses:**
- **400 (Constraint Violations):**
```json
{
  "error": "Small dishes can have at most 3 ingredients. You selected 5.",
  "constraintViolation": "ingredient_count",
  "maxAllowed": 3,
  "provided": 5
}
```
```json
{
  "error": "eggs is incompatible with: mushrooms",
  "constraintViolation": "incompatibility",
  "ingredient": "eggs",
  "conflictsWith": ["mushrooms"]
}
```
```json
{
  "error": "mozzarella requires: tomatoes",
  "constraintViolation": "requirements",
  "ingredient": "mozzarella",
  "missingRequirements": ["tomatoes"]
}
```
```json
{
  "error": "Invalid ingredient: 999",
  "constraintViolation": "invalid_ingredient"
}
```
```json
{
  "error": "Invalid dish ID format"
}
```
```json
{
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Invalid value",
      "path": "dishId",
      "location": "body"
    },
    {
      "type": "field",
      "msg": "Invalid value",
      "path": "ingredientIds",
      "location": "body"
    }
  ]
}
```

#### `DELETE /api/orders/:orderId`
**Purpose:** Cancel an existing order  
**Authentication:** Required (TOTP authentication for security)  
**Parameters:**
- `orderId` (URL parameter): Integer ID of the order to cancel (minimum value: 1)
**Response:** Cancellation confirmation with ingredient availability restoration
```json
{
  "message": "Order cancelled successfully"
}
```
**Error Responses:**
- **401 (Missing 2FA):**
```json
{
  "error": "Missing TOTP authentication"
}
```
- **404 (Order Not Found):**
```json
{
  "error": "Order not found or cannot be cancelled"
}
```

**Security Note:** Requires completed two-factor authentication (`isTotp: true`) for order cancellation. User session must have been upgraded with TOTP verification.

### Authentication States

The API supports three authentication levels:

1. **Not Authenticated:** Access to public menu data only
2. **Partial Authentication:** Can create orders but cannot cancel them  
3. **Full Authentication (2FA):** Complete access including order cancellation

### Session Management

- Sessions are managed using HTTP-only cookies
- TOTP authentication upgrades session privileges
- All authenticated endpoints include `credentials: 'include'` for cookie handling

## Database Tables

- **`users`** - User authentication data
  - `id` (PK, auto-increment)
  - `email` (unique)
  - `name`
  - `hash` (password hash)
  - `salt`
  - `secret` (2FA secret)

- **`base_dishes`** - Available dish types
  - `id` (PK, auto-increment)
  - `name` (unique)
  - *Contains: Pizza, Pasta, Salad*

- **`sizes`** - Size options with pricing and limits
  - `id` (PK, auto-increment)
  - `label` (unique)
  - `base_price`
  - `max_ingredients`
  - *Defines: Small/Medium/Large with pricing and ingredient limits*

- **`ingredients`** - Available ingredients
  - `id` (PK, auto-increment)
  - `name` (unique)
  - `price`
  - `availability` (NULL = unlimited stock)

- **`ingredient_requirements`** - Junction table for ingredient dependencies
  - `ingredient_id` (FK to ingredients, composite PK)
  - `required_id` (FK to ingredients, composite PK)
  - *Example: mozzarella requires tomatoes*

- **`ingredient_incompatibilities`** - Junction table for ingredient conflicts
  - `ingredient_id` (FK to ingredients, composite PK)
  - `incompatible_with_id` (FK to ingredients, composite PK)
  - *Example: eggs incompatible with mushrooms*

- **`orders`** - Customer orders
  - `id` (PK, auto-increment)
  - `user_id` (FK to users)
  - `base_dish_id` (FK to base_dishes)
  - `size_id` (FK to sizes)
  - `created_at` (timestamp)
  - `status` (confirmed/cancelled)

- **`order_ingredients`** - Junction table linking orders to ingredients
  - `order_id` (FK to orders, composite PK)
  - `ingredient_id` (FK to ingredients, composite PK)

## Main React Components

### Core Application Components

- **`App`** (in `App.jsx`): Main application component managing authentication state, menu data, orders, and routing with 2FA flow handling. Includes centralized error handling, message management with auto-timeout, and order creation/cancellation workflows.

- **`LoginWithTotp`** (in `App.jsx`): Component to handle login flow with optional TOTP verification, showing either login form or TOTP form based on authentication state.

### Layout Components

- **`GenericLayout`** (in `Layout.jsx`): Main layout wrapper with navigation, global message display, loading states, and route outlet for most pages. Includes gradient background styling and footer with project information.

- **`Navigation`** (in `Navigation.jsx`): Top navigation bar with authentication controls, 2FA status indicators, and user information display. Features responsive design with brand logo and conditional 2FA upgrade button.

- **`ConfiguratorLayout`** (in `Layout.jsx`): Order configurator layout wrapper for authenticated users, containing the RestaurantConfigurator component.

- **`OrdersLayout`** (in `Layout.jsx`): Orders list layout for viewing and managing user orders with navigation and order management actions.

- **`LoginLayout`** (in `Layout.jsx`): Simple wrapper for the LoginForm component.

- **`TotpLayout`** (in `Layout.jsx`): Simple wrapper for the TotpForm component for two-factor authentication.

- **`NotFoundLayout`** (in `Layout.jsx`): 404 error page with navigation back to main page.

### Business Logic Components

- **`MenuBrowser`** (in `MenuBrowser.jsx`): Public menu browsing component displaying dishes, sizes, and ingredients without requiring authentication. Includes call-to-action buttons for logged-in users and dish type icons.

- **`RestaurantConfigurator`** (in `RestaurantConfigurator.jsx`): Complex order configuration component with dish/size selection, ingredient constraints validation, and real-time price calculation. Handles ingredient requirements, incompatibilities, availability constraints, and recursive dependency resolution.

- **`OrdersList`** (in `OrdersList.jsx`): Order history display with cancellation functionality, 2FA upgrade prompts for enhanced security, and modal confirmations for order cancellation.

### Configurator Sub-Components

- **`DishSelectionCard`** (in `configurator/DishSelectionCard.jsx`): Reusable card component for dish and size selection with customizable styling, gradient headers, and selection state indicators.

- **`IngredientCard`** (in `configurator/IngredientCard.jsx`): Individual ingredient card component with constraint tooltips, availability indicators, requirement/incompatibility badges, and dynamic styling based on selection state.

- **`OrderSummary`** (in `configurator/OrderSummary.jsx`): Order summary panel component showing selected dish, ingredients list with prices, total calculation, and order submission functionality with sticky positioning.

### Authentication Components

- **`LoginForm`** (in `Auth.jsx`): Username/password authentication form with validation, error handling, and 2FA upgrade flow support. Handles prefilled usernames and 2FA completion requests.

- **`TotpForm`** (in `Auth.jsx`): Two-factor authentication verification form with 6-digit code input, skip option for partial authentication, and comprehensive error handling.

- **`LoginButton`** (in `Auth.jsx`): Navigation bar login button that navigates to login page with styled appearance.

- **`LogoutButton`** (in `Auth.jsx`): Navigation bar logout button with logout handler functionality.

## Screenshot

#### Home Page (not logged)
![home_no_logged](./resources/screenshots/home_no_logged.png)

#### Login Form
![login_form](./resources/screenshots/login_form.png)

#### Totp Form
![totp_form](./resources/screenshots/totp_form.png)

#### Skip 2FA Form
![skip_2fa](./resources/screenshots/skip_2fa.png)

#### Home Page (logged)
![home_logged](./resources/screenshots/home_logged.png)

#### Totp Completion Form
![totp_completion_form](./resources/screenshots/totp_completion_form.png)

#### Home Page (logged with 2FA)
![home_logged_2fa](./resources/screenshots/home_logged_2fa.png)

#### Order Configuration Test
![order_configuration_test](./resources/screenshots/order_configuration_test.png)

#### Orders List
![orders_list](./resources/screenshots/orders_list.png)

## Users Credentials

| Email         | Name   | Password | 2FA Available |
|---------------|--------|----------|---------------|
| `u1@rest.com` | Andrea | `pwd`    | Yes           |
| `u2@rest.com` | Elia   | `pwd`    | Yes           |
| `u3@rest.com` | Renato | `pwd`    | Yes           |
| `u4@rest.com` | Simone | `pwd`    | Yes           |

## Pre-loaded Orders

The database contains sample orders for testing:

**Andrea (`u1@rest.com`):**
- Small Pizza with mozzarella, tomatoes, olives (confirmed, 2024-01-20 12:30:00)
- Small Salad with eggs, carrots (confirmed, 2024-01-20 12:35:00)

**Elia (`u2@rest.com`):**
- Medium Pasta with tuna, olives, parmesan, mozzarella, tomatoes (confirmed, 2024-01-21 13:15:00)
- Large Pizza with ham, eggs, olives, potatoes (confirmed, 2024-01-21 13:20:00)

*Note: Additional users (Renato and Simone) are available for testing but have no pre-loaded orders.*
