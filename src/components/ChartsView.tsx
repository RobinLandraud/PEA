import type React from 'react';
import { usePEA } from '../context/PEAContext';
import { formatCurrency, formatPercent } from '../utils/formatters';

export const ChartsView: React.FC = () => {
  const { etfPerformances, summary } = usePEA();

  const totalWealth = summary.totalWealth;

  const allocationItems = [
    ...etfPerformances.map((etf) => ({
      name: etf.ticker,
      fullName: etf.name,
      value: etf.currentValuation,
      percent: totalWealth > 0 ? (etf.currentValuation / totalWealth) * 100 : 0,
      color: etf.color,
    })),
    {
      name: 'Reste (Espèces)',
      fullName: "Solde d'espèces disponible",
      value: Math.max(summary.cashRemaining, 0),
      percent: totalWealth > 0 ? (Math.max(summary.cashRemaining, 0) / totalWealth) * 100 : 0,
      color: '#10b981',
    },
  ].filter((item) => item.value > 0);

  let cumulativePercent = 0;

  return (
    <div className="charts-grid">
      <div className="card chart-card">
        <h3 className="card-title-sm mb-4">Répartition du Patrimoine PEA</h3>
        <div className="donut-chart-wrapper">
          <svg viewBox="0 0 100 100" className="donut-svg">
            {allocationItems.map((item) => {
              const startPercent = cumulativePercent;
              cumulativePercent += item.percent;

              const startAngle = (startPercent / 100) * 360 - 90;
              const endAngle = (cumulativePercent / 100) * 360 - 90;

              const x1 = 50 + 40 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 50 + 40 * Math.sin((Math.PI * startAngle) / 180);
              const x2 = 50 + 40 * Math.cos((Math.PI * endAngle) / 180);
              const y2 = 50 + 40 * Math.sin((Math.PI * endAngle) / 180);

              const largeArcFlag = item.percent > 50 ? 1 : 0;
              const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              return (
                <path
                  key={item.name}
                  d={pathData}
                  fill={item.color}
                  opacity={0.9}
                  className="donut-segment"
                >
                  <title>{`${item.fullName}: ${formatCurrency(item.value)} (${item.percent.toFixed(1)}%)`}</title>
                </path>
              );
            })}
            <circle cx="50" cy="50" r="26" fill="var(--bg-card)" />
          </svg>

          <div className="donut-center-text">
            <span className="center-label">Patrimoine</span>
            <span className="center-value">{formatCurrency(summary.totalWealth)}</span>
          </div>
        </div>

        <div className="donut-legend mt-4">
          {allocationItems.map((item) => (
            <div key={item.name} className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: item.color }} />
              <span className="legend-name">{item.name}</span>
              <span className="legend-value">{item.percent.toFixed(1)} %</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card chart-card">
        <h3 className="card-title-sm mb-4">Bilan Capital Investi vs Valorisation</h3>

        <div className="bar-comparison-container">
          <div className="bar-group">
            <div className="bar-label-header">
              <span>Total Dépôts Effectués</span>
              <strong>{formatCurrency(summary.totalDeposits)}</strong>
            </div>
            <div className="bar-track">
              <div className="bar-fill bg-blue" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="bar-group">
            <div className="bar-label-header">
              <span>Capital Investi en ETF</span>
              <strong>{formatCurrency(summary.totalPurchases)}</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill bg-purple"
                style={{
                  width: `${summary.totalDeposits > 0 ? (summary.totalPurchases / summary.totalDeposits) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="bar-group">
            <div className="bar-label-header">
              <span>Valeur Actuelle Portefeuille</span>
              <strong className="text-highlight">
                {formatCurrency(summary.currentPortfolioValue)}
              </strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill bg-cyan"
                style={{
                  width: `${summary.totalPurchases > 0 ? Math.min((summary.currentPortfolioValue / summary.totalPurchases) * 100, 100) : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="bar-group">
            <div className="bar-label-header">
              <span>Reste (Solde Espèces)</span>
              <strong className="text-emerald">{formatCurrency(summary.cashRemaining)}</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill bg-emerald"
                style={{
                  width: `${summary.totalDeposits > 0 ? (Math.max(summary.cashRemaining, 0) / summary.totalDeposits) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="perf-callout mt-6">
          <div className="callout-item">
            <span className="text-muted">Total Frais Réglés</span>
            <span className="font-bold text-amber">{formatCurrency(summary.totalFees)}</span>
          </div>
          <div className="callout-item">
            <span className="text-muted">Rendement Global du Portefeuille</span>
            <span
              className={`font-bold ${summary.totalGainLoss >= 0 ? 'text-emerald' : 'text-danger'}`}
            >
              {formatPercent(summary.totalGainLossPercent)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
