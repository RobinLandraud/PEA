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
