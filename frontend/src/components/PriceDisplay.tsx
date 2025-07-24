import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PriceDisplayProps {
  currentPrice: number;
  previousPrice: number;
  animation?: 'up' | 'down' | 'neutral';
  className?: string;
  showIcon?: boolean;
  showPercentage?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  currentPrice,
  previousPrice,
  animation,
  className = '',
  showIcon = true,
  showPercentage = true
}) => {
  const getChangeClass = () => {
    if (animation) {
      return animation === 'up' ? 'animate-price-up' : 
             animation === 'down' ? 'animate-price-down' : '';
    }
    
    if (currentPrice > previousPrice) return 'text-green-600';
    if (currentPrice < previousPrice) return 'text-red-600';
    return 'text-gray-900';
  };

  const getIcon = () => {
    if (!showIcon) return null;
    
    if (currentPrice > previousPrice) return <TrendingUp className="w-4 h-4" />;
    if (currentPrice < previousPrice) return <TrendingDown className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getPercentageChange = () => {
    if (previousPrice === 0) return 0;
    return ((currentPrice - previousPrice) / previousPrice * 100);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`font-bold transition-all duration-300 ${getChangeClass()}`}>
        {currentPrice.toFixed(2)}€
      </div>
      {showPercentage && (
        <div className={`flex items-center gap-1 text-sm ${getChangeClass()}`}>
          {getIcon()}
          <span>
            {getPercentageChange() >= 0 ? '+' : ''}{getPercentageChange().toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default PriceDisplay;