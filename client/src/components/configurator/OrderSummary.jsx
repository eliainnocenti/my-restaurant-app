import { Card, Button, Badge } from 'react-bootstrap';

/**
 * Order summary panel component
 * @param {Object} props - Component properties
 * @param {Object} props.selectedBaseDish - Selected base dish
 * @param {Object} props.selectedSize - Selected size
 * @param {Array} props.selectedIngredients - Array of selected ingredient IDs
 * @param {Array} props.ingredients - All available ingredients
 * @param {number} props.totalPrice - Calculated total price
 * @param {Function} props.onSubmitOrder - Handler for order submission
 * @returns {JSX.Element} Order summary component
 */
const OrderSummary = ({
  selectedBaseDish,
  selectedSize,
  selectedIngredients,
  ingredients,
  totalPrice,
  onSubmitOrder
}) => {
  return (
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
            onClick={onSubmitOrder}
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
  );
};

export { OrderSummary };
