// ============================================
// PEPE SHERIFF - GLOBAL CONFIG
// ============================================

export const SITE_CONFIG = {
  name: "PEPE SHERIFF",
  tagline: "A FROG YOU CAN TRUST",
  description: "Sheriff Pepe is the Original Meme of Robinhood Chain.Built for the community.Driven by culture.Ready to leave a legacy.",
  url: "https://sheriffpepe.com",
};

// ============================================
// SOCIAL LINKS
// ============================================

export const SOCIAL_LINKS = {
  telegram: "https://t.me/sheriffpepeonrobin",
  twitter: "https://x.com/sheriffpepRBC",
};

// ============================================
// CONTRACT / TOKEN INFO
// ============================================

export const TOKEN_INFO = {
  name: "SHERIFF PEPE",
  symbol: "$SHERIFF",
  contractAddress: "0xf6455b3911321520374e1bd49046041ad4067777",
  network: "Robinhood Chain",
  decimals: 18,
};

// ============================================
// SWAP CONFIG
// ============================================

export const SWAP_CONFIG = {
  fromToken: {
    symbol: "ETH",
    name: "Robinhood Chain",
    icon: "eth",
    balance: "2.45",
  },
  toToken: {
    symbol: "$SHEPEPE",
    name: "Sheriff Pepe",
    icon: "frog",
  },
  rate: "1,000,000",
  slippage: "0.5%",
};

// ============================================
// NAVIGATION
// ============================================

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Tokenomics", href: "#tokenomics" },
];

// ============================================
// TOKENOMICS DATA
// ============================================

export const TOKENOMICS_DATA = {
  stats: [
    { label: "TOTAL SUPPLY", value: "1.000.000.000" },
    { label: "BUY TAX", value: "2%" },
    { label: "SELL TAX", value: "2%" },
    { label: "LP LOCKED", value: "100%" },
  ],
  distribution: [
    { label: "LIQUIDITY POOL", percent: "98%", color: "#00C805" },
    { label: "DEV", percent: "2%", color: "#2196F3" },
  ],
};

// ============================================
// ABOUT FEATURES
// ============================================

export const ABOUT_FEATURES = [
  {
    icon: "Users",
    title: "COMMUNITY OWNED",
    desc: "100% OF TOKENS DISTRIBUTED TO THE COMMUNITY. NO TEAM ALLOCATION, NO VC DUMPING.",
  },
  {
    icon: "Flame",
    title: "LIQUIDITY BURNED",
    desc: "LP TOKENS BURNED FOREVER. CONTRACT RENOUNCED. TRULY DECENTRALIZED.",
  },
  {
    icon: "Zap",
    title: "LOW TAX",
    desc: "BUY TAX 2% AND SELL TAX 2%. FAIR AND TRANSPARENT FOR ALL HOLDERS.",
  },
  {
    icon: "TrendingUp",
    title: "MEME POWER",
    desc: "BACKED BY THE STRONGEST MEME COMMUNITY IN CRYPTO. PEPE NEVER DIES.",
  },
];

// ============================================
// FOOTER
// ============================================

export const FOOTER_CONFIG = {
  copyright: "© 2026 PEPE SHERIFF. ALL RIGHTS RESERVED.",
  disclaimer: "NOT FINANCIAL ADVICE. DYOR.",
};