using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockTrader.API.Data;
using StockTrader.API.Models;

namespace StockTrader.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class StocksController : ControllerBase
	{
		private readonly AppDbContext _context;

		public StocksController(AppDbContext context)
		{
			_context = context;
		}

		[HttpGet]
		public async Task<ActionResult<IEnumerable<Stock>>> GetStocks()
		{
			return await _context.Stocks.ToListAsync();
		}

		[HttpGet("{id}")]
		public async Task<ActionResult<Stock>> GetStock(int id)
		{
			var stock = await _context.Stocks.FindAsync(id);

			if (stock == null)
			{
				return NotFound();
			}

			return stock;
		}
	}
}