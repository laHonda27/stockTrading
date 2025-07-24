import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { portfolioService } from '../services/api';
import { useRealtimeStocks } from '../hooks/useRealtimeStocks';
import PriceDisplay from '../components/PriceDisplay';
import { TrendingUp, TrendingDown, ShoppingCart, Minus, Plus, Activity, Search } from 'lucide-react';

const Stocks: React.FC = () => {
  const { user, updateUserBalance } = useAuth();
  
  // Remplacer les anciens states par le hook
  const { stocks, loading, error, priceChanges } = useRealtimeStocks();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy');
  const [isTransacting, setIsTransacting] = useState(false);
  const [portfolio, setPortfolio] = useState<any[]>([]);

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Charger le portfolio pour connaître les quantités possédées
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const data = await portfolioService.getPortfolio();
        setPortfolio(data);
      } catch (err) {
        // Pas d'erreur si le portfolio est vide
      }
    };
    loadPortfolio();
  }, []);

  // Fonction pour obtenir la quantité possédée d'une action
  const getOwnedQuantity = (stockId: number) => {
    const position = portfolio.find(item => item.stockId === stockId);
    return position ? position.quantity : 0;
  };

  const handleTransaction = async () => {
    if (!selectedStock || quantity <= 0 || !user) return;

    setIsTransacting(true);
    try {
      if (transactionType === 'buy') {
        const transaction = await portfolioService.buyStock(selectedStock.id, quantity);
        // Calculer le nouveau solde après achat
        const newBalance = user.balance - transaction.totalAmount;
        updateUserBalance(newBalance);
        toast.success(`${quantity} actions de ${selectedStock.symbol} achetées avec succès !`);
      } else {
        const transaction = await portfolioService.sellStock(selectedStock.id, quantity);
        // Calculer le nouveau solde après vente
        const newBalance = user.balance + transaction.totalAmount;
        updateUserBalance(newBalance);
        toast.success(`${quantity} actions de ${selectedStock.symbol} vendues avec succès !`);
      }
      
      setSelectedStock(null);
      setQuantity(1);
      // Recharger le portfolio après transaction
      const data = await portfolioService.getPortfolio();
      setPortfolio(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la transaction');
    } finally {
      setIsTransacting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Actions</h1>
          <p className="text-gray-600 mt-1">Achetez et vendez des actions</p>
        </div>
        <div className="live-indicator">
          <span className="text-sm text-green-600 font-medium">Live</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
            placeholder="Rechercher une action..."
          />
        </div>
      </div>

      {/* Stocks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredStocks.map((stock) => {
          const ownedQuantity = getOwnedQuantity(stock.id);
          return (
            <div key={stock.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{stock.symbol}</h3>
                    {ownedQuantity > 0 && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                        {ownedQuantity}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{stock.name}</p>
                </div>
                <div className="text-right">
                  <PriceDisplay
                    currentPrice={stock.currentPrice}
                    previousPrice={stock.previousPrice}
                    animation={priceChanges[stock.id]}
                    className="text-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedStock(stock);
                    setTransactionType('buy');
                    setQuantity(1);
                  }}
                  className="btn-success flex-1 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Acheter
                </button>
                <button
                  onClick={() => {
                    setSelectedStock(stock);
                    setTransactionType('sell');
                    setQuantity(Math.min(1, ownedQuantity));
                  }}
                  disabled={ownedQuantity === 0}
                  className="btn-danger flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                  Vendre
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Modal */}
      {selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {transactionType === 'buy' ? 'Acheter' : 'Vendre'} {selectedStock.symbol}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>{selectedStock.name}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Prix actuel: <span className="font-semibold">{selectedStock.currentPrice.toFixed(2)}€</span>
              </p>
              {transactionType === 'sell' && (
                <p className="text-sm text-gray-600 mb-2">
                  Quantité possédée: <span className="font-semibold text-blue-600">{getOwnedQuantity(selectedStock.id)}</span>
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="btn-secondary w-10 h-10 flex items-center justify-center"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={transactionType === 'sell' ? getOwnedQuantity(selectedStock.id) : undefined}
                  value={quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value) || 1;
                    const maxQuantity = transactionType === 'sell' ? getOwnedQuantity(selectedStock.id) : Infinity;
                    setQuantity(Math.min(Math.max(1, newQuantity), maxQuantity));
                  }}
                  className="input-field text-center flex-1"
                />
                <button
                  onClick={() => {
                    const maxQuantity = transactionType === 'sell' ? getOwnedQuantity(selectedStock.id) : quantity + 1;
                    setQuantity(Math.min(quantity + 1, maxQuantity));
                  }}
                  className="btn-secondary w-10 h-10 flex items-center justify-center"
                  disabled={transactionType === 'sell' && quantity >= getOwnedQuantity(selectedStock.id)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {transactionType === 'sell' && getOwnedQuantity(selectedStock.id) > 0 && (
                <button
                  onClick={() => setQuantity(getOwnedQuantity(selectedStock.id))}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Tout vendre ({getOwnedQuantity(selectedStock.id)})
                </button>
              )}
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Montant total</span>
                <span className="font-semibold">{(selectedStock.currentPrice * quantity).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Solde disponible</span>
                <span className="font-semibold text-green-600">{user?.balance.toLocaleString('fr-FR')}€</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedStock(null)}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleTransaction}
                disabled={isTransacting || (transactionType === 'buy' && user !== null && (selectedStock.currentPrice * quantity) > user.balance)}
                className={`${transactionType === 'buy' ? 'btn-success' : 'btn-danger'} flex-1 flex items-center justify-center gap-2`}
              >
                {isTransacting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                {isTransacting ? 'Traitement...' : (transactionType === 'buy' ? 'Acheter' : 'Vendre')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stocks;