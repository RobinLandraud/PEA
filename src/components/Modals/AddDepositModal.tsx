import { PlusCircle, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { usePEA } from '../../context/PEAContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDepositModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { addDeposit } = usePEA();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Veuillez saisir un montant valide.');
      return;
    }

    addDeposit({
      date,
      amount: numAmount,
      note: note.trim() || undefined,
    });

    setAmount('');
    setNote('');
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <PlusCircle className="text-emerald" size={20} />
            <h3 className="modal-title">Nouveau Dépôt d'espèces (PEA)</h3>
          </div>
          <button type="button" onClick={onClose} className="btn-icon-xs">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Date du versement</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Montant (€)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="ex: 1500.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Note / Intitulé (optionnel)</label>
            <input
              type="text"
              placeholder="ex: Épargne mensuelle, Prime..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn btn-emerald">
              Enregistrer le dépôt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
