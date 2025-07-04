/* Restaurant Order Configurator Component for Restaurant Application */

/* This component allows users to configure restaurant orders by selecting base dishes, sizes, and ingredients. */

import { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';

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
  const [errorMessage, setErrorMessage] = useState('');               // Component-level error messages
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
   * Clears any existing error messages when valid selection is made
   * @param {Object} baseDish - Selected base dish object
   */
  const handleBaseDishSelect = (baseDish) => {
    setSelectedBaseDish(baseDish);
    setErrorMessage(''); // Clear error when making valid selection
  };

  /**
   * Handle size selection with capacity validation
   * Prevents selection of smaller sizes if current ingredients exceed capacity
   * @param {Object} size - Selected size object with capacity limits
   */
  const handleSizeSelect = (size) => {
    // If changing to a smaller size, check if current ingredients fit
    if (selectedIngredients.length > size.maxIngredients) {
      setErrorMessage(`${size.label} dishes can have at most ${size.maxIngredients} ingredients. Please remove some ingredients first.`);
      return;
    }
    
    setSelectedSize(size);
    setErrorMessage('');
  };

  /**
   * Recursively add required ingredients for a given ingredient
   * Handles complex dependency chains and validates capacity constraints and incompatibilities
   * @param {number} ingredientId - ID of ingredient to add with dependencies
   * @param {Array} currentSelection - Current ingredient selection
   * @param {number} maxIngredients - Maximum allowed ingredients for selected size
   * @returns {Object} Result object with success status and updated selection
   */
  const addRequiredIngredientsRecursively = (ingredientId, currentSelection, maxIngredients) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId);
    if (!ingredient) return { success: false, error: 'Ingredient not found' };

    let newSelection = [...currentSelection];
    
    // Add the ingredient itself if not already in selection
    if (!newSelection.includes(ingredientId)) {
      if (newSelection.length >= maxIngredients) {
        return { success: false, error: `Not enough space to add ${ingredient.name}` };
      }
      
      // Check availability constraint
      if (ingredient.availability !== null && ingredient.availability <= 0) {
        return { success: false, error: `${ingredient.name} is not available` };
      }
      
      // Check incompatibility constraints with currently selected ingredients
      const currentlySelectedIngredientNames = newSelection
        .map(id => ingredients.find(ing => ing.id === id)?.name)
        .filter(Boolean);
      
      const incompatibleWithCurrent = ingredient.incompatible.filter(incompatName => 
        currentlySelectedIngredientNames.includes(incompatName)
      );
      
      if (incompatibleWithCurrent.length > 0) {
        return { success: false, error: `${ingredient.name} is incompatible with: ${incompatibleWithCurrent.join(', ')}` };
      }
      
      newSelection.push(ingredientId);
    }

    // Recursively process required ingredients
    for (const reqName of ingredient.requires) {
      const reqIngredient = ingredients.find(ing => ing.name === reqName);
      if (!reqIngredient) continue;
      
      // If required ingredient is not already selected, add it recursively
      if (!newSelection.includes(reqIngredient.id)) {
        const result = addRequiredIngredientsRecursively(reqIngredient.id, newSelection, maxIngredients);
        if (!result.success) {
          return { success: false, error: `Cannot add ${ingredient.name} because ${result.error}` };
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
        setErrorMessage(`Cannot remove ${ingredient.name} as it is required by: ${dependentIngredients.map(ing => ing.name).join(', ')}`);
        return;
      }
      
      // Safe to remove - filter out the ingredient
      setSelectedIngredients(prev => prev.filter(id => id !== ingredientId));
    } else {
      // Selecting - perform comprehensive validation checks
      
      // Check if size is selected first
      if (!selectedSize) {
        setErrorMessage('Please select a size first');
        return;
      }
      
      // Check capacity constraint
      if (selectedIngredients.length >= selectedSize.maxIngredients) {
        setErrorMessage(`${selectedSize.label} dishes can have at most ${selectedSize.maxIngredients} ingredients`);
        return;
      }
      
      // Check availability constraint
      if (ingredient.availability !== null && ingredient.availability <= 0) {
        setErrorMessage(`${ingredient.name} is not available`);
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
        setErrorMessage(`${ingredient.name} is incompatible with: ${incompatibleSelected.join(', ')}`);
        return;
      }
      
      // Add the ingredient and all required ingredients recursively
      const result = addRequiredIngredientsRecursively(ingredientId, selectedIngredients, selectedSize.maxIngredients);
      
      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }
      
      setSelectedIngredients(result.selection);
    }
    
    setErrorMessage(''); // Clear error on successful operation
  };

  /**
   * Handle order submission with validation
   * Validates complete order before sending to server
   */
  const handleSubmitOrder = async () => {
    // Validate required selections
    if (!selectedBaseDish) {
      setErrorMessage('Please select a dish type');
      return;
    }
    
    if (!selectedSize) {
      setErrorMessage('Please select a size');
      return;
    }

    try {
      // Create combined dish ID and submit order
      const dishId = `${selectedBaseDish.id}_${selectedSize.id}`;
      await createOrder(dishId, selectedIngredients);
      
      // Reset form after successful order
      setSelectedBaseDish(null);
      setSelectedSize(null);
      setSelectedIngredients([]);
      setErrorMessage('');
    } catch (err) {
      // Handle order creation errors
      if (err.error) {
        setErrorMessage(err.error);
      } else {
        handleErrors(err); // Delegate to global error handler
      }
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
      {/* Error message display */}
      {errorMessage && (
        <Alert 
          variant="danger" 
          onClose={() => setErrorMessage('')} 
          dismissible 
          className="mb-4 border-0 rounded-3 shadow-sm"
          style={{ background: 'rgba(220, 53, 69, 0.1)' }}
        >
          <i className="bi bi-exclamation-triangle me-2"></i>
          {errorMessage}
        </Alert>
      )}
      
      <Row>
        {/* Base Dish Selection Column */}
        <Col lg={2} className="mb-4">
          <Card 
            className="h-100 shadow-lg border-0 rounded-4"
            style={{ background: 'rgba(255, 255, 255, 0.95)' }}
          >
            <Card.Header 
              className="border-0 text-white py-4"
              style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' }}
            >
              <h4 className="text-center mb-0 fw-bold">
                <i className="bi bi-list me-2"></i>
                Dish Type
              </h4>
            </Card.Header>
            <Card.Body className="p-3 d-flex flex-column justify-content-center">
              {baseDishes.map((baseDish, index) => (
                <Card
                  key={baseDish.id}
                  className="mb-3 border-2 rounded-3 shadow-sm cursor-pointer"
                  onClick={() => handleBaseDishSelect(baseDish)}
                  style={{
                    marginBottom: index === baseDishes.length - 1 ? '0' : undefined,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    // Dynamic styling based on selection state
                    background: selectedBaseDish?.id === baseDish.id 
                      ? 'linear-gradient(135deg, #d1ecf1 0%, #a8dadc 100%)'
                      : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    border: selectedBaseDish?.id === baseDish.id 
                      ? '2px solid #27ae60' 
                      : '2px solid #e9ecef',
                    transform: selectedBaseDish?.id === baseDish.id ? 'translateY(-2px)' : 'none'
                  }}
                >
                  <Card.Body className="p-3 text-center">
                    <strong style={{ color: '#2c3e50' }}>
                      {baseDish.name.charAt(0).toUpperCase() + baseDish.name.slice(1)}
                    </strong>
                    {/* Selection indicator */}
                    {selectedBaseDish?.id === baseDish.id && (
                      <div className="mt-2">
                        <i 
                          className="bi bi-check-circle-fill" 
                          style={{ color: '#27ae60', fontSize: '1.2rem' }}
                        ></i>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Size Selection Column */}
        <Col lg={2} className="mb-4">
          <Card 
            className="h-100 shadow-lg border-0 rounded-4"
            style={{ background: 'rgba(255, 255, 255, 0.95)' }}
          >
            <Card.Header 
              className="border-0 text-white py-4"
              style={{ background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' }}
            >
              <h4 className="text-center mb-0 fw-bold">
                <i className="bi bi-arrows-angle-expand me-2" style={{ fontSize: '1.2rem'}}></i>
                Size
              </h4>
            </Card.Header>
            <Card.Body className="p-3 d-flex flex-column justify-content-center">
              {sizes.map((size, index) => (
                <Card
                  key={size.id}
                  className="mb-3 border-2 rounded-3 shadow-sm cursor-pointer"
                  onClick={() => handleSizeSelect(size)}
                  style={{
                    marginBottom: index === sizes.length - 1 ? '0' : undefined,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    // Dynamic styling based on selection state
                    background: selectedSize?.id === size.id 
                      ? 'linear-gradient(135deg, #d1ecf1 0%, #a8dadc 100%)'
                      : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    border: selectedSize?.id === size.id 
                      ? '2px solid #27ae60' 
                      : '2px solid #e9ecef',
                    transform: selectedSize?.id === size.id ? 'translateY(-2px)' : 'none'
                  }}
                >
                  <Card.Body className="p-3">
                    <div className="text-center">
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
                      {/* Selection indicator */}
                      {selectedSize?.id === size.id && (
                        <div className="mt-2">
                          <i 
                            className="bi bi-check-circle-fill" 
                            style={{ color: '#27ae60', fontSize: '1.2rem' }}
                          ></i>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
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
                  const isUnavailable = ingredient.availability !== null && ingredient.availability <= 0;
                  const tooltipMessage = getConstraintTooltip(ingredient);
                  
                  // Dynamic styling based on ingredient state
                  let cardStyle = {
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '2px solid #e9ecef'
                  };

                  if (isSelected) {
                    // Selected ingredient styling
                    cardStyle.background = 'linear-gradient(135deg, #d1ecf1 0%, #a8dadc 100%)';
                    cardStyle.border = '2px solid #27ae60';
                    cardStyle.transform = 'translateY(-2px)';
                    if (!canDeselect) {
                      // Cannot be deselected (required by others)
                      cardStyle.cursor = 'not-allowed';
                      cardStyle.opacity = '0.8';
                    }
                  } else if (!canSelect) {
                    // Cannot be selected due to constraints
                    cardStyle.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
                    cardStyle.opacity = '0.7';
                    cardStyle.cursor = 'not-allowed';
                  } else if (isUnavailable) {
                    // Unavailable ingredient styling
                    cardStyle.background = 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)';
                    cardStyle.border = '2px solid #e74c3c';
                  } else {
                    // Default selectable ingredient styling
                    cardStyle.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
                  }

                  const ingredientCard = (
                    <Card
                      key={ingredient.id}
                      className="mb-3 rounded-3 shadow-sm"
                      style={cardStyle}
                      onClick={() => {
                        // Handle click based on current state and constraints
                        if (isSelected && canDeselect) {
                          handleIngredientToggle(ingredient.id);
                        } else if (!isSelected && canSelect) {
                          handleIngredientToggle(ingredient.id);
                        }
                      }}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2">
                              <strong className="me-2" style={{ color: '#2c3e50' }}>
                                {ingredient.name}
                              </strong>
                              {/* Selection badge */}
                              {isSelected && (
                                <Badge 
                                  className="px-2 py-1 rounded-pill"
                                  style={{ background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)' }}
                                >
                                  <i className="bi bi-check me-1"></i>
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <div 
                              className="fs-6 fw-bold"
                              style={{ color: '#27ae60' }}
                            >
                              €{ingredient.price.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-end">
                            {/* Availability indicator */}
                            {ingredient.availability !== null && (
                              <div 
                                className="badge px-2 py-1 mb-2 rounded-pill small"
                                style={{ 
                                  background: ingredient.availability > 0 
                                    ? 'rgba(39, 174, 96, 0.1)' 
                                    : 'rgba(231, 76, 60, 0.1)',
                                  color: ingredient.availability > 0 ? '#27ae60' : '#e74c3c'
                                }}
                              >
                                <i className="bi bi-box me-1"></i>
                                {ingredient.availability}
                              </div>
                            )}
                            {/* Requirements indicator */}
                            {ingredient.requires.length > 0 && (
                              <div className="mb-1">
                                <small 
                                  className="px-2 py-1 rounded-pill d-inline-block"
                                  style={{ 
                                    background: 'rgba(243, 156, 18, 0.1)',
                                    color: '#f39c12',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  <i className="bi bi-arrow-right me-1"></i>
                                  Requires: {ingredient.requires.join(', ')}
                                </small>
                              </div>
                            )}
                            {/* Incompatibilities indicator */}
                            {ingredient.incompatible.length > 0 && (
                              <div>
                                <small 
                                  className="px-2 py-1 rounded-pill d-inline-block"
                                  style={{ 
                                    background: 'rgba(231, 76, 60, 0.1)',
                                    color: '#e74c3c',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  <i className="bi bi-x-circle me-1"></i>
                                  Incompatible: {ingredient.incompatible.join(', ')}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  );

                  // Wrap with tooltip if there's a constraint message
                  if (tooltipMessage && ((isSelected && !canDeselect) || (!isSelected && !canSelect))) {
                    return (
                      <OverlayTrigger
                        key={ingredient.id}
                        placement="left"
                        overlay={
                          <Tooltip 
                            id={`tooltip-${ingredient.id}`}
                            style={{
                              fontSize: '0.85rem',
                              maxWidth: '300px'
                            }}
                          >
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {tooltipMessage}
                          </Tooltip>
                        }
                        delay={{ show: 500, hide: 100 }}
                      >
                        {ingredientCard}
                      </OverlayTrigger>
                    );
                  }

                  return ingredientCard;
                })}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Order Summary Column */}
        <Col lg={3}>
          <Card 
            className="shadow-lg border-0 rounded-4 position-sticky"
            style={{ 
              top: '2rem',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Card.Header 
              className="border-0 text-white py-4"
              style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }}
            >
              <h4 className="text-center mb-0 fw-bold">
                <i className="bi bi-receipt me-2"></i>
                Order Summary
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              {/* Selected dish display */}
              {selectedBaseDish && selectedSize ? (
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <i 
                      className="bi bi-bowl me-2" 
                      style={{ color: '#e74c3c', fontSize: '1.2rem' }}
                    ></i>
                    <strong style={{ color: '#2c3e50' }}>Selected Dish:</strong>
                  </div>
                  <Card className="border-2 rounded-3" style={{ borderColor: '#e9ecef' }}>
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold" style={{ color: '#2c3e50' }}>
                            {selectedBaseDish.name.charAt(0).toUpperCase() + selectedBaseDish.name.slice(1)} - {selectedSize.label}
                          </div>
                        </div>
                        <div 
                          className="fs-5 fw-bold"
                          style={{ color: '#27ae60' }}
                        >
                          €{selectedSize.basePrice.toFixed(2)}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              ) : (
                // Empty state when no dish selected
                <div className="mb-4 text-center py-4" style={{ color: '#7f8c8d' }}>
                  <i 
                    className="bi bi-bowl" 
                    style={{ fontSize: '3rem', opacity: 0.3 }}
                  ></i>
                  <div className="mt-2">
                    {!selectedBaseDish ? 'Select a dish type' : 'Select a size'}
                  </div>
                </div>
              )}

              {/* Selected ingredients display */}
              {selectedIngredients.length > 0 && (
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <i 
                      className="bi bi-collection me-2" 
                      style={{ color: '#27ae60', fontSize: '1.2rem' }}
                    ></i>
                    <strong style={{ color: '#2c3e50' }}>Ingredients:</strong>
                    <Badge 
                      className="ms-2 px-2 py-1 rounded-pill"
                      style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }}
                    >
                      {selectedIngredients.length}
                    </Badge>
                  </div>
                  <Card className="border-2 rounded-3" style={{ borderColor: '#e9ecef' }}>
                    <Card.Body className="p-3">
                      {selectedIngredients.map(ingredientId => {
                        const ingredient = ingredients.find(ing => ing.id === ingredientId);
                        return ingredient ? (
                          <div key={ingredientId} className="d-flex justify-content-between align-items-center mb-2">
                            <span className="flex-grow-1" style={{ color: '#2c3e50' }}>
                              • {ingredient.name}
                            </span>
                            <span 
                              className="fw-semibold"
                              style={{ color: '#27ae60' }}
                            >
                              €{ingredient.price.toFixed(2)}
                            </span>
                          </div>
                        ) : null;
                      })}
                    </Card.Body>
                  </Card>
                </div>
              )}

              <hr 
                className="my-4"
                style={{ 
                  border: '2px dashed #2c3e50', 
                  opacity: 0.3 
                }} 
              />
              
              {/* Total price display */}
              <div 
                className="text-center p-4 mb-4 rounded-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(39, 174, 96, 0.1) 0%, rgba(39, 174, 96, 0.05) 100%)',
                  border: '2px dashed #27ae60'
                }}
              >
                <i 
                  className="bi bi-calculator me-2" 
                  style={{ color: '#27ae60', fontSize: '1.2rem' }}
                ></i>
                <div 
                  className="fs-3 fw-bold"
                  style={{ color: '#27ae60' }}
                >
                  Total: €{totalPrice.toFixed(2)}
                </div>
              </div>

              {/* Order submission button */}
              <div className="d-grid">
                <Button 
                  size="lg"
                  disabled={!selectedBaseDish || !selectedSize}
                  onClick={handleSubmitOrder}
                  className="py-3 fw-semibold rounded-3"
                  style={{
                    background: (selectedBaseDish && selectedSize)
                      ? 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)'
                      : 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                    border: 'none'
                  }}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Place Order
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export { RestaurantConfigurator };
