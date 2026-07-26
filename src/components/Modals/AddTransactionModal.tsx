import { Plus, TrendingUp, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { usePEA } from '../../context/PEAContext';
import { formatCurrency } from '../../utils/formatters';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEtfId?: string;
  onOpenETFModal?: () => void;
}

export const AddTransactionModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  initialEtfId,
  onOpenETFModal,
}) => {
  const { etfs, addTransaction, summary } = usePEA();
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [etfId, setEtfId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [fee, setFee] = useState('0');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (initialEtfId) {
      setEtfId(initialEtfId);
      const selEtf = etfs.find((e) => e.id === initialEtfId);
      if (selEtf) {
        setPricePerUnit(selEtf.currentPrice.toString());
      }
    } else if (etfs.length > 0 && (!etfId || !etfs.some((e) => e.id === etfId))) {
      setEtfId(etfs[0].id);
      setPricePerUnit(etfs[0].currentPrice.toString());
    }
  }, [initialEtfId, etfs, etfId]);

  if (!isOpen) return null;

  const handleETFChange = (id: string) => {
    setEtfId(id);
    const selEtf = etfs.find((e) => e.id === id);
    if (selEtf) {
      setPricePerUnit(selEtf.currentPrice.toString());
    }
  };

  const qtyNum = parseFloat(quantity) || 0;
  const priceNum = parseFloat(pricePerUnit) || 0;
  const feeNum = parseFloat(fee) || 0;
  const totalCost = qtyNum * priceNum + (type === 'BUY' ? feeNum : -feeNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!etfId) {
      alert('Veuillez sélectionner un ETF.');
      return;
    }
    if (qtyNum <= 0 || priceNum <= 0) {
      alert('Veuillez saisir une quantité et un prix unitaire valides.');
      return;
    }

    if (type === 'BUY' && totalCost > summary.cashRemaining) {
      const confirmProceed = confirm(
        `Attention: Le montant de l'achat (${formatCurrency(totalCost)}) dépasse votre solde d'espèces disponible (${formatCurrency(summary.cashRemaining)}). Voulez-vous continuer ?`,
      );
      if (!confirmProceed) return;
    }

    addTransaction({
      etfId,
      type,
      date,
      quantity: qtyNum,
      pricePerUnit: priceNum,
      fee: feeNum,
      note: note.trim() || undefined,
    });

    setQuantity('');
    setNote('');
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-primary" size={20} />
            <h3 className="modal-title">Nouvelle Transaction ETF</h3>
          </div>
          <button type="button" onClick={onClose} className="btn-icon-xs">
            <X size={18} />
          </button>
        </div>

        {etfs.length === 0 ? (
          <div className="modal-body text-center py-6">
            <p className="text-muted mb-4">
              Aucun ETF n'est présent dans votre catalogue pour le moment.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenETFModal) onOpenETFModal();
              }}
              className="btn btn-primary justify-center"
            >
              <Plus size={18} />
              <span>Créer votre premier ETF (ex: MSCI World, S&P 500...)</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-body">
            <div className="form-group">
              <label className="form-label">Type d'opération</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`btn ${type === 'BUY' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setType('BUY')}
                >
                  Achat (Buy)
                </button>
                <button
                  type="button"
                  className={`btn ${type === 'SELL' ? 'btn-emerald' : 'btn-secondary'}`}
                  onClick={() => setType('SELL')}
                >
                  Vente (Sell)
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Sélectionner l'ETF</label>
              <select
                value={etfId}
                onChange={(e) => handleETFChange(e.target.value)}
                className="form-control"
                required
              >
                {etfs.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.ticker} - {e.name} ({formatCurrency(e.currentPrice)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quantité d'actions</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="ex: 10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Prix unitaire d'exécution (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="ex: 500.00"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Frais de courtage (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="ex: 2.50"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            <div className="transaction-summary-box">
              <div className="flex justify-between">
                <span>Montant brut :</span>
                <strong>{formatCurrency(qtyNum * priceNum)}</strong>
              </div>
              <div className="flex justify-between mt-1">
                <span>Impact solde espèces :</span>
                <strong className={type === 'BUY' ? 'text-danger' : 'text-emerald'}>
                  {type === 'BUY' ? '-' : '+'}
                  {formatCurrency(totalCost)}
                </strong>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Note / Commentaire (optionnel)</label>
              <input
                type="text"
                placeholder="ex: Achat périodique DCA, Rééquilibrage..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                Valider la transaction
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
