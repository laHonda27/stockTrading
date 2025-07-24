using StockTrader.API.Models;

namespace StockTrader.API.Services
{
    public interface IStockPriceService
    {
        Task StartSimulation();
        Task StopSimulation();
        Task<IEnumerable<Stock>> GetCurrentPrices();
    }
}