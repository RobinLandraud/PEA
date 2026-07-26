import type React from 'react';
import { useState } from 'react';
import { ChartsView } from './components/ChartsView';
import { ETFTable } from './components/ETFTable';
import { Header } from './components/Header';
import { AddDepositModal } from './components/Modals/AddDepositModal';
import { AddETFModal } from './components/Modals/AddETFModal';
import { AddTransactionModal } from './components/Modals/AddTransactionModal';
import { EditPriceModal } from './components/Modals/EditPriceModal';
import { SummaryCards } from './components/SummaryCards';
import { TransactionHistory } from './components/TransactionHistory';
import { PEAProvider } from './context/PEAContext';
import type { ETFPerformance } from './types/pea';

export const AppContent: React.FC = () => {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isEtfModalOpen, setIsEtfModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedEtfIdForTx, setSelectedEtfIdForTx] = useState<string | undefined>(undefined);

  const handleOpenTxModalForETF = (etfId: string) => {
    setSelectedEtfIdForTx(etfId);
    setIsTxModalOpen(true);
  };

  const handleOpenTxModalGeneral = () => {
    setSelectedEtfIdForTx(undefined);
    setIsTxModalOpen(true);
  };

  const handleEditPrice = (_etf: ETFPerformance) => {
    setIsPriceModalOpen(true);
  };

  return (
    <div className="app-container">
      <Header
        onOpenDepositModal={() => setIsDepositModalOpen(true)}
        onOpenTransactionModal={handleOpenTxModalGeneral}
        onOpenETFModal={() => setIsEtfModalOpen(true)}
        onOpenQuickPrices={() => setIsPriceModalOpen(true)}
      />

      <main className="main-content">
        <SummaryCards />

        <div className="layout-section">
          <ETFTable onSelectETFForBuy={handleOpenTxModalForETF} onEditETFPrice={handleEditPrice} />
        </div>

        <div className="layout-section">
          <ChartsView />
        </div>

        <div className="layout-section">
          <TransactionHistory />
        </div>
      </main>

      <footer className="app-footer">
        <p>
          PEA Portfolio Manager &copy; {new Date().getFullYear()} - Application de suivi financière
          personnelle
        </p>
      </footer>

      <AddDepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} />

      <AddTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        initialEtfId={selectedEtfIdForTx}
        onOpenETFModal={() => setIsEtfModalOpen(true)}
      />

      <AddETFModal isOpen={isEtfModalOpen} onClose={() => setIsEtfModalOpen(false)} />

      <EditPriceModal isOpen={isPriceModalOpen} onClose={() => setIsPriceModalOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <PEAProvider>
      <AppContent />
    </PEAProvider>
  );
}

export default App;
