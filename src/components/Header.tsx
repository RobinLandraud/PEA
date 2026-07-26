import {
  Download,
  Plus,
  PlusCircle,
  RotateCcw,
  Trash2,
  TrendingUp,
  Upload,
  Wallet,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useRef } from 'react';
import { usePEA } from '../context/PEAContext';
import { formatCurrency } from '../utils/formatters';

interface HeaderProps {
  onOpenDepositModal: () => void;
  onOpenTransactionModal: () => void;
  onOpenETFModal: () => void;
  onOpenQuickPrices: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDepositModal,
  onOpenTransactionModal,
  onOpenETFModal,
  onOpenQuickPrices,
}) => {
  const { summary, exportData, importData, resetToDefaults, clearAll } = usePEA();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pea_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importData(content);
        if (success) {
          alert('Données réimportées avec succès !');
        } else {
          alert("Erreur lors de l'importation des données (format invalide).");
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleClearAll = () => {
    if (
      confirm(
        "Voulez-vous vraiment effacer TOUTES les données de votre PEA (dépôts, ETF et transactions) pour repartir d'un portefeuille vierge à 0 € ?",
      )
    ) {
      clearAll();
    }
  };

  const handleLoadDemo = () => {
    if (confirm("Voulez-vous réinjecter le jeu de données d'exemple de démonstration ?")) {
      resetToDefaults();
    }
  };

  const remainingToCeiling = summary.peaCeilingLimit - summary.totalDeposits;

  return (
    <header className="header-container">
      <div className="header-top">
        <div className="brand-section">
          <div className="brand-icon">
            <Wallet className="icon-main" size={28} />
          </div>
          <div>
            <h1 className="brand-title">PEA Manager</h1>
            <p className="brand-subtitle">Gestionnaire de Plan d'Épargne en Actions</p>
          </div>
        </div>

        <div className="header-actions">
          <button type="button" onClick={onOpenDepositModal} className="btn btn-emerald">
            <PlusCircle size={18} />
            <span>Nouveau Dépôt</span>
          </button>

          <button type="button" onClick={onOpenTransactionModal} className="btn btn-primary">
            <TrendingUp size={18} />
            <span>Acheter / Vendre</span>
          </button>

          <button type="button" onClick={onOpenETFModal} className="btn btn-secondary">
            <Plus size={18} />
            <span>Ajouter ETF</span>
          </button>

          <button type="button" onClick={onOpenQuickPrices} className="btn btn-outline">
            <Zap size={16} />
            <span>Ajuster Cours</span>
          </button>

          <div className="action-divider" />

          <button
            type="button"
            onClick={handleExport}
            className="btn btn-ghost"
            title="Exporter en JSON"
          >
            <Download size={16} />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-ghost"
            title="Importer sauvegarde JSON"
          >
            <Upload size={16} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={handleLoadDemo}
            className="btn btn-ghost"
            title="Charger les données d'exemple de démonstration"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="btn btn-ghost text-danger"
            title="Vider complètement le portefeuille (Tout effacer)"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="ceiling-bar-container">
        <div className="ceiling-header">
          <span>Plafond des versements PEA (150 000 €)</span>
          <span className="ceiling-stats">
            <strong>{formatCurrency(summary.totalDeposits)}</strong> /{' '}
            {formatCurrency(summary.peaCeilingLimit)}{' '}
            <span className="text-muted">
              ({summary.peaCeilingUsedPercent.toFixed(1)} % atteint)
            </span>
          </span>
        </div>
        <div className="ceiling-progress-track">
          <div
            className="ceiling-progress-fill"
            style={{ width: `${Math.min(summary.peaCeilingUsedPercent, 100)}%` }}
          />
        </div>
        <div className="ceiling-footer">
          <span>
            Capacité de versement restante :{' '}
            <strong>{formatCurrency(Math.max(remainingToCeiling, 0))}</strong>
          </span>
          <span>
            Patrimoine total (Portefeuille + Reste) :{' '}
            <strong className="text-highlight">{formatCurrency(summary.totalWealth)}</strong>
          </span>
        </div>
      </div>
    </header>
  );
};
