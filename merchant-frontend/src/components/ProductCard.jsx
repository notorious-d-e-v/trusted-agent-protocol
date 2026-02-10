import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTrust } from '../context/TrustContext';
import { getRequiredTier, getTierInfo } from '../context/TrustContext';
import TrustBadge from './TrustBadge';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { tier } = useTrust();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const requiredTier = getRequiredTier(product.price);
  const isLocked = tier < requiredTier;
  const reqInfo = getTierInfo(requiredTier);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!isLocked) addToCart(product.id, 1);
  };

  const handleCardClick = () => {
    if (!isLocked) navigate(`/product/${product.id}`);
  };

  return (
    <div
      style={{
        ...styles.card,
        ...(isHovered && !isLocked ? styles.cardHovered : {}),
        ...(isLocked ? { opacity: 0.7, cursor: 'default' } : {}),
      }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ position: 'relative' }}>
        <img
          src={product.image_url || '/placeholder/300/200'}
          alt={product.name}
          style={styles.image}
          onError={(e) => { e.target.src = '/placeholder/300/200'; }}
        />
        {isLocked && (
          <div style={styles.lockOverlay}>
            <span style={{ fontSize: '2rem' }}>🔒</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Requires Tier {requiredTier} {reqInfo.icon}
            </span>
          </div>
        )}
      </div>
      <div style={styles.content}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
          <h3 style={styles.name}>{product.name}</h3>
          <TrustBadge tier={requiredTier} showLabel={false} />
        </div>
        <p style={styles.description}>{product.description}</p>
        <div style={styles.details}>
          <span style={styles.category}>{product.category}</span>
          <span style={styles.stock}>Stock: {product.stock_quantity}</span>
        </div>
        <div style={styles.footer}>
          <span style={styles.price}>${product.price.toFixed(2)} <span style={{ fontSize: '0.75rem', color: '#999', fontWeight: 'normal' }}>USDC</span></span>
          {isLocked ? (
            <span style={styles.lockedButton}>Upgrade Trust</span>
          ) : (
            <button
              style={styles.addButton}
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
            >
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  cardHovered: {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px rgba(108,92,231,0.15)',
  },
  image: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(26,26,46,0.75)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: 'white',
  },
  content: {
    padding: '1rem',
  },
  name: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#1A1A2E',
    flex: 1,
  },
  description: {
    margin: '0 0 1rem 0',
    color: '#666',
    fontSize: '0.85rem',
    lineHeight: '1.4',
  },
  details: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    fontSize: '0.8rem',
  },
  category: {
    backgroundColor: '#6C5CE722',
    color: '#6C5CE7',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontWeight: 500,
  },
  stock: {
    color: '#666',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#E17055',
  },
  addButton: {
    backgroundColor: '#00B894',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'background-color 0.3s',
  },
  lockedButton: {
    backgroundColor: '#636E72',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
};

export default ProductCard;
