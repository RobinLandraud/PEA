import {
  Banknote,
  Landmark,
  PieChart,
  Receipt,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type React from 'react';
import { usePEA } from '../context/PEAContext';
import { formatCurrency, formatPercent } from '../utils/formatters';

export const SummaryCards: React.FC = () => {
  const { summary } = usePEA();
  const isPositiveGain = summary.totalGainLoss >= 0;

  return (
    <div className="summary-grid">
      {/* 1. Total Dépôts */}
      <div className="card summary-card">
        <div className="card-header">
          <span className="card-title">Total des Dépôts</span>
          <div className="card-icon icon-blue">
            <Landmark size={20} />
          </div>
        </div>
        <div className="card-value">{formatCurrency(summary.totalDeposits)}</div>
        <div className="card-subtitle text-muted">Cumul des versements d'espèces</div>
      </div>

      {/* 2. Total Achats */}
      <div className="card summary-card">
        <div className="card-header">
          <span className="card-title">Total des Achats</span>
          <div className="card-icon icon-purple">
            <ShoppingBag size={20} />
          </div>
        </div>
        <div className="card-value">{formatCurrency(summary.totalPurchases)}</div>
        <div className="card-subtitle text-muted">Capital investi dans les ETF</div>
      </div>

      {/* 3. Reste (Solde Espèces) */}
      <div className="card summary-card">
        <div className="card-header">
          <span className="card-title">Reste (Solde Espèces)</span>
          <div className="card-icon icon-emerald">
            <Banknote size={20} />
          </div>
        </div>
        <div className={`card-value ${summary.cashRemaining < 0 ? 'text-danger' : 'text-emerald'}`}>
          {formatCurrency(summary.cashRemaining)}
        </div>
        <div className="card-subtitle text-muted">Liquidités non investies disponibles</div>
      </div>

      {/* 4. Total des Frais */}
      <div className="card summary-card">
        <div className="card-header">
          <span className="card-title">Total des Frais</span>
          <div className="card-icon icon-amber">
            <Receipt size={20} />
          </div>
        </div>
        <div className="card-value text-amber">{formatCurrency(summary.totalFees)}</div>
        <div className="card-subtitle text-muted">Frais de courtage cumulés</div>
      </div>

      {/* 5. Valeur Actuelle Portefeuille */}
      <div className="card summary-card">
        <div className="card-header">
          <span className="card-title">Valeur Portefeuille</span>
          <div className="card-icon icon-cyan">
            <PieChart size={20} />
          </div>
        </div>
        <div className="card-value">{formatCurrency(summary.currentPortfolioValue)}</div>
        <div className="card-subtitle text-muted">Valorisation selon cours actuels</div>
      </div>

      {/* 6. Plus / Moins-Value Globale */}
      <div className="card summary-card">
        <div className="card-header">
          <span className="card-title">Plus / Moins-Value</span>
          <div className={`card-icon ${isPositiveGain ? 'icon-emerald' : 'icon-danger'}`}>
            {isPositiveGain ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
        </div>
        <div className={`card-value ${isPositiveGain ? 'text-emerald' : 'text-danger'}`}>
          {formatCurrency(summary.totalGainLoss)}
          <div
            className={`${isPositiveGain ? 'text-emerald' : 'text-danger'}`}
          >
            <span
              className={`gain-loss-badge ${isPositiveGain ? 'badge-emerald-sm' : 'badge-danger-sm'}`}
            >
              {isPositiveGain ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {formatPercent(summary.totalGainLossPercent)}
            </span>
          </div>
        </div>
        <div className="card-subtitle text-muted">Hors impôt sur le revenu</div>
      </div>

      {/* 7. Fiscalité Estimée en sortie*/}
      <div className="card summary-card">
        <div className="card-header">
          <span className="card-title">Fiscalité Estimée</span>
          <div className={`card-icon ${isPositiveGain ? 'icon-emerald' : 'icon-danger'}`}>
            {isPositiveGain ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
        </div>
        <div className={`card-value ${isPositiveGain ? 'text-emerald' : 'text-danger'}`}>
          {formatCurrency(summary.totalGainLoss > 0 ? summary.totalGainLoss - summary.totalGainLoss * 0.186 : 0)}
          <div
            className={`${isPositiveGain ? 'text-emerald' : 'text-danger'}`}
          >
            <span
              className={`gain-loss-badge ${isPositiveGain ? 'badge-emerald-sm' : 'badge-danger-sm'}`}
            >
              {isPositiveGain ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {formatPercent(summary.totalGainLossPercent > 0 ? summary.totalGainLossPercent - summary.totalGainLossPercent * 0.186 : 0)}
            </span>
          </div>
        </div>
        <div className="card-subtitle text-muted">~18.6% (PS), Hors impôt sur le revenu</div>
      </div>
    </div>
  );
};
