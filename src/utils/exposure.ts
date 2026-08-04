import rawDataset from '../data/etfExposures.json';
import type {
  AllocationSlice,
  ETFExposure,
  ETFPerformance,
  ExposureDataset,
  ExposureKind,
  ExposureSlice,
  PortfolioExposure,
} from '../types/pea';

const dataset = rawDataset as ExposureDataset;

/** Reliquat non détaillé par justETF (les tables sont tronquées aux plus grosses lignes). */
export const OTHER_LABEL = 'Autres / non détaillé';
/** ETF détenus pour lesquels aucune composition n'a été scrapée. */
export const UNCOVERED_LABEL = 'Non couvert';

const OTHER_COLOR = '#4b5563';
const UNCOVERED_COLOR = '#374151';

// Palette alignée sur les couleurs de l'app (cf. variables CSS de :root).
const PALETTE = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#06b6d4',
  '#10b981',
  '#ef4444',
  '#a3e635',
  '#f97316',
  '#14b8a6',
  '#6366f1',
  '#eab308',
];

export const exposureGeneratedAt = dataset.generatedAt;

export const getExposure = (isin: string | undefined | null): ETFExposure | undefined => {
  if (!isin) return undefined;
  return dataset.etfs[isin.trim().toUpperCase()];
};

/** justETF nomme déjà son reliquat « Autre » : on le fusionne avec le nôtre. */
const isOtherLabel = (name: string) => /^autres?$/i.test(name.trim());

const sliceLabel = (name: string) => (isOtherLabel(name) ? OTHER_LABEL : name.trim());

/**
 * Répartition d'un ETF, complétée par la part non détaillée par justETF pour
 * que le total atteigne bien 100 %.
 */
export const getEtfSlices = (exposure: ETFExposure, kind: ExposureKind): ExposureSlice[] => {
  const rows = exposure[kind] ?? [];
  const detailed = rows.filter((row) => !isOtherLabel(row.name));
  const remainder = 100 - detailed.reduce((sum, row) => sum + row.percent, 0);

  const slices = [...detailed].sort((a, b) => b.percent - a.percent);
  if (remainder > 0.05) {
    slices.push({ name: OTHER_LABEL, percent: remainder });
  }
  return slices;
};

/**
 * Agrège les expositions des ETF détenus, pondérées par leur valorisation.
 *
 * Les pourcentages sont exprimés par rapport à la valorisation totale des ETF
 * (les espèces n'ont pas d'exposition marché) ; les ETF sans donnée sont
 * regroupés dans une ligne « Non couvert » plutôt que d'être ignorés, pour ne
 * pas surestimer les autres lignes.
 */
export const buildPortfolioExposure = (
  performances: ETFPerformance[],
  kind: ExposureKind,
): PortfolioExposure => {
  const held = performances.filter((etf) => etf.currentValuation > 0);
  const totals = new Map<string, number>();
  const missing: string[] = [];
  const estimated: string[] = [];
  let coveredValue = 0;
  let totalValue = 0;

  for (const etf of held) {
    totalValue += etf.currentValuation;
    const exposure = getExposure(etf.isin);
    const slices = exposure ? getEtfSlices(exposure, kind) : [];

    if (slices.length === 0) {
      missing.push(etf.ticker);
      totals.set(UNCOVERED_LABEL, (totals.get(UNCOVERED_LABEL) ?? 0) + etf.currentValuation);
      continue;
    }

    coveredValue += etf.currentValuation;
    if (exposure?.proxyIsin) {
      estimated.push(etf.ticker);
    }

    for (const slice of slices) {
      const label = sliceLabel(slice.name);
      const value = (etf.currentValuation * slice.percent) / 100;
      totals.set(label, (totals.get(label) ?? 0) + value);
    }
  }

  const isBucket = (name: string) => name === OTHER_LABEL || name === UNCOVERED_LABEL;

  const sorted = [...totals.entries()]
    .filter(([, value]) => value > 0)
    .sort((a, b) => {
      // Les lignes fourre-tout restent en fin de liste.
      if (isBucket(a[0]) !== isBucket(b[0])) return isBucket(a[0]) ? 1 : -1;
      return b[1] - a[1];
    });

  let colorIndex = 0;
  const slices: AllocationSlice[] = sorted.map(([name, value]) => {
    let color: string;
    if (name === OTHER_LABEL) {
      color = OTHER_COLOR;
    } else if (name === UNCOVERED_LABEL) {
      color = UNCOVERED_COLOR;
    } else {
      color = PALETTE[colorIndex % PALETTE.length];
      colorIndex += 1;
    }

    return {
      name,
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color,
    };
  });

  return {
    slices,
    coveredValue,
    totalValue,
    coveragePercent: totalValue > 0 ? (coveredValue / totalValue) * 100 : 0,
    missing,
    estimated,
  };
};
