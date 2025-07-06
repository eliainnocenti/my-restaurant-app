/* Restaurant Order Configurator Component for Restaurant Application */

/* This component allows users to configure restaurant orders by selecting base dishes, sizes, and ingredients. */

import { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { DishSelectionCard } from './configurator/DishSelectionCard';
import { IngredientCard } from './configurator/IngredientCard';
import { OrderSummary } from './configurator/OrderSummary';

/**
 * Main configurator component for creating restaurant orders
 * @param {Object} props - Component properties
 * @param {Array} props.baseDishes - Available base dish types
 * @param {Array} props.sizes - Available sizes with pricing and limits
 * @param {Array} props.ingredients - Available ingredients with constraints
 * @param {Function} props.createOrder - Function to create order
 * @param {Function} props.handleErrors - Global error handler
 * @returns {JSX.Element} Order configuration interface
 */
const RestaurantConfigurator = (props) => {
  const { baseDishes, sizes, ingredients, createOrder, handleErrors } = props;

  // Order configuration state management
  const [selectedBaseDish, setSelectedBaseDish] = useState(null);     // Currently selected dish type
  const [selectedSize, setSelectedSize] = useState(null);             // Currently selected size
  const [selectedIngredients, setSelectedIngredients] = useState([]); // Array of selected ingredient IDs
  const [totalPrice, setTotalPrice] = useState(0);                    // Calculated total order price

  /**
   * Calculate total price whenever selection changes
   * Updates in real-time as user modifies their order
   */
  useEffect(() => {
    let price = selectedSize ? selectedSize.basePrice : 0;
    // Add price of each selected ingredient
    selectedIngredients.forEach(ingredientId => {
      const ingredient = ingredients.find(ing => ing.id === ingredientId);
      if (ingredient) {
        price += ingredient.price;
      }
    });
    setTotalPrice(price);
  }, [selectedSize, selectedIngredients, ingredients]);

  /**
   * Handle base dish selection
   * @param {Object} baseDish - Selected base dish object
   */
  const handleBaseDishSelect = (baseDish) => {
    setSelectedBaseDish(baseDish);
  };

  /**
   * Handle size selection with capacity validation
   * Prevents selection of smaller sizes if current ingredients exceed capacity
   * @param {Object} size - Selected size object with capacity limits
   */
  const handleSizeSelect = (size) => {
    // If changing to a smaller size, check if current ingredients fit
    if (selectedIngredients.length > size.maxIngredients) {
      handleErrors(`${size.label} dishes can have at most ${size.maxIngredients} ingredients. Please remove some ingredients first.`);
      return;
    }
    
    setSelectedSize(size);
  };

  /**
   * Recursively add required ingredients for a given ingredient
   * Handles complex dependency chains and validates capacity constraints and incompatibilities
   * @param {number} ingredientId - ID of ingredient to add with dependencies
   * @param {Array} currentSelection - Current ingredient selection
   * @param {number} maxIngredients - Maximum allowed ingredients for selected size
   * @param {Array} dependencyChain - Chain of ingredients that led to this requirement (for error messages)
   * @returns {Object} Result object with success status and updated selection
   */
  const addRequiredIngredientsRecursively = (ingredientId, currentSelection, maxIngredients, dependencyChain = []) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    if (!ingredient) return { success: false, error: 'Ingredient not found' };

    let newSelection = [...currentSelection];
    const currentChain = [...dependencyChain, ingredient.name];
    
    // Add the ingredient itself if not already in selection
    if (!newSelection.includes(ingredientId)) {
      if (newSelection.length >= maxIngredients) {
        const chainMessage = currentChain.length > 1 
          ? ` (required by dependency chain: ${currentChain.slice(0, -1).join(' → ')})`
          : '';
        return { 
          success: false, 
          error: `Cannot add "${ingredient.name}"${chainMessage}. Not enough space - maximum ${maxIngredients} ingredients allowed.` 
        };
      }
      
      // Check availability constraint
      if (ingredient.availability !== null && ingredient.availability <= 0) {
        const chainMessage = currentChain.length > 1 
          ? ` (required by dependency chain: ${currentChain.slice(0, -1).join(' → ')})`
          : '';
        return { 
          success: false, 
          error: `Cannot add "${ingredient.name}"${chainMessage}. Ingredient is not available.` 
        };
      }
      
      // Check incompatibility constraints with currently selected ingredients
      const currentlySelectedIngredientNames = newSelection
        .map(id => ingredients.find(ing => ing.id === id)?.name)
        .filter(Boolean);
      
      const incompatibleWithCurrent = ingredient.incompatible.filter(incompatName => 
        currentlySelectedIngredientNames.includes(incompatName)
      );
      
      if (incompatibleWithCurrent.length > 0) {
        const chainMessage = currentChain.length > 1 
          ? ` (required by dependency chain: ${currentChain.slice(0, -1).join(' → ')})`
          : '';
        return { 
          success: false, 
          error: `Cannot add "${ingredient.name}"${chainMessage}. It is incompatible with currently selected: ${incompatibleWithCurrent.join(', ')}.` 
        };
      }
      
      newSelection.push(ingredientId);
    }

    // Recursively process required ingredients
    for (const reqName of ingredient.requires) {
      const reqIngredient = ingredients.find(ing => ing.name === reqName);
      if (!reqIngredient) continue;
      
      // If required ingredient is not already selected, add it recursively
      if (!newSelection.includes(reqIngredient.id)) {
        const result = addRequiredIngredientsRecursively(reqIngredient.id, newSelection, maxIngredients, currentChain);
        if (!result.success) {
          // Return the detailed error from the recursive call
          return { success: false, error: result.error };
        }
        newSelection = result.selection;
      }
    }

    return { success: true, selection: newSelection };
  };

  /**
   * Handle ingredient selection/deselection with comprehensive constraint checking
   * Manages complex business rules for ingredient combinations
   * @param {number} ingredientId - ID of ingredient to toggle
   */
  const handleIngredientToggle = (ingredientId) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    if (!ingredient) return;

    const isSelected = selectedIngredients.includes(ingredientId);
    
    if (isSelected) {
      // Deselecting - check if it's required by other selected ingredients
      const dependentIngredients = selectedIngredients
        .map(id => ingredients.find(ing => ing.id === id))
        .filter(ing => ing && ing.requires.includes(ingredient.name));
      
      if (dependentIngredients.length > 0) {
        handleErrors(`Cannot remove ${ingredient.name} as it is required by: ${dependentIngredients.map(ing => ing.name).join(', ')}`);
        return;
      }
      
      // Safe to remove - filter out the ingredient
      setSelectedIngredients(prev => prev.filter(id => id !== ingredientId));
    } else {
      // Selecting - perform comprehensive validation checks
      
      // Check if size is selected first
      if (!selectedSize) {
        handleErrors('Please select a size first');
        return;
      }
      
      // Check capacity constraint
      if (selectedIngredients.length >= selectedSize.maxIngredients) {
        handleErrors(`${selectedSize.label} dishes can have at most ${selectedSize.maxIngredients} ingredients`);
        return;
      }
      
      // Check availability constraint
      if (ingredient.availability !== null && ingredient.availability <= 0) {
        handleErrors(`${ingredient.name} is not available`);
        return;
      }
      
      // Check incompatibility constraints
      const selectedIngredientNames = selectedIngredients
        .map(id => ingredients.find(ing => ing.id === id)?.name)
        .filter(Boolean);
      
      const incompatibleSelected = ingredient.incompatible.filter(incompatName => 
        selectedIngredientNames.includes(incompatName)
      );
      
      if (incompatibleSelected.length > 0) {
        handleErrors(`${ingredient.name} is incompatible with: ${incompatibleSelected.join(', ')}`);
        return;
      }
      
      // Add the ingredient and all required ingredients recursively
      const result = addRequiredIngredientsRecursively(ingredientId, selectedIngredients, selectedSize.maxIngredients);
      
      if (!result.success) {
        handleErrors(result.error);
        return;
      }
      
      setSelectedIngredients(result.selection);
    }
  };

  /**
   * Handle order submission with validation
   * Validates complete order before sending to server
   */
  const handleSubmitOrder = async () => {
    // Validate required selections
    if (!selectedBaseDish) {
      handleErrors('Please select a dish type');
      return;
    }
    
    if (!selectedSize) {
      handleErrors('Please select a size');
      return;
    }

    try {
      // Create combined dish ID and submit order
      const dishId = `${selectedBaseDish.id}_${selectedSize.id}`;
      
      // Define callback to handle unavailable ingredient
      const handleUnavailableIngredient = (unavailableIngredientName) => {
        // console.log('Deselecting unavailable ingredient:', unavailableIngredientName); // Debug log
        // console.log('Current selected ingredients before deselection:', selectedIngredients); // Debug log
        
        // Find the ingredient ID that corresponds to the unavailable ingredient name
        const unavailableIngredient = ingredients.find(ingredient => 
          ingredient.name === unavailableIngredientName
        );
        
        if (unavailableIngredient) {
          // console.log('Found ingredient to deselect:', unavailableIngredient); // Debug log
          // Remove the unavailable ingredient from selection
          setSelectedIngredients(prev => {
            const newSelection = prev.filter(id => id !== unavailableIngredient.id);
            // console.log('New selected ingredients after deselection:', newSelection); // Debug log
            return newSelection;
          });
        } else {
          // console.log('Could not find ingredient with name:', unavailableIngredientName); // Debug log
        }
      };
      
      await createOrder(dishId, selectedIngredients, handleUnavailableIngredient);
      
      // Reset form after successful order
      setSelectedBaseDish(null);
      setSelectedSize(null);
      setSelectedIngredients([]);
    } catch (err) {
      // Handle order creation errors with global handler
      handleErrors(err);
    }
  };

  /**
   * Check if ingredient can be selected based on current constraints
   * @param {Object} ingredient - Ingredient to check
   * @returns {boolean} Whether ingredient can be selected
   */
  const canSelectIngredient = (ingredient) => {
    if (!selectedSize) return false; // Size must be selected first
    if (selectedIngredients.includes(ingredient.id)) return true; // Already selected
    if (selectedIngredients.length >= selectedSize.maxIngredients) return false; // Capacity exceeded
    if (ingredient.availability !== null && ingredient.availability <= 0) return false; // Not available
    
    // Check for incompatibilities with currently selected ingredients
    const selectedIngredientNames = selectedIngredients
      .map(id => ingredients.find(ing => ing.id === id)?.name)
      .filter(Boolean);
    
    const hasIncompatible = ingredient.incompatible.some(incompatName => 
      selectedIngredientNames.includes(incompatName)
    );
    
    return !hasIncompatible;
  };

  /**
   * Check if ingredient can be deselected
   * @param {Object} ingredient - Ingredient to check
   * @returns {boolean} Whether ingredient can be deselected
   */
  const canDeselectIngredient = (ingredient) => {
    if (!selectedIngredients.includes(ingredient.id)) return false;
    
    // Check if any other selected ingredients require this one
    const dependentIngredients = selectedIngredients
      .map(id => ingredients.find(ing => ing.id === id))
      .filter(ing => ing && ing.requires.includes(ingredient.name));
    
    return dependentIngredients.length === 0; // Can deselect if no dependencies
  };

  /**
   * Get tooltip message explaining why ingredient cannot be selected/deselected
   * @param {Object} ingredient - Ingredient to check
   * @returns {string|null} Tooltip message or null if no constraint
   */
  const getConstraintTooltip = (ingredient) => {
    if (selectedIngredients.includes(ingredient.id)) {
      // Check if it can be deselected
      const dependentIngredients = selectedIngredients
        .map(id => ingredients.find(ing => ing.id === id))
        .filter(ing => ing && ing.requires.includes(ingredient.name));
      
      if (dependentIngredients.length > 0) {
        return `Cannot remove ${ingredient.name} as it is required by: ${dependentIngredients.map(ing => ing.name).join(', ')}`;
      }
      return null;
    }

    // Check various constraints for selection
    if (!selectedSize) {
      return 'Please select a size first';
    }
    
    if (selectedIngredients.length >= selectedSize.maxIngredients) {
      return `${selectedSize.label} dishes can have at most ${selectedSize.maxIngredients} ingredients`;
    }
    
    if (ingredient.availability !== null && ingredient.availability <= 0) {
      return `${ingredient.name} is not available`;
    }
    
    const selectedIngredientNames = selectedIngredients
      .map(id => ingredients.find(ing => ing.id === id)?.name)
      .filter(Boolean);
    
    const incompatibleSelected = ingredient.incompatible.filter(incompatName => 
      selectedIngredientNames.includes(incompatName)
    );
    
    if (incompatibleSelected.length > 0) {
      return `${ingredient.name} is incompatible with: ${incompatibleSelected.join(', ')}. Remove them first to add this ingredient.`;
    }

    return null;
  };

  return (
    <>
      <Row>
        {/* Base Dish Selection Column */}
        <Col lg={2} className="mb-4">
          <DishSelectionCard
            title="Dish Type"
            icon="bi bi-list"
            headerGradient="linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)"
            items={baseDishes}
            selectedItem={selectedBaseDish}
            onItemSelect={handleBaseDishSelect}
            renderItemContent={(baseDish) => (
              <strong style={{ color: '#2c3e50' }}>
                {baseDish.name.charAt(0).toUpperCase() + baseDish.name.slice(1)}
              </strong>
            )}
          />
        </Col>

        {/* Size Selection Column */}
        <Col lg={2} className="mb-4">
          <DishSelectionCard
            title="Size"
            icon="bi bi-arrows-angle-expand"
            headerGradient="linear-gradient(135deg, #f39c12 0%, #e67e22 100%)"
            items={sizes}
            selectedItem={selectedSize}
            onItemSelect={handleSizeSelect}
            renderItemContent={(size) => (
              <div>
                <strong style={{ color: '#2c3e50' }}>
                  {size.label}
                </strong>
                <div 
                  className="fs-6 fw-bold mt-1"
                  style={{ color: '#27ae60' }}
                >
                  €{size.basePrice.toFixed(2)}
                </div>
                <small className="text-muted d-block mt-1">
                  Max {size.maxIngredients}
                </small>
              </div>
            )}
          />
        </Col>

        {/* Ingredients Selection Column */}
        <Col lg={5} className="mb-4">
          <Card 
            className="h-100 shadow-lg border-0 rounded-4"
            style={{ background: 'rgba(255, 255, 255, 0.95)' }}
          >
            <Card.Header 
              className="border-0 text-white py-4"
              style={{ background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' }}
            >
              <h4 className="text-center mb-0 fw-bold">
                <i className="bi bi-collection me-2"></i>
                Available Ingredients
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {ingredients.map(ingredient => {
                  // Calculate constraint status for this ingredient
                  const isSelected = selectedIngredients.includes(ingredient.id);
                  const canSelect = canSelectIngredient(ingredient);
                  const canDeselect = canDeselectIngredient(ingredient);
                  const tooltipMessage = getConstraintTooltip(ingredient);
                  
                  return (
                    <IngredientCard
                      key={ingredient.id}
                      ingredient={ingredient}
                      isSelected={isSelected}
                      canSelect={canSelect}
                      canDeselect={canDeselect}
                      tooltipMessage={tooltipMessage}
                      onToggle={handleIngredientToggle}
                    />
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Order Summary Column */}
        <Col lg={3}>
          <OrderSummary
            selectedBaseDish={selectedBaseDish}
            selectedSize={selectedSize}
            selectedIngredients={selectedIngredients}
            ingredients={ingredients}
            totalPrice={totalPrice}
            onSubmitOrder={handleSubmitOrder}
          />
        </Col>
      </Row>
    </>
  );
};

export { RestaurantConfigurator };
