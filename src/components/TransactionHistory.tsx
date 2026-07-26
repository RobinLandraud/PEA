import { ArrowDownLeft, ArrowUpRight, PlusCircle, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { usePEA } from '../context/PEAContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export const TransactionHistory: React.FC = () => {
  const { deposits, transactions, etfs, deleteDeposit, deleteTransaction } = usePEA();
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'DEPOSITS'>('TRANSACTIONS');

  const getEtfInfo = (etfId: string) => {
    return etfs.find((e) => e.id === etfId) || { name: 'ETF Inconnu', ticker: '???' };
  };

  return (
    <div className="card history-card mt-6">
      <div className="history-header">
        <div>
          <h3 className="section-title">Historique & Mouvements</h3>
          <p className="section-subtitle">Journal détaillé des versements et transactions du PEA</p>
        </div>

        <div className="tab-buttons">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'TRANSACTIONS' ? 'active' : ''}`}
            onClick={() => setActiveTab('TRANSACTIONS')}
          >
            Transactions ({transactions.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'DEPOSITS' ? 'active' : ''}`}
            onClick={() => setActiveTab('DEPOSITS')}
          >
            Dépôts d'espèces ({deposits.length})
          </button>
        </div>
      </div>

      {activeTab === 'TRANSACTIONS' ? (
        <div className="table-responsive">
          <table className="etf-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>ETF</th>
                <th className="text-right">Quantité</th>
                <th className="text-right">Prix Unitaire</th>
                <th className="text-right">Montant Total</th>
                <th className="text-right">Frais</th>
                <th>Note</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center empty-state">
                    Aucune transaction enregistrée.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const etf = getEtfInfo(tx.etfId);
                  const isBuy = tx.type === 'BUY';
                  const totalAmount = tx.quantity * tx.pricePerUnit;
                  return (
                    <tr key={tx.id}>
                      <td>{formatDate(tx.date)}</td>
                      <td>
                        <span className={`badge-pill ${isBuy ? 'badge-buy' : 'badge-sell'}`}>
                          {isBuy ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {isBuy ? 'Achat' : 'Vente'}
                        </span>
                      </td>
                      <td>
                        <strong>{etf.ticker}</strong> -{' '}
                        <span className="text-muted">{etf.name}</span>
                      </td>
                      <td className="text-right font-medium">{tx.quantity}</td>
                      <td className="text-right">{formatCurrency(tx.pricePerUnit)}</td>
                      <td className="text-right font-semibold">{formatCurrency(totalAmount)}</td>
                      <td className="text-right text-amber">{formatCurrency(tx.fee)}</td>
                      <td className="text-muted">{tx.note || '-'}</td>
                      <td>
                        <div className="justify-center flex">
                          <button
                            type="button"
                            onClick={() => deleteTransaction(tx.id)}
                            className="btn-icon-danger"
                            title="Supprimer transaction"
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
      ) : (
        <div className="table-responsive">
          <table className="etf-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th className="text-right">Montant Versement</th>
                <th>Note / Intitulé</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center empty-state">
                    Aucun dépôt enregistré.
                  </td>
                </tr>
              ) : (
                deposits.map((dep) => (
                  <tr key={dep.id}>
                    <td>{formatDate(dep.date)}</td>
                    <td>
                      <span className="badge-pill badge-emerald-sm">
                        <PlusCircle size={12} />
                        Dépôt d'espèces
                      </span>
                    </td>
                    <td className="text-right font-semibold text-emerald">
                      {formatCurrency(dep.amount)}
                    </td>
                    <td>{dep.note || 'Versement PEA'}</td>
                    <td>
                      <div className="justify-center flex">
                        <button
                          type="button"
                          onClick={() => deleteDeposit(dep.id)}
                          className="btn-icon-danger"
                          title="Supprimer dépôt"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
