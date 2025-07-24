namespace StockTrader.API.Models
{
    public class StockSimulationConfig
    {
        public const string SectionName = "StockSimulation";
        
        public int UpdateIntervalSeconds { get; set; } = 3;
        public double MaxPriceChangePercent { get; set; } = 5.0;
        public double MinPriceChangePercent { get; set; } = -5.0;
        public decimal MinPrice { get; set; } = 0.01m;
        public bool IsEnabled { get; set; } = true;
    }
} 