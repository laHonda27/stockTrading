using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using StockTrader.API.Data;
using StockTrader.API.DTOs;
using StockTrader.API.Hubs;
using StockTrader.API.Models;

namespace StockTrader.API.Services
{
    public class StockPriceService : IStockPriceService, IDisposable
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IHubContext<StockPriceHub> _hubContext;
        private readonly ILogger<StockPriceService> _logger;
        private readonly StockSimulationConfig _config;
        private Timer? _timer;
        private readonly Random _random = new();
        private bool _isRunning = false;

        public StockPriceService(
            IServiceScopeFactory serviceScopeFactory,
            IHubContext<StockPriceHub> hubContext,
            ILogger<StockPriceService> logger,
            IOptions<StockSimulationConfig> config)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _hubContext = hubContext;
            _logger = logger;
            _config = config.Value;
        }

        public Task StartSimulation()
        {
            if (_isRunning || !_config.IsEnabled) return Task.CompletedTask;

            _isRunning = true;
            var interval = TimeSpan.FromSeconds(_config.UpdateIntervalSeconds);
            _timer = new Timer(UpdatePrices, null, TimeSpan.Zero, interval);
            _logger.LogInformation($"Simulation des prix démarrée - Intervalle: {_config.UpdateIntervalSeconds}s, Fourchette: {_config.MinPriceChangePercent}% à {_config.MaxPriceChangePercent}%");

            return Task.CompletedTask;
        }

        public Task StopSimulation()
        {
            _isRunning = false;
            _timer?.Dispose();
            _logger.LogInformation("Simulation des prix arrêtée");

            return Task.CompletedTask;
        }

        public async Task<IEnumerable<Stock>> GetCurrentPrices()
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            return await context.Stocks.ToListAsync();
        }

        public Task<bool> IsRunning()
        {
            return Task.FromResult(_isRunning);
        }

        private async void UpdatePrices(object? state)
        {
            if (!_isRunning) return;

            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var stocks = await context.Stocks.ToListAsync();
                var updatedStocks = new List<StockDto>();

                foreach (var stock in stocks)
                {
                    // Sauvegarder le prix précédent
                    stock.PreviousPrice = stock.CurrentPrice;

                    // Calculer le changement de prix basé sur la configuration
                    var changeRange = _config.MaxPriceChangePercent - _config.MinPriceChangePercent;
                    var changePercent = (_random.NextDouble() * changeRange + _config.MinPriceChangePercent) / 100.0;
                    var newPrice = stock.CurrentPrice * (1 + (decimal)changePercent);

                    // Appliquer le prix minimum configuré
                    stock.CurrentPrice = Math.Max(_config.MinPrice, Math.Round(newPrice, 2));
                    stock.LastUpdated = DateTime.UtcNow;

                    updatedStocks.Add(new StockDto
                    {
                        Id = stock.Id,
                        Symbol = stock.Symbol,
                        Name = stock.Name,
                        CurrentPrice = stock.CurrentPrice,
                        PreviousPrice = stock.PreviousPrice,
                        LastUpdated = stock.LastUpdated
                    });
                }

                await context.SaveChangesAsync();

                // Envoyer les nouveaux prix via SignalR
                await _hubContext.Clients.Group("StockPrices").SendAsync("PriceUpdate", updatedStocks);

                _logger.LogDebug($"Prix mis à jour pour {updatedStocks.Count} actions");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de la mise à jour des prix");
            }
        }

        public void Dispose()
        {
            _timer?.Dispose();
        }
    }
}