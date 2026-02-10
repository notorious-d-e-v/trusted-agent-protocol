import React from 'react';
import { getTierInfo } from '../context/TrustContext';

const TrustBadge = ({ tier, size = 'small', showLabel = true }) => {
  const info = getTierInfo(tier);
  const isSmall = size === 'small';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: isSmall ? '4px' : '6px',
      backgroundColor: info.color + '22',
      border: `1px solid ${info.color}`,
      color: info.color,
      padding: isSmall ? '2px 8px' : '4px 12px',
      borderRadius: '12px',
      fontSize: isSmall ? '0.75rem' : '0.85rem',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <span>{info.icon}</span>
      {showLabel && <span>Tier {tier}: {info.label}</span>}
    </span>
  );
};

export default TrustBadge;
