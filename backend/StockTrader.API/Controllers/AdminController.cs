using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using StockTrader.API.Models;
using StockTrader.API.Services;

namespace StockTrader.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly IOptionsSnapshot<StockSimulationConfig> _config;
        private readonly StockPriceService _stockPriceService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            IOptionsSnapshot<StockSimulationConfig> config,
            StockPriceService stockPriceService,
            ILogger<AdminController> logger)
        {
            _config = config;
            _stockPriceService = stockPriceService;
            _logger = logger;
        }

        [HttpGet("simulation-config")]
        public async Task<ActionResult<object>> GetSimulationConfig()
        {
            var isRunning = await _stockPriceService.IsRunning();
            return Ok(new
            {
                updateIntervalSeconds = _config.Value.UpdateIntervalSeconds,
                maxPriceChangePercent = _config.Value.MaxPriceChangePercent,
                minPriceChangePercent = _config.Value.MinPriceChangePercent,
                minPrice = _config.Value.MinPrice,
                isEnabled = isRunning // Utiliser l'état réel au lieu de la config
            });
        }

        [HttpPost("restart-simulation")]
        public async Task<ActionResult> RestartSimulation()
        {
            try
            {
                await _stockPriceService.StopSimulation();
                await _stockPriceService.StartSimulation();
                
                _logger.LogInformation("Simulation redémarrée via API Admin");
                return Ok(new { message = "Simulation redémarrée avec succès" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors du redémarrage de la simulation");
                return StatusCode(500, new { message = "Erreur lors du redémarrage" });
            }
        }

        [HttpPost("stop-simulation")]
        public async Task<ActionResult> StopSimulation()
        {
            try
            {
                await _stockPriceService.StopSimulation();
                _logger.LogInformation("Simulation arrêtée via API Admin");
                return Ok(new { message = "Simulation arrêtée" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors de l'arrêt de la simulation");
                return StatusCode(500, new { message = "Erreur lors de l'arrêt" });
            }
        }

        [HttpPost("start-simulation")]
        public async Task<ActionResult> StartSimulation()
        {
            try
            {
                await _stockPriceService.StartSimulation();
                _logger.LogInformation("Simulation démarrée via API Admin");
                return Ok(new { message = "Simulation démarrée" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors du démarrage de la simulation");
                return StatusCode(500, new { message = "Erreur lors du démarrage" });
            }
        }
    }
} 