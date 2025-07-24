using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockTrader.API.Data;

namespace StockTrader.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class HealthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HealthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                // Test de connexion à la base de données
                await _context.Database.CanConnectAsync();

                return Ok(new
                {
                    status = "healthy",
                    timestamp = DateTime.UtcNow,
                    database = "connected"
                });
            }
            catch
            {
                return StatusCode(503, new
                {
                    status = "unhealthy",
                    timestamp = DateTime.UtcNow,
                    database = "disconnected"
                });
            }
        }
    }
}