import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../services/api';
import { Settings, Play, Square, RotateCcw, Activity, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface SimulationConfig {
  updateIntervalSeconds: number;
  maxPriceChangePercent: number;
  minPriceChangePercent: number;
  minPrice: number;
  isEnabled: boolean;
}

const Admin: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSimulationConfig();
      setConfig(data);
    } catch (err: any) {
      toast.error('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setActionLoading(action);
    try {
      let result;
      switch (action) {
        case 'start':
          result = await adminService.startSimulation();
          break;
        case 'stop':
          result = await adminService.stopSimulation();
          break;
        case 'restart':
          result = await adminService.restartSimulation();
          break;
      }
      toast.success(result.message);
      await loadConfig(); // Recharger la config après action
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Erreur lors de l'action ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <p className="text-red-600">Impossible de charger la configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Administration
          </h1>
          <p className="text-gray-600 mt-1">Configuration de la simulation des prix</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${config.isEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm font-medium ${config.isEnabled ? 'text-green-600' : 'text-red-600'}`}>
            {config.isEnabled ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Configuration actuelle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Paramètres de simulation */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Paramètres de simulation
            </h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Intervalle de mise à jour</p>
                  <p className="text-sm text-gray-600">Fréquence des changements de prix</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{config.updateIntervalSeconds}s</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Variation maximale</p>
                  <p className="text-sm text-gray-600">Hausse maximale par update</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">+{config.maxPriceChangePercent}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-gray-900">Variation minimale</p>
                  <p className="text-sm text-gray-600">Baisse maximale par update</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">{config.minPriceChangePercent}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Prix minimum</p>
                  <p className="text-sm text-gray-600">Plancher des prix</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">{config.minPrice}€</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Actions de contrôle</h2>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleAction('start')}
              disabled={config.isEnabled || actionLoading === 'start'}
              className="w-full p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  {actionLoading === 'start' ? (
                    <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Play className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Démarrer la simulation</h3>
                  <p className="text-sm text-gray-600">Lance la génération automatique des prix</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAction('stop')}
              disabled={!config.isEnabled || actionLoading === 'stop'}
              className="w-full p-4 text-left bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  {actionLoading === 'stop' ? (
                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Square className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Arrêter la simulation</h3>
                  <p className="text-sm text-gray-600">Stoppe la génération des prix</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAction('restart')}
              disabled={actionLoading === 'restart'}
              className="w-full p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {actionLoading === 'restart' ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <RotateCcw className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Redémarrer la simulation</h3>
                  <p className="text-sm text-gray-600">Applique les nouveaux paramètres</p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900">Configuration</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Pour modifier les paramètres, éditez le fichier <code className="bg-gray-200 px-1 rounded">appsettings.json</code> du backend et redémarrez la simulation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informations sur les paramètres */}
      <div className="mt-8 card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Guide des paramètres</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Exemples de configuration</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <strong>Mode calme :</strong> ±1%, 10s d'intervalle
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <strong>Mode normal :</strong> ±5%, 3s d'intervalle
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <strong>Mode volatil :</strong> ±15%, 1s d'intervalle
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Impact des paramètres</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• <strong>Intervalle :</strong> Fréquence des changements</p>
              <p>• <strong>Variation max/min :</strong> Amplitude des mouvements</p>
              <p>• <strong>Prix minimum :</strong> Plancher de sécurité</p>
              <p>• <strong>Status :</strong> Active/désactive le système</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin; 