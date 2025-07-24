import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { portfolioService } from '../services/api';
import { useRealtimeStocks } from '../hooks/useRealtimeStocks';
import PriceDisplay from '../components/PriceDisplay';
import { Wallet, TrendingUp, TrendingDown, Activity, BarChart3, Users, ShoppingCart } from 'lucide-react';

interface DashboardStats {
  totalValue: number;
  totalChange: number;
  totalChangePercentage: number;
  positionsCount: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { stocks, loading: stocksLoading, priceChanges } = useRealtimeStocks();
  const [stats, setStats] = useState<DashboardStats>({
    totalValue: 0,
    totalChange: 0,
    totalChangePercentage: 0,
    positionsCount: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const scrollPosition = useRef<number>(0);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const portfolio = await portfolioService.getPortfolio();
      
      const totalValue = portfolio.reduce((sum, item) => 
        sum + (item.stock.currentPrice * item.quantity), 0);
      
      const totalInvested = portfolio.reduce((sum, item) => 
        sum + (item.averagePrice * item.quantity), 0);
      
      const totalChange = totalValue - totalInvested;
      const totalChangePercentage = totalInvested > 0 ? (totalChange / totalInvested) * 100 : 0;

      setStats({
        totalValue,
        totalChange,
        totalChangePercentage,
        positionsCount: portfolio.length
      });
    } catch (err: any) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Actions populaires (les 6 premières actions)
  const popularStocks = stocks.slice(0, 6);

  if (loadingStats) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header avec indicateur temps réel */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenue, {user?.username} 👋
          </h1>
          <p className="text-gray-600 mt-1">Voici un aperçu de vos investissements</p>
        </div>
        <div className="live-indicator">
          <span className="text-sm text-green-600 font-medium">Live</span>
        </div>
      </div>

      {/* Conseil du jour au-dessus des actions rapides */}
      <div className="mb-6">
        <div className="card mb-4">
          <div className="card-header">
            <h2 className="text-xl font-semibold">💡 Conseil du jour</h2>
          </div>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <p className="text-gray-700">
              <strong>Diversification :</strong> Ne mettez pas tous vos œufs dans le même panier !
              Répartissez vos investissements sur différents secteurs pour réduire les risques.
            </p>
          </div>
        </div>
      </div>

      {/* Actions rapides en ligne (desktop) ou colonne (mobile) */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <button
          onClick={() => window.location.href = '/stocks'}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Acheter des actions
        </button>
        <button
          onClick={() => window.location.href = '/portfolio'}
          className="flex-1 btn-secondary flex items-center justify-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Voir mon portefeuille
        </button>
      </div>

      {/* Nouvelle grille : KPI à gauche, actions populaires à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne KPI (stats) */}
        <div className="flex flex-col gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Solde disponible</p>
              <p className="text-2xl font-bold text-gray-900">
                {user?.balance.toLocaleString('fr-FR')}€
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
              <p className="text-sm text-gray-600">Valeur du portefeuille</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalValue.toLocaleString('fr-FR')}€
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
              <p className={`text-2xl font-bold ${stats.totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.totalChange >= 0 ? '+' : ''}{stats.totalChange.toLocaleString('fr-FR')}€
              </p>
            </div>
            <div className={`p-3 rounded-full ${stats.totalChange >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {stats.totalChange >= 0 ? 
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
              <p className={`text-2xl font-bold ${stats.totalChangePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.totalChangePercentage >= 0 ? '+' : ''}{stats.totalChangePercentage.toFixed(2)}%
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Activity className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>
        {/* Colonne actions populaires (prend 2/3 de la largeur) */}
        <div className="lg:col-span-2">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-xl font-semibold">Actions populaires</h2>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">Live</span>
            </div>
          </div>
          {stocksLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {popularStocks.map((stock) => (
                <div key={stock.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <h3 className="font-semibold text-gray-900">{stock.symbol}</h3>
                    <p className="text-sm text-gray-600">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <PriceDisplay
                      currentPrice={stock.currentPrice}
                      previousPrice={stock.previousPrice}
                      animation={priceChanges[stock.id]}
                      className="text-lg"
                      showIcon={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => window.location.href = '/stocks'}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Voir toutes les actions
            </button>
            </div>
          </div>
        </div>
      </div>





    
    </div>
  );
};

export default Dashboard;