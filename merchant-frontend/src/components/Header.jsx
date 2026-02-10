import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTrust } from '../context/TrustContext';
import TrustBadge from './TrustBadge';

const Header = () => {
  const { getCartItemCount } = useCart();
  const { tier, setTier, TRUST_TIERS } = useTrust();

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.brand}>
          <Link to="/" style={styles.logo}>
            🐾 TrustedClaw
          </Link>
          <span style={styles.tagline}>Agent Commerce, Verified</span>
        </div>
        
        <nav style={styles.nav}>
          <Link to="/" style={styles.navLink}>Products</Link>
          <Link to="/orders" style={styles.navLink}>Orders</Link>
          <Link to="/how-it-works" style={styles.navLink}>How It Works</Link>

          <div style={styles.tierSelector}>
            <TrustBadge tier={tier} />
            <select
              value={tier}
              onChange={(e) => setTier(Number(e.target.value))}
              style={styles.tierDropdown}
            >
              {Object.entries(TRUST_TIERS).map(([t, info]) => (
                <option key={t} value={t}>
                  {info.icon} Tier {t}: {info.label}
                </option>
              ))}
            </select>
          </div>

          <Link to="/cart" style={styles.cartLink}>
            🛒 Cart ({getCartItemCount()})
          </Link>
        </nav>
      </div>
    </header>
  );
};

const styles = {
  header: {
    background: 'linear-gradient(135deg, #6C5CE7 0%, #1A1A2E 100%)',
    color: 'white',
    padding: '1rem 0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  logo: {
    fontSize: '1.6rem',
    fontWeight: 'bold',
    color: 'white',
    textDecoration: 'none',
  },
  tagline: {
    fontSize: '0.75rem',
    color: '#b8b5ff',
    letterSpacing: '0.5px',
  },
  nav: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    fontSize: '0.9rem',
    transition: 'background-color 0.3s',
  },
  tierSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  tierDropdown: {
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '4px',
    padding: '4px 6px',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  cartLink: {
    color: 'white',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    backgroundColor: '#00B894',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
};

export default Header;
