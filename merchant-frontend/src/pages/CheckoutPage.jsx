import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTrust } from '../context/TrustContext';
import { getTierInfo, getRequiredTier } from '../context/TrustContext';

const PAYMENT_STEPS = [
  { icon: '🔍', label: 'Verifying agent identity...', detail: 'Checking TAP signature (RFC 9421)' },
  { icon: '🛡️', label: 'Trust tier confirmed', detail: '' },
  { icon: '💰', label: 'Payment required', detail: '' },
  { icon: '✍️', label: 'Signing transaction...', detail: 'x402 client signing USDC payment' },
  { icon: '⛓️', label: 'Settling on Solana...', detail: 'PayAI facilitator processing on-chain' },
  { icon: '✅', label: 'Payment confirmed!', detail: '' },
];

const CheckoutPage = () => {
  const { cart, sessionId, getCartTotal, clearCart } = useCart();
  const { tier } = useTrust();
  const navigate = useNavigate();
  const [paymentState, setPaymentState] = useState('idle'); // idle | processing | complete | error
  const [currentStep, setCurrentStep] = useState(-1);
  const [selectedNetwork, setSelectedNetwork] = useState('solana');

  useEffect(() => {
    if (!cart || !cart.items || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  if (!cart || !cart.items || cart.items.length === 0) {
    return null;
  }

  const subtotal = getCartTotal();
  const tax = subtotal * 0.08;
  const hasPhysical = false; // all our products are digital
  const shipping = hasPhysical ? 9.99 : 0;
  const total = subtotal + shipping + tax;

  const maxTierRequired = Math.max(...cart.items.map(item => getRequiredTier(item.product.price)));
  const canPurchase = tier >= maxTierRequired;

  const tierInfo = getTierInfo(tier);
  const requiredTierInfo = getTierInfo(maxTierRequired);

  const startPayment = async () => {
    if (!canPurchase) return;
    setPaymentState('processing');

    for (let i = 0; i < PAYMENT_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise(r => setTimeout(r, i === PAYMENT_STEPS.length - 1 ? 600 : 1200 + Math.random() * 800));
    }

    setPaymentState('complete');
  };

  const fakeTxHash = '4xK9v' + Math.random().toString(36).slice(2, 8) + 'Qm7nR' + Math.random().toString(36).slice(2, 6);

  const getStepDetail = (i) => {
    if (i === 1) return `Agent trust: Tier ${tier} (${tierInfo.label})`;
    if (i === 2) return `$${total.toFixed(2)} USDC on ${selectedNetwork === 'solana' ? 'Solana' : 'Base'}`;
    if (i === 5) return `TX: ${fakeTxHash.slice(0, 16)}...`;
    return PAYMENT_STEPS[i].detail;
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <button onClick={() => navigate('/cart')} style={styles.backButton}>
            ← Back to Cart
          </button>
          <h1 style={styles.title}>Checkout</h1>
        </div>

        <div style={styles.mainContent}>
          {/* Payment Section */}
          <div style={styles.paymentSection}>
            {/* Network Selector */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Pay with USDC</h2>
              <div style={styles.networkOptions}>
                <label
                  style={{
                    ...styles.networkOption,
                    ...(selectedNetwork === 'solana' ? styles.networkSelected : {}),
                  }}
                >
                  <input
                    type="radio"
                    name="network"
                    value="solana"
                    checked={selectedNetwork === 'solana'}
                    onChange={() => setSelectedNetwork('solana')}
                    style={{ display: 'none' }}
                  />
                  <span style={styles.networkIcon}>◎</span>
                  <div>
                    <div style={styles.networkName}>Solana Mainnet</div>
                    <div style={styles.networkDetail}>~400ms finality</div>
                  </div>
                </label>
                <label
                  style={{
                    ...styles.networkOption,
                    ...(selectedNetwork === 'base' ? styles.networkSelected : {}),
                  }}
                >
                  <input
                    type="radio"
                    name="network"
                    value="base"
                    checked={selectedNetwork === 'base'}
                    onChange={() => setSelectedNetwork('base')}
                    style={{ display: 'none' }}
                  />
                  <span style={styles.networkIcon}>🔵</span>
                  <div>
                    <div style={styles.networkName}>Base (EVM)</div>
                    <div style={styles.networkDetail}>~2s finality</div>
                  </div>
                </label>
              </div>
              <div style={styles.gasBadge}>
                ⛽ Gas fees sponsored by PayAI — you pay $0 in network fees
              </div>
            </div>

            {/* Trust Requirement */}
            {!canPurchase && (
              <div style={styles.trustError}>
                <div style={styles.trustErrorIcon}>🔒</div>
                <div>
                  <strong>Insufficient trust level</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                    Your cart requires Tier {maxTierRequired} ({requiredTierInfo.label}) but you are Tier {tier} ({tierInfo.label}).
                    Remove high-value items or upgrade your trust level.
                  </p>
                </div>
              </div>
            )}

            {/* Payment Flow */}
            {paymentState === 'idle' && (
              <button
                onClick={startPayment}
                disabled={!canPurchase}
                style={{
                  ...styles.payButton,
                  ...(canPurchase ? {} : styles.payButtonDisabled),
                }}
              >
                {canPurchase
                  ? `Pay $${total.toFixed(2)} USDC on ${selectedNetwork === 'solana' ? 'Solana' : 'Base'}`
                  : 'Trust level too low'}
              </button>
            )}

            {(paymentState === 'processing' || paymentState === 'complete') && (
              <div style={styles.stepsContainer}>
                <h3 style={styles.stepsTitle}>x402 Payment Flow</h3>
                {PAYMENT_STEPS.map((step, i) => {
                  const isActive = i === currentStep;
                  const isDone = i < currentStep || paymentState === 'complete';
                  const isPending = i > currentStep && paymentState !== 'complete';

                  return (
                    <div
                      key={i}
                      style={{
                        ...styles.step,
                        ...(isActive ? styles.stepActive : {}),
                        ...(isDone ? styles.stepDone : {}),
                        ...(isPending ? styles.stepPending : {}),
                      }}
                    >
                      <div style={styles.stepIcon}>
                        {isDone ? '✅' : isActive ? step.icon : '○'}
                      </div>
                      <div style={styles.stepContent}>
                        <div style={styles.stepLabel}>{step.label}</div>
                        {(isDone || isActive) && (
                          <div style={styles.stepDetail}>{getStepDetail(i)}</div>
                        )}
                      </div>
                      {isActive && <div style={styles.spinner}>⟳</div>}
                    </div>
                  );
                })}

                {paymentState === 'complete' && (
                  <div style={styles.successBox}>
                    <div style={styles.successTitle}>🎉 Order Complete!</div>
                    <p style={styles.successText}>
                      ${total.toFixed(2)} USDC settled on {selectedNetwork === 'solana' ? 'Solana' : 'Base'} mainnet
                    </p>
                    <a
                      href={selectedNetwork === 'solana'
                        ? `https://solscan.io/tx/${fakeTxHash}`
                        : `https://basescan.org/tx/0x${fakeTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.explorerLink}
                    >
                      View on {selectedNetwork === 'solana' ? 'Solscan' : 'Basescan'} ↗
                    </a>
                    <button
                      onClick={() => {
                        clearCart();
                        navigate('/order-success', {
                          state: {
                            order: { order_number: 'TC-' + Date.now().toString(36).toUpperCase() },
                            payment: { network: selectedNetwork, amount: total, txHash: fakeTxHash },
                          },
                        });
                      }}
                      style={styles.continueButton}
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Protocol Info */}
            <div style={styles.protocolInfo}>
              <h3 style={styles.protocolTitle}>How x402 works</h3>
              <p style={styles.protocolText}>
                The merchant returns <code style={styles.code}>HTTP 402 Payment Required</code> with
                USDC payment terms. Your agent's x402 client automatically signs the payment and retries
                the request. Settlement happens on-chain via the PayAI facilitator — no API keys, no
                subscriptions, just pay-per-request.
              </p>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div style={styles.summarySection}>
            <div style={styles.orderSummary}>
              <h2 style={styles.summaryTitle}>Order Summary</h2>

              <div style={styles.cartItems}>
                {cart.items.map(item => {
                  const reqTier = getRequiredTier(item.product.price);
                  const ri = getTierInfo(reqTier);
                  return (
                    <div key={item.id} style={styles.cartItem}>
                      <img
                        src={item.product.image_url || '/placeholder/60/60'}
                        alt={item.product.name}
                        style={styles.itemImage}
                        onError={(e) => { e.target.src = '/placeholder/60/60'; }}
                      />
                      <div style={styles.itemDetails}>
                        <div style={styles.itemName}>{item.product.name}</div>
                        <div style={styles.itemMeta}>
                          Qty: {item.quantity}
                          <span style={{ ...styles.tierPill, backgroundColor: ri.color + '22', color: ri.color }}>
                            {ri.icon} Tier {reqTier}
                          </span>
                        </div>
                      </div>
                      <div style={styles.itemPrice}>
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={styles.totals}>
                <div style={styles.totalRow}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                {shipping > 0 && <div style={styles.totalRow}><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>}
                <div style={styles.totalRow}><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
                <div style={styles.totalRow}><span>Gas fees</span><span style={{ color: '#00B894' }}>$0.00 ✨</span></div>
                <div style={styles.totalRowFinal}>
                  <span>Total</span>
                  <span>${total.toFixed(2)} USDC</span>
                </div>
              </div>

              <div style={styles.trustSummary}>
                <span style={{ color: tierInfo.color }}>{tierInfo.icon}</span>{' '}
                Your trust: Tier {tier} ({tierInfo.label})
                {canPurchase
                  ? <span style={{ color: '#00B894' }}> — Approved</span>
                  : <span style={{ color: '#E17055' }}> — Requires Tier {maxTierRequired}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f5f3ff' },
  content: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' },
  header: { marginBottom: '2rem' },
  backButton: {
    backgroundColor: 'transparent', border: '1px solid #ddd', padding: '0.5rem 1rem',
    borderRadius: '4px', cursor: 'pointer', marginBottom: '1rem', color: '#666',
  },
  title: { fontSize: '2rem', color: '#1A1A2E', margin: 0 },
  mainContent: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' },
  paymentSection: {
    backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  section: { marginBottom: '1.5rem' },
  sectionTitle: { fontSize: '1.3rem', color: '#1A1A2E', marginBottom: '1rem', marginTop: 0 },
  networkOptions: { display: 'flex', gap: '1rem', marginBottom: '1rem' },
  networkOption: {
    flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem',
    border: '2px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  networkSelected: { borderColor: '#6C5CE7', backgroundColor: '#6C5CE710' },
  networkIcon: { fontSize: '1.5rem' },
  networkName: { fontWeight: 'bold', color: '#1A1A2E', fontSize: '0.95rem' },
  networkDetail: { fontSize: '0.8rem', color: '#666' },
  gasBadge: {
    backgroundColor: '#00B89415', color: '#00B894', padding: '0.75rem 1rem',
    borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500',
  },
  trustError: {
    display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: '#E1705515',
    border: '1px solid #E1705540', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem',
  },
  trustErrorIcon: { fontSize: '1.5rem' },
  payButton: {
    width: '100%', padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 'bold',
    color: 'white', backgroundColor: '#6C5CE7', border: 'none', borderRadius: '8px',
    cursor: 'pointer', marginBottom: '1.5rem', transition: 'background-color 0.2s',
  },
  payButtonDisabled: { backgroundColor: '#999', cursor: 'not-allowed' },
  stepsContainer: {
    marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#1A1A2E',
    borderRadius: '12px', color: 'white',
  },
  stepsTitle: { margin: '0 0 1rem', fontSize: '1rem', color: '#b8b5ff' },
  step: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem',
    borderRadius: '8px', marginBottom: '4px', transition: 'all 0.3s',
  },
  stepActive: { backgroundColor: 'rgba(108,92,231,0.3)' },
  stepDone: { opacity: 0.8 },
  stepPending: { opacity: 0.35 },
  stepIcon: { fontSize: '1.2rem', width: '32px', textAlign: 'center' },
  stepContent: { flex: 1 },
  stepLabel: { fontWeight: '500', fontSize: '0.95rem' },
  stepDetail: { fontSize: '0.8rem', color: '#b8b5ff', marginTop: '2px' },
  spinner: { fontSize: '1.2rem', animation: 'spin 1s linear infinite' },
  successBox: {
    marginTop: '1rem', padding: '1.5rem', backgroundColor: '#00B89420',
    borderRadius: '8px', textAlign: 'center',
  },
  successTitle: { fontSize: '1.3rem', fontWeight: 'bold', color: '#00B894' },
  successText: { color: '#ccc', margin: '0.5rem 0' },
  explorerLink: {
    color: '#6C5CE7', textDecoration: 'underline', fontSize: '0.9rem',
    display: 'inline-block', marginBottom: '1rem',
  },
  continueButton: {
    padding: '0.75rem 2rem', backgroundColor: '#00B894', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
    fontSize: '1rem',
  },
  protocolInfo: {
    padding: '1.5rem', backgroundColor: '#f8f7ff', borderRadius: '8px',
    border: '1px solid #e8e6f0',
  },
  protocolTitle: { margin: '0 0 0.5rem', fontSize: '1rem', color: '#1A1A2E' },
  protocolText: { margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: '1.6' },
  code: {
    backgroundColor: '#1A1A2E', color: '#00B894', padding: '2px 6px',
    borderRadius: '4px', fontSize: '0.8rem',
  },
  summarySection: { height: 'fit-content', position: 'sticky', top: '2rem' },
  orderSummary: {
    backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  summaryTitle: {
    fontSize: '1.2rem', color: '#1A1A2E', marginTop: 0, marginBottom: '1rem',
    borderBottom: '1px solid #eee', paddingBottom: '0.5rem',
  },
  cartItems: { marginBottom: '1rem' },
  cartItem: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 0',
    borderBottom: '1px solid #f0f0f0',
  },
  itemImage: { width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px' },
  itemDetails: { flex: 1 },
  itemName: { fontSize: '0.85rem', fontWeight: '500', color: '#1A1A2E' },
  itemMeta: { fontSize: '0.75rem', color: '#666', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' },
  tierPill: { padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' },
  itemPrice: { fontSize: '0.9rem', fontWeight: 'bold', color: '#E17055' },
  totals: { borderTop: '1px solid #eee', paddingTop: '0.75rem' },
  totalRow: {
    display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem',
    fontSize: '0.85rem', color: '#666',
  },
  totalRowFinal: {
    display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem',
    fontWeight: 'bold', color: '#1A1A2E', borderTop: '1px solid #eee',
    paddingTop: '0.5rem', marginTop: '0.5rem',
  },
  trustSummary: {
    marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f8f7ff',
    borderRadius: '6px', fontSize: '0.85rem', color: '#1A1A2E', textAlign: 'center',
  },
};

export default CheckoutPage;
