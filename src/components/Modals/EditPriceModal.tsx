import { X, Zap } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { usePEA } from '../../context/PEAContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditPriceModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { etfs, updateETFPrice } = usePEA();
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const e of etfs) {
      init[e.id] = e.currentPrice.toString();
    }
    return init;
  });

  if (!isOpen) return null;

  const handlePriceChange = (id: string, value: string) => {
    setPrices((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    for (const etf of etfs) {
      const val = parseFloat(prices[etf.id]);
      if (val && val > 0 && val !== etf.currentPrice) {
        updateETFPrice(etf.id, val);
      }
    }
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Zap className="text-amber" size={20} />
            <h3 className="modal-title">Ajuster les Cours de Marché</h3>
          </div>
          <button type="button" onClick={onClose} className="btn-icon-xs">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSaveAll} className="modal-body">
          <p className="text-muted text-sm mb-4">
            Mettez à jour rapidement les cours actuels pour recalculer la valeur de votre
            portefeuille.
          </p>

          <div className="price-list-container">
            {etfs.map((etf) => (
              <div key={etf.id} className="price-edit-row">
                <div className="etf-identity">
                  <div className="etf-color-tag" style={{ backgroundColor: etf.color }} />
                  <div>
                    <strong>{etf.ticker}</strong> - {etf.name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Cours:</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={prices[etf.id] ?? etf.currentPrice}
                    onChange={(e) => handlePriceChange(etf.id, e.target.value)}
                    className="form-control input-sm w-32"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn btn-emerald">
              Enregistrer les cours
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
