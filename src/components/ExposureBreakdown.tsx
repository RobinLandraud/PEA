import type React from 'react';
import type { PortfolioExposure } from '../types/pea';
import { exposureGeneratedAt } from '../utils/exposure';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ExposureBreakdownProps {
  title: string;
  exposure: PortfolioExposure;
  emptyLabel: string;
}

export const ExposureBreakdown: React.FC<ExposureBreakdownProps> = ({
  title,
  exposure,
  emptyLabel,
}) => {
  const { slices, coveragePercent, estimated, missing } = exposure;

  return (
    <div className="card chart-card">
      <h3 className="card-title-sm mb-4">{title}</h3>

      {slices.length === 0 ? (
        <p className="text-muted exposure-empty">{emptyLabel}</p>
      ) : (
        <>
          <div className="exposure-stack">
            {slices.map((slice) => (
              <div
                key={slice.name}
                className="exposure-stack-part"
                style={{ width: `${slice.percent}%`, backgroundColor: slice.color }}
                title={`${slice.name} : ${slice.percent.toFixed(1)} %`}
              />
            ))}
          </div>

          <ul className="exposure-list">
            {slices.map((slice) => (
              <li key={slice.name} className="exposure-row">
                <span className="legend-dot" style={{ backgroundColor: slice.color }} />
                <span className="exposure-name">{slice.name}</span>
                <span className="exposure-percent">{slice.percent.toFixed(1)} %</span>
                <span className="exposure-value text-muted">{formatCurrency(slice.value)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="exposure-note text-muted">
        Source justETF
        {exposureGeneratedAt ? ` — données du ${formatDate(exposureGeneratedAt)}` : ''}
        {coveragePercent < 99.9
          ? ` — couverture ${coveragePercent.toFixed(0)} % du portefeuille`
          : ''}
      </p>
      {estimated.length > 0 && (
        <p className="exposure-note text-muted">
          Exposition estimée via un ETF physique équivalent pour : {estimated.join(', ')}
        </p>
      )}
      {missing.length > 0 && (
        <p className="exposure-note text-muted">
          Aucune donnée pour : {missing.join(', ')} — lancer le scrapper pour les ajouter.
        </p>
      )}
    </div>
  );
};
