import { Plus, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { usePEA } from '../../context/PEAContext';
import type { ETFCategory } from '../../types/pea';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddETFModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { addETF } = usePEA();
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [isin, setIsin] = useState('');
  const [category, setCategory] = useState<ETFCategory>('World');
  const [currentPrice, setCurrentPrice] = useState('');
  const [color, setColor] = useState('#3b82f6');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(currentPrice);
    if (!name || !ticker || !priceNum || priceNum <= 0) {
      alert('Veuillez remplir correctement tous les champs obligatoires.');
      return;
    }

    addETF({
      name: name.trim(),
      ticker: ticker.trim().toUpperCase(),
      isin: isin.trim().toUpperCase() || 'FR0000000000',
      category,
      currentPrice: priceNum,
      color,
    });

    setName('');
    setTicker('');
    setIsin('');
    setCurrentPrice('');
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Plus className="text-secondary" size={20} />
            <h3 className="modal-title">Ajouter un nouvel ETF au catalogue</h3>
          </div>
          <button type="button" onClick={onClose} className="btn-icon-xs">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Nom complet de l'ETF</label>
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
              <label className="form-label">Ticker (Symbole)</label>
              <input
                type="text"
                placeholder="ex: CW8, ESE, WLD..."
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
                placeholder="ex: LU1681043599"
                value={isin}
                onChange={(e) => setIsin(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Catégorie géographique / Sectorielle</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ETFCategory)}
                className="form-control"
              >
                <option value="World">World (Monde)</option>
                <option value="US">US (États-Unis / S&P 500 / Nasdaq)</option>
                <option value="Europe">Europe (CAC 40 / Stoxx 600)</option>
                <option value="Emerging">Emerging (Pays Émergents)</option>
                <option value="Sector">Sector (Santé, Tech, Eau...)</option>
                <option value="Other">Autre</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cours actuel (€)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="ex: 512.40"
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
              <span className="text-muted">{color}</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              Ajouter l'ETF
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
