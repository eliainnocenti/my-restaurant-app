import { Card } from 'react-bootstrap';

/**
 * Reusable card component for dish and size selection
 * @param {Object} props - Component properties
 * @param {string} props.title - Card title
 * @param {string} props.icon - Bootstrap icon class
 * @param {string} props.headerGradient - CSS gradient for header
 * @param {Array} props.items - Items to display (dishes or sizes)
 * @param {Object} props.selectedItem - Currently selected item
 * @param {Function} props.onItemSelect - Handler for item selection
 * @param {Function} props.renderItemContent - Function to render item content
 * @returns {JSX.Element} Selection card component
 */
const DishSelectionCard = ({
  title,
  icon,
  headerGradient,
  items,
  selectedItem,
  onItemSelect,
  renderItemContent
}) => {
  return (
    <Card 
      className="h-100 shadow-lg border-0 rounded-4"
      style={{ background: 'rgba(255, 255, 255, 0.95)' }}
    >
      <Card.Header 
        className="border-0 text-white py-4"
        style={{ background: headerGradient }}
      >
        <h4 className="text-center mb-0 fw-bold">
          <i className={`${icon} me-2`} style={{ fontSize: '1.2rem'}}></i>
          {title}
        </h4>
      </Card.Header>
      <Card.Body className="p-3 d-flex flex-column justify-content-center">
        {items.map((item, index) => (
          <Card
            key={item.id}
            className="mb-3 border-2 rounded-3 shadow-sm cursor-pointer"
            onClick={() => onItemSelect(item)}
            style={{
              marginBottom: index === items.length - 1 ? '0' : undefined,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: selectedItem?.id === item.id 
                ? 'linear-gradient(135deg, #d1ecf1 0%, #a8dadc 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: selectedItem?.id === item.id 
                ? '2px solid #27ae60' 
                : '2px solid #e9ecef',
              transform: selectedItem?.id === item.id ? 'translateY(-2px)' : 'none'
            }}
          >
            <Card.Body className="p-3 text-center">
              {renderItemContent(item, selectedItem?.id === item.id)}
              {selectedItem?.id === item.id && (
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
  );
};

export { DishSelectionCard };
