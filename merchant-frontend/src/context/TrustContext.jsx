import React, { createContext, useContext, useState } from 'react';

const TrustContext = createContext();

const TRUST_TIERS = {
  0: { label: 'Unknown', color: '#636E72', icon: '🚫' },
  1: { label: 'Registered', color: '#0984E3', icon: '✓' },
  2: { label: 'Reputable', color: '#F39C12', icon: '★' },
  3: { label: 'Verified', color: '#00B894', icon: '🛡️' },
};

export function getRequiredTier(price) {
  if (price <= 5) return 1;
  if (price <= 20) return 2;
  return 3;
}

export function getTierInfo(tier) {
  return TRUST_TIERS[tier] || TRUST_TIERS[0];
}

export function TrustProvider({ children }) {
  const [tier, setTier] = useState(1);
  return (
    <TrustContext.Provider value={{ tier, setTier, TRUST_TIERS }}>
      {children}
    </TrustContext.Provider>
  );
}

export function useTrust() {
  return useContext(TrustContext);
}
