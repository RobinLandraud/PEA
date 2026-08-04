import {
  ArrowUpDown,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';
import { usePEA } from '../context/PEAContext';
import type { ETFPerformance } from '../types/pea';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface ETFTableProps {
  onSelectETFForBuy: (etfId: string) => void;
  onEditETFPrice: (etf: ETFPerformance) => void;
  onEditETF: (etf: ETFPerformance) => void;
}

export const ETFTable: React.FC<ETFTableProps> = ({
  onSelectETFForBuy,
  onEditETFPrice,
  onEditETF,
}) => {
  const { etfPerformances, deleteETF, reorderETFs, etfs } = usePEA();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof ETFPerformance>('currentValuation');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Drag & drop state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const categories = ['ALL', 'World', 'US', 'Europe', 'Emerging', 'Sector', 'Other'];

  const isFiltered = search !== '' || categoryFilter !== 'ALL';

  const handleSort = (field: keyof ETFPerformance) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get ETF performances in the order defined in etfs array (user-defined order)
  const orderedPerformances = etfs
    .map((etf) => etfPerformances.find((p) => p.id === etf.id))
    .filter(Boolean) as ETFPerformance[];

  const filteredETFs = orderedPerformances.filter((etf) => {
    const matchesSearch =
      etf.name.toLowerCase().includes(search.toLowerCase()) ||
      etf.ticker.toLowerCase().includes(search.toLowerCase()) ||
      etf.isin.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || etf.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const displayETFs = isFiltered
    ? [...filteredETFs].sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    })
    : filteredETFs;

  const handleDelete = (etf: ETFPerformance) => {
    if (
      confirm(
        `Voulez-vous supprimer l'ETF "${etf.name}" (${etf.ticker}) ainsi que son historique ?`,
      )
    ) {
      deleteETF(etf.id);
    }
  };

  // Drag & drop handlers — only work when no filter/search active
  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (toIndex: number) => {
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === toIndex) {
      setDragOverIndex(null);
      dragIndexRef.current = null;
      return;
    }
    // Compute real indices in etfs array based on filtered/ordered list
    const fromETFId = displayETFs[fromIndex]?.id;
    const toETFId = displayETFs[toIndex]?.id;
    if (!fromETFId || !toETFId) return;
    const realFrom = etfs.findIndex((e) => e.id === fromETFId);
    const realTo = etfs.findIndex((e) => e.id === toETFId);
    reorderETFs(realFrom, realTo);
    setDragOverIndex(null);
    dragIndexRef.current = null;
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
    dragIndexRef.current = null;
  };

  return (
    <div className="card table-card">
      <div className="table-header-toolbar">
        <div>
          <h2 className="section-title">Portefeuille d'ETF</h2>
          <p className="section-subtitle">
            Détail des positions, PRM, plus-values et frais par ETF
            {!isFiltered && (
              <span className="text-muted"> · Glissez-déposez ⠿ pour réordonner</span>
            )}
          </p>
        </div>

        <div className="toolbar-controls">
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher nom, ticker, ISIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control input-search"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-control select-category"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'Toutes catégories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="etf-table">
          <thead>
            <tr>
              {!isFiltered && <th className="drag-col" />}
              <th onClick={() => handleSort('name')} className="cursor-pointer">
                <div className="th-content">
                  <span>ETF / Libellé</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th>Catégorie</th>
              <th onClick={() => handleSort('quantity')} className="cursor-pointer text-right">
                <div className="th-content justify-end">
                  <span>Qté</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th
                onClick={() => handleSort('averageBuyPrice')}
                className="cursor-pointer text-right"
              >
                <div className="th-content justify-end">
                  <span>PRM</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th onClick={() => handleSort('totalInvested')} className="cursor-pointer text-right">
                <div className="th-content justify-end">
                  <span>Total Investi</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th onClick={() => handleSort('currentPrice')} className="cursor-pointer text-right">
                <div className="th-content justify-end">
                  <span>Cours Actuel</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th
                onClick={() => handleSort('currentValuation')}
                className="cursor-pointer text-right"
              >
                <div className="th-content justify-end">
                  <span>Valorisation</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th onClick={() => handleSort('gainLoss')} className="cursor-pointer text-right">
                <div className="th-content justify-end">
                  <span>Plus/Moins-Value</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th onClick={() => handleSort('totalFees')} className="cursor-pointer text-right">
                <div className="th-content justify-end">
                  <span>Total Frais</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th onClick={() => handleSort('weightPercent')} className="cursor-pointer text-right">
                <div className="th-content justify-end">
                  <span>Poids</span>
                  <ArrowUpDown size={13} />
                </div>
              </th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayETFs.length === 0 ? (
              <tr>
                <td colSpan={isFiltered ? 11 : 12} className="text-center empty-state">
                  Aucun ETF ne correspond à votre recherche.
                </td>
              </tr>
            ) : (
              displayETFs.map((etf, displayIndex) => {
                const isPositive = etf.gainLoss >= 0;
                const isDragOver = dragOverIndex === displayIndex;
                return (
                  <tr
                    key={etf.id}
                    className={`etf-row${isDragOver ? ' drag-over' : ''}`}
                    draggable={!isFiltered}
                    onDragStart={() => handleDragStart(displayIndex)}
                    onDragOver={(e) => handleDragOver(e, displayIndex)}
                    onDrop={() => handleDrop(displayIndex)}
                    onDragEnd={handleDragEnd}
                  >
                    {!isFiltered && (
                      <td className="drag-handle-cell">
                        <GripVertical size={16} className="drag-handle-icon" />
                      </td>
                    )}
                    <td>
                      <div className="etf-identity">
                        <div className="etf-color-tag" style={{ backgroundColor: etf.color }} />
                        <div>
                          <div className="etf-name">{etf.name}</div>
                          <div className="etf-codes">
                            <span className="ticker-badge">{etf.ticker}</span>
                            <span className="isin-text">{etf.isin}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-pill">{etf.category}</span>
                    </td>
                    <td className="text-right font-medium">{etf.quantity}</td>
                    <td className="text-right">{formatCurrency(etf.averageBuyPrice)}</td>
                    <td className="text-right font-medium">{formatCurrency(etf.totalInvested)}</td>
                    <td className="text-right">
                      <div className="price-cell">
                        <span>{formatCurrency(etf.currentPrice)}</span>
                        <button
                          type="button"
                          onClick={() => onEditETFPrice(etf)}
                          className="btn-icon-xs"
                          title="Modifier le cours actuel"
                        >
                          ✎
                        </button>
                      </div>
                    </td>
                    <td className="text-right font-semibold text-highlight">
                      {formatCurrency(etf.currentValuation)}
                    </td>
                    <td className="text-right">
                      <div
                        className={` ${isPositive ? 'text-emerald' : 'text-danger'}`}
                      >
                        <span className="gain-loss-amount font-semibold">
                          {formatCurrency(etf.gainLoss)}
                        </span>
                        <span
                          className={`gain-loss-badge ${isPositive ? 'badge-emerald-sm' : 'badge-danger-sm'}`}
                        >
                          {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {formatPercent(etf.gainLossPercent)}
                        </span>
                      </div>
                    </td>
                    <td className="text-right text-amber">{formatCurrency(etf.totalFees)}</td>
                    <td className="text-right">
                      <div className="weight-cell">
                        <div className="weight-bar-bg">
                          <div
                            className="weight-bar-fill"
                            style={{
                              width: `${Math.min(etf.weightPercent, 100)}%`,
                              backgroundColor: etf.color,
                            }}
                          />
                        </div>
                        <span className="weight-text">{etf.weightPercent.toFixed(1)} %</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-actions-cell justify-center">
                        <button
                          type="button"
                          onClick={() => onSelectETFForBuy(etf.id)}
                          className="btn btn-xs btn-primary"
                          title="Nouvel achat / vente"
                        >
                          <Plus size={13} />
                          <span>Acheter</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditETF(etf)}
                          className="btn-icon-xs"
                          title="Modifier les informations de l'ETF"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(etf)}
                          className="btn-icon-danger"
                          title="Supprimer l'ETF"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
