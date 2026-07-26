import { Edit3, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { usePEA } from '../../context/PEAContext';
import type { ETF, ETFCategory } from '../../types/pea';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  etf: ETF | null;
}

export const EditETFModal: React.FC<ModalProps> = ({ isOpen, onClose, etf }) => {
  const { updateETF } = usePEA();
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [isin, setIsin] = useState('');
  const [category, setCategory] = useState<ETFCategory>('World');
  const [currentPrice, setCurrentPrice] = useState('');
  const [color, setColor] = useState('#3b82f6');

  useEffect(() => {
    if (etf) {
      setName(etf.name);
      setTicker(etf.ticker);
      setIsin(etf.isin);
      setCategory(etf.category);
      setCurrentPrice(etf.currentPrice.toString());
      setColor(etf.color);
    }
  }, [etf]);

  if (!isOpen || !etf) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(currentPrice);
    if (!name.trim() || !ticker.trim() || !priceNum || priceNum <= 0) {
      alert('Veuillez remplir correctement tous les champs obligatoires.');
      return;
    }

    updateETF(etf.id, {
      name: name.trim(),
      ticker: ticker.trim().toUpperCase(),
      isin: isin.trim().toUpperCase() || etf.isin,
      category,
      currentPrice: priceNum,
      color,
    });

    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Edit3 className="text-primary" size={20} />
            <h3 className="modal-title">Modifier l'ETF</h3>
          </div>
          <button type="button" onClick={onClose} className="btn-icon-xs">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Nom complet de l'ETF *</label>
            <input
              type="text"
              placeholder="ex: Amundi MSCI World UCITS ETF"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Ticker (Symbole) *</label>
              <input
                type="text"
                placeholder="ex: CW8, DCAM..."
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Code ISIN</label>
              <input
                type="text"
                placeholder="ex: FR001400U5Q4"
                value={isin}
                onChange={(e) => setIsin(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ETFCategory)}
                className="form-control"
              >
                <option value="World">World (Monde)</option>
                <option value="US">US (S&P 500 / Nasdaq)</option>
                <option value="Europe">Europe (CAC 40 / Stoxx 600)</option>
                <option value="Emerging">Emerging (Pays Émergents)</option>
                <option value="Sector">Sector (Santé, Tech, Eau...)</option>
                <option value="Other">Autre</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cours actuel (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Couleur d'accentuation</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="color-picker-input"
              />
              <div className="color-preview" style={{ backgroundColor: color }}>
                <span className="ticker-badge" style={{ borderColor: color, color }}>
                  {ticker || 'TICK'}
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
