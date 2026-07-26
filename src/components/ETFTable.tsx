import { ArrowUpDown, Edit3, Plus, Search, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { usePEA } from '../context/PEAContext';
import type { ETFPerformance } from '../types/pea';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface ETFTableProps {
  onSelectETFForBuy: (etfId: string) => void;
  onEditETFPrice: (etf: ETFPerformance) => void;
}

export const ETFTable: React.FC<ETFTableProps> = ({ onSelectETFForBuy, onEditETFPrice }) => {
  const { etfPerformances, deleteETF } = usePEA();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof ETFPerformance>('currentValuation');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const categories = ['ALL', 'World', 'US', 'Europe', 'Emerging', 'Sector', 'Other'];

  const handleSort = (field: keyof ETFPerformance) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredETFs = etfPerformances.filter((etf) => {
    const matchesSearch =
      etf.name.toLowerCase().includes(search.toLowerCase()) ||
      etf.ticker.toLowerCase().includes(search.toLowerCase()) ||
      etf.isin.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || etf.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedETFs = [...filteredETFs].sort((a, b) => {
    const aVal = a[sortField] ?? 0;
    const bVal = b[sortField] ?? 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
  });

  const handleDelete = (etf: ETFPerformance) => {
    if (
      confirm(
        `Voulez-vous supprimer l'ETF "${etf.name}" (${etf.ticker}) ainsi que son historique ?`,
      )
    ) {
      deleteETF(etf.id);
    }
  };

  return (
    <div className="card table-card">
      <div className="table-header-toolbar">
        <div>
          <h2 className="section-title">Portefeuille d'ETF</h2>
          <p className="section-subtitle">
            Détail des positions, PRM, plus-values et frais par ETF
          </p>
        </div>

        <div className="toolbar-controls">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
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
            {sortedETFs.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center empty-state">
                  Aucun ETF ne correspond à votre recherche.
                </td>
              </tr>
            ) : (
              sortedETFs.map((etf) => {
                const isPositive = etf.gainLoss >= 0;
                return (
                  <tr key={etf.id} className="etf-row">
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
                          <Edit3 size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="text-right font-semibold text-highlight">
                      {formatCurrency(etf.currentValuation)}
                    </td>
                    <td className="text-right">
                      <div
                        className={`gain-loss-cell ${isPositive ? 'text-emerald' : 'text-danger'}`}
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
