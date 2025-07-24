import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { portfolioService } from '../services/api';
import { useRealtimeStocks } from '../hooks/useRealtimeStocks';
import PriceDisplay from '../components/PriceDisplay';
import { Portfolio } from '../types';
import { Wallet, TrendingUp, TrendingDown, Activity, BarChart3, Plus, Minus, ShoppingCart } from 'lucide-react';

const PortfolioPage: React.FC = () => {
  const { user, updateUserBalance } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const { stocks, priceChanges } = useRealtimeStocks();
  
  // Modal state pour les transactions
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy');
  const [isTransacting, setIsTransacting] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, []);

  // Mettre à jour les prix du portfolio quand les stocks changent
  useEffect(() => {
    if (portfolio.length > 0 && stocks.length > 0) {
      setPortfolio(prevPortfolio => 
        prevPortfolio.map(item => {
          const updatedStock = stocks.find(stock => stock.id === item.stockId);
          if (updatedStock) {
            return {
              ...item,
              stock: {
                ...item.stock,
                currentPrice: updatedStock.currentPrice,
                previousPrice: updatedStock.previousPrice,
                lastUpdated: updatedStock.lastUpdated
              }
            };
          }
          return item;
        })
      );
    }
  }, [stocks, portfolio.length]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const data = await portfolioService.getPortfolio();
      setPortfolio(data);
    } catch (err: any) {
      toast.error('Erreur lors du chargement du portefeuille');
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async () => {
    if (!selectedStock || quantity <= 0 || !user) return;

    setIsTransacting(true);
    try {
      if (transactionType === 'buy') {
        const transaction = await portfolioService.buyStock(selectedStock.stock.id, quantity);
        const newBalance = user.balance - transaction.totalAmount;
        updateUserBalance(newBalance);
        toast.success(`${quantity} actions de ${selectedStock.stock.symbol} achetées !`);
      } else {
        const transaction = await portfolioService.sellStock(selectedStock.stock.id, quantity);
        const newBalance = user.balance + transaction.totalAmount;
        updateUserBalance(newBalance);
        toast.success(`${quantity} actions de ${selectedStock.stock.symbol} vendues !`);
      }
      
      setSelectedStock(null);
      setQuantity(1);
      // Recharger le portfolio après transaction
      await loadPortfolio();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la transaction');
    } finally {
      setIsTransacting(false);
    }
  };

  const calculateTotalValue = () => {
    return portfolio.reduce((total, item) => {
      return total + (item.stock.currentPrice * item.quantity);
    }, 0);
  };

  const calculateTotalChange = () => {
    return portfolio.reduce((total, item) => {
      const change = (item.stock.currentPrice - item.averagePrice) * item.quantity;
      return total + change;
    }, 0);
  };

  const calculateTotalInvested = () => {
    return portfolio.reduce((total, item) => {
      return total + (item.averagePrice * item.quantity);
    }, 0);
  };

  const getItemChange = (item: Portfolio) => {
    return (item.stock.currentPrice - item.averagePrice) * item.quantity;
  };

  const getItemChangePercentage = (item: Portfolio) => {
    return ((item.stock.currentPrice - item.averagePrice) / item.averagePrice) * 100;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalValue = calculateTotalValue();
  const totalChange = calculateTotalChange();
  const totalInvested = calculateTotalInvested();
  const totalChangePercentage = totalInvested > 0 ? (totalChange / totalInvested) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
        <h1 className="text-3xl font-bold text-gray-900">Mon Portefeuille</h1>
        <p className="text-gray-600 mt-1">Gérez vos investissements</p>
      </div>
        <div className="live-indicator">
          <span className="text-sm text-green-600 font-medium">Live</span>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valeur totale</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalValue.toLocaleString('fr-FR')}€
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Investissement</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalInvested.toLocaleString('fr-FR')}€
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Plus/moins-value</p>
              <p className={`text-2xl font-bold ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalChange >= 0 ? '+' : ''}{totalChange.toLocaleString('fr-FR')}€
              </p>
            </div>
            <div className={`p-3 rounded-full ${totalChange >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {totalChange >= 0 ? 
                <TrendingUp className="w-6 h-6 text-green-600" /> : 
                <TrendingDown className="w-6 h-6 text-red-600" />
              }
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Performance</p>
              <p className={`text-2xl font-bold ${totalChangePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalChangePercentage >= 0 ? '+' : ''}{totalChangePercentage.toFixed(2)}%
              </p>
            </div>
            <div className={`p-3 rounded-full ${totalChangePercentage >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Details */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-xl font-semibold">Mes positions</h2>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">Live</span>
          </div>
        </div>

        {portfolio.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Quantité</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Prix moyen</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Prix actuel</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Valeur</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">+/- Value</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Performance</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((item) => {
                  const change = getItemChange(item);
                  const changePercentage = getItemChangePercentage(item);
                  const value = item.stock.currentPrice * item.quantity;
                  
                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-semibold text-gray-900">{item.stock.symbol}</div>
                          <div className="text-sm text-gray-600">{item.stock.name}</div>
                        </div>
                      </td>
                      <td className="text-right py-4 px-4 font-medium">{item.quantity}</td>
                      <td className="text-right py-4 px-4">{item.averagePrice.toFixed(2)}€</td>
                      <td className="text-right py-4 px-4">
                        <div className="flex justify-end">
                          <PriceDisplay
                            currentPrice={item.stock.currentPrice}
                            previousPrice={item.stock.previousPrice}
                            animation={priceChanges[item.stock.id]}
                            showIcon={false}
                            showPercentage={false}
                          />
                        </div>
                      </td>
                      <td className="text-right py-4 px-4 font-semibold">{value.toLocaleString('fr-FR')}€</td>
                      <td className={`text-right py-4 px-4 font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}€
                      </td>
                      <td className={`text-right py-4 px-4 font-semibold ${changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(2)}%
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => {
                              setSelectedStock(item);
                              setTransactionType('buy');
                              setQuantity(1);
                            }}
                            className="btn-success-sm flex items-center gap-1"
                            title="Acheter plus"
                          >
                            <Plus className="w-3 h-3" />
                            Acheter
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStock(item);
                              setTransactionType('sell');
                              setQuantity(Math.min(1, item.quantity));
                            }}
                            className="btn-danger-sm flex items-center gap-1"
                            title="Vendre"
                          >
                            <Minus className="w-3 h-3" />
                            Vendre
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune position</h3>
            <p className="text-gray-600 mb-4">Vous n'avez pas encore d'actions dans votre portefeuille</p>
            <button
              onClick={() => window.location.href = '/stocks'}
              className="btn-primary"
            >
              Commencer à investir
            </button>
          </div>
        )}
      </div>

      {/* Modal de transaction */}
      {selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {transactionType === 'buy' ? 'Acheter' : 'Vendre'} {selectedStock.stock.symbol}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>{selectedStock.stock.name}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Prix actuel: <span className="font-semibold">{selectedStock.stock.currentPrice.toFixed(2)}€</span>
              </p>
              {transactionType === 'sell' && (
                <p className="text-sm text-gray-600 mb-2">
                  Quantité possédée: <span className="font-semibold text-blue-600">{selectedStock.quantity}</span>
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
                  max={transactionType === 'sell' ? selectedStock.quantity : undefined}
                  value={quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value) || 1;
                    const maxQuantity = transactionType === 'sell' ? selectedStock.quantity : Infinity;
                    setQuantity(Math.min(Math.max(1, newQuantity), maxQuantity));
                  }}
                  className="input-field text-center flex-1"
                />
                <button
                  onClick={() => {
                    const maxQuantity = transactionType === 'sell' ? selectedStock.quantity : quantity + 1;
                    setQuantity(Math.min(quantity + 1, maxQuantity));
                  }}
                  className="btn-secondary w-10 h-10 flex items-center justify-center"
                  disabled={transactionType === 'sell' && quantity >= selectedStock.quantity}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {transactionType === 'sell' && (
                <button
                  onClick={() => setQuantity(selectedStock.quantity)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Tout vendre ({selectedStock.quantity})
                </button>
              )}
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Montant total</span>
                <span className="font-semibold">{(selectedStock.stock.currentPrice * quantity).toFixed(2)}€</span>
              </div>
              {transactionType === 'buy' && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Solde disponible</span>
                  <span className="font-semibold text-green-600">{user?.balance.toLocaleString('fr-FR')}€</span>
                </div>
              )}
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
                disabled={isTransacting || (transactionType === 'buy' && user !== null && (selectedStock.stock.currentPrice * quantity) > user.balance)}
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

export default PortfolioPage;