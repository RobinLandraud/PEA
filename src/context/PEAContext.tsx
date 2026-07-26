import type React from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Deposit, ETF, ETFPerformance, PEASummary, Transaction } from '../types/pea';

const INITIAL_ETFS: ETF[] = [
  {
    id: 'etf-cw8',
    name: 'Amundi MSCI World UCITS ETF EUR',
    ticker: 'CW8',
    isin: 'LU1681043599',
    category: 'World',
    currentPrice: 512.4,
    color: '#3b82f6',
  },
  {
    id: 'etf-ese',
    name: 'BNP Paribas Easy S&P 500 UCITS ETF',
    ticker: 'ESE',
    isin: 'FR0011550185',
    category: 'US',
    currentPrice: 31.85,
    color: '#8b5cf6',
  },
  {
    id: 'etf-cac',
    name: 'Lyxor CAC 40 (DR) UCITS ETF',
    ticker: 'CW8/NSE',
    isin: 'FR0007052782',
    category: 'Europe',
    currentPrice: 74.5,
    color: '#ec4899',
  },
  {
    id: 'etf-paeem',
    name: 'Amundi MSCI Emerging Markets UCITS',
    ticker: 'PAEEM',
    isin: 'FR0013412020',
    category: 'Emerging',
    currentPrice: 22.1,
    color: '#f59e0b',
  },
  {
    id: 'etf-pust',
    name: 'Lyxor PEA Nasdaq-100 UCITS ETF',
    ticker: 'PUST',
    isin: 'FR0011871128',
    category: 'US',
    currentPrice: 68.3,
    color: '#06b6d4',
  },
];

const INITIAL_DEPOSITS: Deposit[] = [
  { id: 'dep-1', date: '2024-01-15', amount: 5000, note: 'Premier versement PEA' },
  { id: 'dep-2', date: '2024-04-02', amount: 3000, note: 'Apport trimestriel' },
  { id: 'dep-3', date: '2024-09-10', amount: 4500, note: 'Épargne de précaution' },
  { id: 'dep-4', date: '2025-01-08', amount: 6000, note: 'Versement annuel 2025' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    etfId: 'etf-cw8',
    type: 'BUY',
    date: '2024-01-16',
    quantity: 7,
    pricePerUnit: 440.0,
    fee: 2.5,
    note: 'Achat initial MSCI World',
  },
  {
    id: 'tx-2',
    etfId: 'etf-ese',
    type: 'BUY',
    date: '2024-04-03',
    quantity: 60,
    pricePerUnit: 26.5,
    fee: 1.9,
    note: 'Achat S&P 500',
  },
  {
    id: 'tx-3',
    etfId: 'etf-cac',
    type: 'BUY',
    date: '2024-04-03',
    quantity: 15,
    pricePerUnit: 72.0,
    fee: 1.5,
    note: 'Diversification CAC 40',
  },
  {
    id: 'tx-4',
    etfId: 'etf-cw8',
    type: 'BUY',
    date: '2024-09-12',
    quantity: 5,
    pricePerUnit: 475.0,
    fee: 2.5,
    note: 'Renforcement MSCI World',
  },
  {
    id: 'tx-5',
    etfId: 'etf-paeem',
    type: 'BUY',
    date: '2024-09-12',
    quantity: 50,
    pricePerUnit: 20.2,
    fee: 1.5,
    note: 'Achat Emerging Markets',
  },
  {
    id: 'tx-6',
    etfId: 'etf-cw8',
    type: 'BUY',
    date: '2025-01-10',
    quantity: 6,
    pricePerUnit: 495.0,
    fee: 2.5,
    note: 'Renforcement annuel MSCI World',
  },
  {
    id: 'tx-7',
    etfId: 'etf-pust',
    type: 'BUY',
    date: '2025-01-10',
    quantity: 30,
    pricePerUnit: 62.0,
    fee: 2.0,
    note: 'Position Nasdaq 100',
  },
];

const STORAGE_KEYS = {
  DEPOSITS: 'pea_deposits_v1',
  ETFS: 'pea_etfs_v1',
  TRANSACTIONS: 'pea_transactions_v1',
};

interface PEAContextType {
  deposits: Deposit[];
  etfs: ETF[];
  transactions: Transaction[];
  etfPerformances: ETFPerformance[];
  summary: PEASummary;
  addDeposit: (deposit: Omit<Deposit, 'id'>) => void;
  deleteDeposit: (id: string) => void;
  addETF: (etf: Omit<ETF, 'id'>) => void;
  updateETF: (id: string, updates: Partial<Omit<ETF, 'id'>>) => void;
  updateETFPrice: (id: string, newPrice: number) => void;
  deleteETF: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  resetToDefaults: () => void;
  clearAll: () => void;
  reorderETFs: (fromIndex: number, toIndex: number) => void;
  importData: (jsonStr: string) => boolean;
  exportData: () => string;
}

const PEAContext = createContext<PEAContextType | undefined>(undefined);

export const PEAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deposits, setDeposits] = useState<Deposit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
    return saved ? JSON.parse(saved) : INITIAL_DEPOSITS;
  });

  const [etfs, setEtfs] = useState<ETF[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ETFS);
    return saved ? JSON.parse(saved) : INITIAL_ETFS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits));
  }, [deposits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ETFS, JSON.stringify(etfs));
  }, [etfs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  const etfPerformances = useMemo<ETFPerformance[]>(() => {
    const tempPerfs = etfs.map((etf) => {
      const etfTxs = transactions.filter((t) => t.etfId === etf.id);

      let quantity = 0;
      let totalInvested = 0;
      let totalFees = 0;

      for (const tx of etfTxs) {
        totalFees += tx.fee || 0;
        if (tx.type === 'BUY') {
          quantity += tx.quantity;
          totalInvested += tx.quantity * tx.pricePerUnit;
        } else if (tx.type === 'SELL') {
          quantity -= tx.quantity;
          totalInvested -= tx.quantity * tx.pricePerUnit;
        }
      }

      const averageBuyPrice = quantity > 0 ? totalInvested / quantity : 0;
      const currentValuation = quantity * etf.currentPrice;
      const gainLoss = currentValuation - totalInvested;
      const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

      return {
        ...etf,
        quantity,
        totalInvested,
        averageBuyPrice,
        currentValuation,
        gainLoss,
        gainLossPercent,
        totalFees,
        weightPercent: 0,
      };
    });

    const totalPortfolioValuation = tempPerfs.reduce((sum, item) => sum + item.currentValuation, 0);

    return tempPerfs.map((item) => ({
      ...item,
      weightPercent:
        totalPortfolioValuation > 0 ? (item.currentValuation / totalPortfolioValuation) * 100 : 0,
    }));
  }, [etfs, transactions]);

  const summary = useMemo<PEASummary>(() => {
    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);

    let totalPurchases = 0;
    let totalSales = 0;
    let totalFees = 0;

    for (const tx of transactions) {
      totalFees += tx.fee || 0;
      const cost = tx.quantity * tx.pricePerUnit;
      if (tx.type === 'BUY') {
        totalPurchases += cost;
      } else {
        totalSales += cost;
      }
    }

    const netInvestedInETFs = totalPurchases - totalSales;
    const cashRemaining = totalDeposits - totalPurchases + totalSales - totalFees;

    const currentPortfolioValue = etfPerformances.reduce((sum, p) => sum + p.currentValuation, 0);
    const totalWealth = currentPortfolioValue + cashRemaining;

    const totalGainLoss = currentPortfolioValue - netInvestedInETFs;
    const totalGainLossPercent =
      netInvestedInETFs > 0 ? (totalGainLoss / netInvestedInETFs) * 100 : 0;

    const peaCeilingLimit = 150000;
    const peaCeilingUsedPercent = Math.min((totalDeposits / peaCeilingLimit) * 100, 100);

    return {
      totalDeposits,
      totalPurchases,
      totalSales,
      totalFees,
      cashRemaining,
      currentPortfolioValue,
      totalWealth,
      totalGainLoss,
      totalGainLossPercent,
      peaCeilingLimit,
      peaCeilingUsedPercent,
    };
  }, [deposits, transactions, etfPerformances]);

  const addDeposit = (deposit: Omit<Deposit, 'id'>) => {
    const newDep: Deposit = { ...deposit, id: `dep-${Date.now()}` };
    setDeposits((prev) => [newDep, ...prev]);
  };

  const deleteDeposit = (id: string) => {
    setDeposits((prev) => prev.filter((d) => d.id !== id));
  };

  const addETF = (etf: Omit<ETF, 'id'>) => {
    const newETF: ETF = { ...etf, id: `etf-${Date.now()}` };
    setEtfs((prev) => [...prev, newETF]);
  };

  const updateETFPrice = (id: string, newPrice: number) => {
    setEtfs((prev) => prev.map((e) => (e.id === id ? { ...e, currentPrice: newPrice } : e)));
  };

  const updateETF = (id: string, updates: Partial<Omit<ETF, 'id'>>) => {
    setEtfs((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const deleteETF = (id: string) => {
    setEtfs((prev) => prev.filter((e) => e.id !== id));
    setTransactions((prev) => prev.filter((t) => t.etfId !== id));
  };

  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...tx, id: `tx-${Date.now()}` };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAll = () => {
    setDeposits([]);
    setEtfs([]);
    setTransactions([]);
  };

  const reorderETFs = (fromIndex: number, toIndex: number) => {
    setEtfs((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const resetToDefaults = () => {
    setDeposits(INITIAL_DEPOSITS);
    setEtfs(INITIAL_ETFS);
    setTransactions(INITIAL_TRANSACTIONS);
  };

  const exportData = () => {
    return JSON.stringify({ deposits, etfs, transactions }, null, 2);
  };

  const importData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (
        Array.isArray(parsed.deposits) &&
        Array.isArray(parsed.etfs) &&
        Array.isArray(parsed.transactions)
      ) {
        setDeposits(parsed.deposits);
        setEtfs(parsed.etfs);
        setTransactions(parsed.transactions);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <PEAContext.Provider
      value={{
        deposits,
        etfs,
        transactions,
        etfPerformances,
        summary,
        addDeposit,
        deleteDeposit,
        addETF,
        updateETF,
        updateETFPrice,
        deleteETF,
        addTransaction,
        deleteTransaction,
        resetToDefaults,
        clearAll,
        reorderETFs,
        exportData,
        importData,
      }}
    >
      {children}
    </PEAContext.Provider>
  );
};

export const usePEA = () => {
  const context = useContext(PEAContext);
  if (!context) {
    throw new Error('usePEA must be used within a PEAProvider');
  }
  return context;
};
