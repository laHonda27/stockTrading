import { useState, useEffect, useCallback } from 'react';
import { Stock } from '../types';
import { stockService } from '../services/api';
import { signalRService } from '../services/signalr';

export const useRealtimeStocks = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceChanges, setPriceChanges] = useState<{[key: number]: 'up' | 'down' | 'neutral'}>({});

  const loadStocks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await stockService.getAll();
      setStocks(data);
    } catch (err: any) {
      setError('Erreur lors du chargement des actions');
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePriceUpdate = useCallback((updatedStocks: Stock[]) => {
    
    const newPriceChanges: {[key: number]: 'up' | 'down' | 'neutral'} = {};
    
    setStocks(prevStocks => {
      const updatedStockMap = new Map(updatedStocks.map(stock => [stock.id, stock]));
      
      const updatedList = prevStocks.map(prevStock => {
        const updatedStock = updatedStockMap.get(prevStock.id);
        if (updatedStock) {
          // Déterminer la direction du changement
          if (updatedStock.currentPrice > prevStock.currentPrice) {
            newPriceChanges[updatedStock.id] = 'up';
          } else if (updatedStock.currentPrice < prevStock.currentPrice) {
            newPriceChanges[updatedStock.id] = 'down';
          } else {
            newPriceChanges[updatedStock.id] = 'neutral';
          }
          return updatedStock;
        }
        return prevStock;
      });
      
      return updatedList;
    });

    // Mettre à jour les animations
    setPriceChanges(prev => ({ ...prev, ...newPriceChanges }));

    // Supprimer les animations après 2 secondes
    setTimeout(() => {
      setPriceChanges(prev => {
        const updated = { ...prev };
        Object.keys(newPriceChanges).forEach(key => {
          delete updated[parseInt(key)];
        });
        return updated;
      });
    }, 2000);
  }, []);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  useEffect(() => {
    signalRService.on('PriceUpdate', handlePriceUpdate);

    return () => {
      signalRService.off('PriceUpdate', handlePriceUpdate);
    };
  }, [handlePriceUpdate]);

  return {
    stocks,
    loading,
    error,
    priceChanges,
    refetch: loadStocks
  };
};