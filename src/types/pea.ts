export interface Deposit {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export type ETFCategory = 'World' | 'US' | 'Europe' | 'Emerging' | 'Sector' | 'Other';

export interface ETF {
  id: string;
  name: string;
  ticker: string;
  isin: string;
  category: ETFCategory;
  currentPrice: number;
  color: string;
}

export interface Transaction {
  id: string;
  etfId: string;
  type: 'BUY' | 'SELL';
  date: string;
  quantity: number;
  pricePerUnit: number;
  fee: number;
  note?: string;
}

export interface ETFPerformance extends ETF {
  quantity: number;
  totalInvested: number;
  averageBuyPrice: number;
  currentValuation: number;
  gainLoss: number;
  gainLossPercent: number;
  totalFees: number;
  weightPercent: number;
}

/** Une ligne de répartition telle que scrapée sur justETF (pays, secteur, holding). */
export interface ExposureSlice {
  name: string;
  percent: number;
}

/** Exposition d'un ETF, produite par `src/scrappers/script.py`. */
export interface ETFExposure {
  isin: string;
  name: string;
  index: string | null;
  replication: string | null;
  ter: number | null;
  fundSizeMEur: number | null;
  referenceDate: string | null;
  url: string;
  countries: ExposureSlice[];
  sectors: ExposureSlice[];
  topHoldings: ExposureSlice[];
  /** ETF physique utilisé à la place d'un ETF swap, qui n'expose pas sa composition. */
  proxyIsin?: string;
  proxyName?: string;
  proxySource?: 'auto' | 'manual';
}

export interface ExposureDataset {
  generatedAt: string | null;
  source: string;
  etfs: Record<string, ETFExposure>;
}

export type ExposureKind = 'countries' | 'sectors';

/** Ligne agrégée au niveau du portefeuille, en euros et en pourcentage. */
export interface AllocationSlice {
  name: string;
  value: number;
  percent: number;
  color: string;
}

export interface PortfolioExposure {
  slices: AllocationSlice[];
  /** Valorisation des ETF pour lesquels une composition est connue. */
  coveredValue: number;
  /** Valorisation totale des ETF détenus (base de calcul des pourcentages). */
  totalValue: number;
  coveragePercent: number;
  /** ETF détenus sans donnée d'exposition. */
  missing: string[];
  /** ETF dont l'exposition provient d'un fonds de substitution. */
  estimated: string[];
}

export interface PEASummary {
  totalDeposits: number;
  totalPurchases: number;
  totalSales: number;
  totalFees: number;
  cashRemaining: number;
  currentPortfolioValue: number;
  totalWealth: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  peaCeilingLimit: number;
  peaCeilingUsedPercent: number;
}
