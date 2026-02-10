import React from 'react';

const sections = [
  {
    icon: '🔑',
    title: 'Agent Identity',
    description:
      'Agents register their Ed25519 device keys with the TrustedClaw registry. Each key is cryptographically bound to an OpenClaw agent identity, giving merchants a verifiable way to identify who is making a request.',
    details: [
      'Ed25519 key pairs generated on-device',
      'Public keys registered in the TrustedClaw registry',
      'Keys never leave the agent — only signatures are shared',
    ],
  },
  {
    icon: '🛡️',
    title: 'Trust Enrichment',
    description:
      'A CDN proxy sits between agents and merchants. It verifies TAP signatures (RFC 9421) on every request and enriches them with trust signals from multiple sources — building a composite trust profile in real time.',
    details: [
      'ClawKey — biometric palm verification proves a real human owns the agent',
      'Moltbook — on-chain reputation scoring from agent activity history',
      'Registry — confirms the agent\'s key is registered and active',
    ],
  },
  {
    icon: '⚖️',
    title: 'Spend Gating',
    description:
      'Merchants enforce tiered spend limits based on accumulated trust signals. Higher trust unlocks higher transaction limits — from micro-purchases for new agents to enterprise-scale transactions for fully verified ones.',
    tiers: true,
  },
  {
    icon: '💸',
    title: 'x402 Payment Settlement',
    description:
      'When an agent is ready to pay, the merchant returns HTTP 402 Payment Required with USDC payment terms. The agent\'s x402 client signs the payment, the PayAI facilitator settles on-chain, and the merchant confirms — all in a single HTTP round-trip.',
    details: [
      'Real USDC on Solana mainnet and Base (EVM)',
      'Gas fees sponsored by PayAI — agents need no SOL or ETH',
      'Sub-second settlement on Solana (~400ms finality)',
      'No API keys, no subscriptions — the payment IS the authentication',
    ],
  },
];

const tierData = [
  { tier: 0, label: 'Unknown', limit: 'Blocked', color: '#636E72', icon: '🚫' },
  { tier: 1, label: 'Registered', limit: '$5/tx', color: '#0984E3', icon: '✓' },
  { tier: 2, label: 'Reputable', limit: '$20/tx', color: '#F39C12', icon: '★' },
  { tier: 3, label: 'Verified', limit: '$2,000/tx', color: '#00B894', icon: '🛡️' },
];

const links = [
  { label: 'TrustedClaw Registry', url: 'https://github.com/notorious-d-e-v/openclaw-tap-registry', icon: '📦' },
  { label: 'TAP Fork (Visa)', url: 'https://github.com/notorious-d-e-v/trusted-agent-protocol', icon: '🔱' },
  { label: 'x402 Protocol', url: 'https://x402.org', icon: '💳' },
  { label: 'OpenClaw', url: 'https://github.com/openclaw/openclaw', icon: '🐾' },
  { label: 'ClawKey', url: 'https://clawkey.ai', icon: '🖐️' },
  { label: 'Moltbook', url: 'https://moltbook.com', icon: '📚' },
  { label: 'PayAI Facilitator', url: 'https://facilitator.payai.network', icon: '⚡' },
  { label: 'Visa TAP (Original)', url: 'https://github.com/visa/trusted-agent-protocol', icon: '💳' },
];

const HowItWorksPage = () => {
  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>How TrustedClaw Works</h1>
        <p style={styles.heroSubtitle}>
          Trust infrastructure for agentic commerce — from identity verification to on-chain payment settlement.
        </p>
      </div>

      {/* Flow Overview */}
      <div style={styles.flowBar}>
        {['Agent registers key', '→', 'CDN verifies signature', '→', 'Trust signals enriched', '→', 'Spend limit enforced', '→', 'USDC settles on-chain'].map((step, i) => (
          <span key={i} style={i % 2 === 1 ? styles.flowArrow : styles.flowStep}>{step}</span>
        ))}
      </div>

      {/* Sections */}
      {sections.map((section, i) => (
        <div key={i} style={{ ...styles.section, flexDirection: i % 2 === 0 ? 'row' : 'row-reverse' }}>
          <div style={styles.sectionIcon}>
            <span style={styles.iconLarge}>{section.icon}</span>
            <span style={styles.stepNumber}>Step {i + 1}</span>
          </div>
          <div style={styles.sectionContent}>
            <h2 style={styles.sectionTitle}>{section.title}</h2>
            <p style={styles.sectionDesc}>{section.description}</p>
            {section.details && (
              <ul style={styles.detailList}>
                {section.details.map((d, j) => (
                  <li key={j} style={styles.detailItem}>{d}</li>
                ))}
              </ul>
            )}
            {section.tiers && (
              <div style={styles.tierGrid}>
                {tierData.map((t) => (
                  <div key={t.tier} style={{ ...styles.tierCard, borderColor: t.color }}>
                    <div style={{ ...styles.tierHeader, backgroundColor: t.color + '20', color: t.color }}>
                      {t.icon} Tier {t.tier}
                    </div>
                    <div style={styles.tierLabel}>{t.label}</div>
                    <div style={styles.tierLimit}>{t.limit}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Architecture Diagram (text-based) */}
      <div style={styles.archSection}>
        <h2 style={styles.archTitle}>Architecture</h2>
        <div style={styles.archDiagram}>
          <div style={styles.archNode}>
            <div style={styles.archNodeIcon}>🤖</div>
            <div style={styles.archNodeLabel}>AI Agent</div>
            <div style={styles.archNodeDetail}>OpenClaw + Ed25519 key</div>
          </div>
          <div style={styles.archArrow}>→ TAP Signature →</div>
          <div style={styles.archNode}>
            <div style={styles.archNodeIcon}>🔒</div>
            <div style={styles.archNodeLabel}>CDN Proxy</div>
            <div style={styles.archNodeDetail}>Verify + Enrich</div>
          </div>
          <div style={styles.archArrow}>→ Trust Headers →</div>
          <div style={styles.archNode}>
            <div style={styles.archNodeIcon}>🏪</div>
            <div style={styles.archNodeLabel}>Merchant</div>
            <div style={styles.archNodeDetail}>Spend gating + x402</div>
          </div>
          <div style={styles.archArrow}>→ USDC →</div>
          <div style={styles.archNode}>
            <div style={styles.archNodeIcon}>⛓️</div>
            <div style={styles.archNodeLabel}>Solana</div>
            <div style={styles.archNodeDetail}>On-chain settlement</div>
          </div>
        </div>
        <div style={styles.enrichRow}>
          <div style={styles.enrichLabel}>Trust signals from:</div>
          <div style={styles.enrichBadge}>🖐️ ClawKey</div>
          <div style={styles.enrichBadge}>📚 Moltbook</div>
          <div style={styles.enrichBadge}>📦 Registry</div>
        </div>
      </div>

      {/* Links */}
      <div style={styles.linksSection}>
        <h2 style={styles.linksTitle}>Learn More</h2>
        <div style={styles.linksGrid}>
          {links.map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={styles.linkCard}>
              <span style={styles.linkIcon}>{link.icon}</span>
              <span style={styles.linkLabel}>{link.label}</span>
              <span style={styles.linkArrow}>↗</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' },
  hero: { textAlign: 'center', marginBottom: '3rem' },
  heroTitle: { fontSize: '2.5rem', color: '#1A1A2E', marginBottom: '0.5rem' },
  heroSubtitle: { fontSize: '1.1rem', color: '#666', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' },

  flowBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
    gap: '8px', padding: '1.25rem', backgroundColor: '#1A1A2E', borderRadius: '12px',
    marginBottom: '3rem',
  },
  flowStep: {
    color: '#b8b5ff', fontSize: '0.8rem', fontWeight: '500',
    padding: '4px 10px', backgroundColor: 'rgba(108,92,231,0.25)', borderRadius: '6px',
  },
  flowArrow: { color: '#6C5CE7', fontSize: '1rem' },

  section: {
    display: 'flex', gap: '2rem', marginBottom: '3rem', alignItems: 'flex-start',
    backgroundColor: 'white', borderRadius: '12px', padding: '2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  sectionIcon: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    minWidth: '80px', gap: '4px',
  },
  iconLarge: { fontSize: '2.5rem' },
  stepNumber: { fontSize: '0.7rem', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' },
  sectionContent: { flex: 1 },
  sectionTitle: { fontSize: '1.4rem', color: '#1A1A2E', marginTop: 0, marginBottom: '0.5rem' },
  sectionDesc: { color: '#555', lineHeight: '1.7', marginBottom: '1rem', fontSize: '0.95rem' },
  detailList: { margin: 0, paddingLeft: '1.25rem' },
  detailItem: { color: '#555', marginBottom: '0.4rem', fontSize: '0.9rem', lineHeight: '1.5' },

  tierGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  tierCard: {
    border: '2px solid', borderRadius: '10px', textAlign: 'center',
    overflow: 'hidden',
  },
  tierHeader: { padding: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' },
  tierLabel: { padding: '0.4rem 0 0', fontSize: '0.85rem', color: '#1A1A2E', fontWeight: '500' },
  tierLimit: { padding: '0.25rem 0 0.6rem', fontSize: '1rem', fontWeight: 'bold', color: '#1A1A2E' },

  archSection: {
    backgroundColor: '#1A1A2E', borderRadius: '12px', padding: '2rem',
    marginBottom: '3rem', color: 'white',
  },
  archTitle: { textAlign: 'center', marginTop: 0, marginBottom: '1.5rem', color: '#b8b5ff', fontSize: '1.2rem' },
  archDiagram: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '12px', flexWrap: 'wrap', marginBottom: '1.5rem',
  },
  archNode: {
    textAlign: 'center', padding: '1rem', backgroundColor: 'rgba(108,92,231,0.2)',
    borderRadius: '10px', minWidth: '100px',
  },
  archNodeIcon: { fontSize: '1.8rem', marginBottom: '4px' },
  archNodeLabel: { fontWeight: 'bold', fontSize: '0.85rem' },
  archNodeDetail: { fontSize: '0.7rem', color: '#b8b5ff', marginTop: '2px' },
  archArrow: { color: '#6C5CE7', fontSize: '0.8rem', fontWeight: '500' },
  enrichRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '12px', flexWrap: 'wrap',
  },
  enrichLabel: { color: '#999', fontSize: '0.8rem' },
  enrichBadge: {
    padding: '4px 12px', backgroundColor: 'rgba(108,92,231,0.3)',
    borderRadius: '20px', fontSize: '0.8rem', color: '#b8b5ff',
  },

  linksSection: { marginBottom: '2rem' },
  linksTitle: { textAlign: 'center', color: '#1A1A2E', marginBottom: '1.5rem', fontSize: '1.3rem' },
  linksGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' },
  linkCard: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '1rem',
    backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e8e6f0',
    textDecoration: 'none', color: '#1A1A2E', transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  linkIcon: { fontSize: '1.2rem' },
  linkLabel: { flex: 1, fontSize: '0.9rem', fontWeight: '500' },
  linkArrow: { color: '#6C5CE7', fontSize: '0.9rem' },
};

export default HowItWorksPage;
