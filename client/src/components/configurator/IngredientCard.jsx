import { Card, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';

/**
 * Individual ingredient card component
 * @param {Object} props - Component properties
 * @param {Object} props.ingredient - Ingredient data
 * @param {boolean} props.isSelected - Whether ingredient is selected
 * @param {boolean} props.canSelect - Whether ingredient can be selected
 * @param {boolean} props.canDeselect - Whether ingredient can be deselected
 * @param {string|null} props.tooltipMessage - Constraint tooltip message
 * @param {Function} props.onToggle - Handler for ingredient toggle
 * @returns {JSX.Element} Ingredient card component
 */
const IngredientCard = ({
  ingredient,
  isSelected,
  canSelect,
  canDeselect,
  tooltipMessage,
  onToggle
}) => {
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
      cardStyle.opacity = 0.8;
      cardStyle.cursor = 'not-allowed';
    }
  } else if (!canSelect) {
    // Disabled ingredient styling
    cardStyle.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
    cardStyle.opacity = 0.6;
    cardStyle.cursor = 'not-allowed';
  } else {
    // Selectable ingredient styling
    cardStyle.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
  }

  const handleClick = () => {
    if (isSelected && canDeselect) {
      onToggle(ingredient.id);
    } else if (!isSelected && canSelect) {
      onToggle(ingredient.id);
    }
  };

  const ingredientCard = (
    <Card
      className="mb-3 rounded-3 shadow-sm"
      style={cardStyle}
      onClick={handleClick}
    >
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center mb-2">
              <strong className="me-2" style={{ color: '#2c3e50' }}>
                {ingredient.name}
              </strong>
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
        placement="top"
        overlay={
          <Tooltip>
            <i className="bi bi-info-circle me-2"></i>
            {tooltipMessage}
          </Tooltip>
        }
      >
        <div>{ingredientCard}</div>
      </OverlayTrigger>
    );
  }

  return ingredientCard;
};

export { IngredientCard };
