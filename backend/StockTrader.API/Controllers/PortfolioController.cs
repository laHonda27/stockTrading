using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockTrader.API.Data;
using StockTrader.API.DTOs;
using StockTrader.API.Models;
using System.Security.Claims;

namespace StockTrader.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PortfolioController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PortfolioController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PortfolioDto>>> GetPortfolio()
        {
            var userId = GetUserId();

            var portfolios = await _context.Portfolios
                .Include(p => p.Stock)
                .Where(p => p.UserId == userId)
                .Select(p => new PortfolioDto
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    StockId = p.StockId,
                    Quantity = p.Quantity,
                    AveragePrice = p.AveragePrice,
                    LastUpdated = p.LastUpdated,
                    Stock = new StockDto
                    {
                        Id = p.Stock.Id,
                        Symbol = p.Stock.Symbol,
                        Name = p.Stock.Name,
                        CurrentPrice = p.Stock.CurrentPrice,
                        PreviousPrice = p.Stock.PreviousPrice,
                        LastUpdated = p.Stock.LastUpdated
                    }
                })
                .ToListAsync();

            return Ok(portfolios);
        }

        [HttpGet("transactions")]
        public async Task<ActionResult<IEnumerable<TransactionDto>>> GetTransactions()
        {
            var userId = GetUserId();

            var transactions = await _context.Transactions
                .Include(t => t.Stock)
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new TransactionDto
                {
                    Id = t.Id,
                    UserId = t.UserId,
                    StockId = t.StockId,
                    Type = t.Type.ToString(),
                    Quantity = t.Quantity,
                    Price = t.Price,
                    TotalAmount = t.TotalAmount,
                    CreatedAt = t.CreatedAt,
                    Stock = new StockDto
                    {
                        Id = t.Stock.Id,
                        Symbol = t.Stock.Symbol,
                        Name = t.Stock.Name,
                        CurrentPrice = t.Stock.CurrentPrice,
                        PreviousPrice = t.Stock.PreviousPrice,
                        LastUpdated = t.Stock.LastUpdated
                    }
                })
                .ToListAsync();

            return Ok(transactions);
        }

        [HttpPost("buy")]
        public async Task<ActionResult<TransactionDto>> BuyStock(BuyStockDto buyDto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);
            var stock = await _context.Stocks.FindAsync(buyDto.StockId);

            if (user == null || stock == null)
            {
                return NotFound();
            }

            var totalCost = stock.CurrentPrice * buyDto.Quantity;

            if (user.Balance < totalCost)
            {
                return BadRequest(new { message = "Solde insuffisant" });
            }

            // Créer la transaction
            var transaction = new Transaction
            {
                UserId = userId,
                StockId = buyDto.StockId,
                Type = TransactionType.Buy,
                Quantity = buyDto.Quantity,
                Price = stock.CurrentPrice,
                TotalAmount = totalCost
            };

            _context.Transactions.Add(transaction);

            // Mettre à jour le solde
            user.Balance -= totalCost;

            // Mettre à jour ou créer la position dans le portfolio
            var existingPosition = await _context.Portfolios
                .FirstOrDefaultAsync(p => p.UserId == userId && p.StockId == buyDto.StockId);

            if (existingPosition != null)
            {
                // Calculer le nouveau prix moyen
                var totalValue = (existingPosition.AveragePrice * existingPosition.Quantity) + totalCost;
                var totalQuantity = existingPosition.Quantity + buyDto.Quantity;

                existingPosition.AveragePrice = totalValue / totalQuantity;
                existingPosition.Quantity = totalQuantity;
                existingPosition.LastUpdated = DateTime.UtcNow;
            }
            else
            {
                var newPosition = new Portfolio
                {
                    UserId = userId,
                    StockId = buyDto.StockId,
                    Quantity = buyDto.Quantity,
                    AveragePrice = stock.CurrentPrice
                };
                _context.Portfolios.Add(newPosition);
            }

            await _context.SaveChangesAsync();

            // Retourner la transaction sous forme de DTO
            var transactionDto = new TransactionDto
            {
                Id = transaction.Id,
                UserId = transaction.UserId,
                StockId = transaction.StockId,
                Type = transaction.Type.ToString(),
                Quantity = transaction.Quantity,
                Price = transaction.Price,
                TotalAmount = transaction.TotalAmount,
                CreatedAt = transaction.CreatedAt,
                Stock = new StockDto
                {
                    Id = stock.Id,
                    Symbol = stock.Symbol,
                    Name = stock.Name,
                    CurrentPrice = stock.CurrentPrice,
                    PreviousPrice = stock.PreviousPrice,
                    LastUpdated = stock.LastUpdated
                }
            };

            return Ok(transactionDto);
        }

        [HttpPost("sell")]
        public async Task<ActionResult<TransactionDto>> SellStock(SellStockDto sellDto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);
            var stock = await _context.Stocks.FindAsync(sellDto.StockId);

            if (user == null)
            {
                return NotFound(new { message = "Utilisateur non trouvé" });
            }

            if (stock == null)
            {
                return NotFound(new { message = "Action non trouvée" });
            }

            var position = await _context.Portfolios
                .FirstOrDefaultAsync(p => p.UserId == userId && p.StockId == sellDto.StockId);

            if (position == null)
            {
                return BadRequest(new { message = "Vous ne possédez pas cette action" });
            }

            if (position.Quantity < sellDto.Quantity)
            {
                return BadRequest(new { message = "Quantité insuffisante" });
            }

            var totalValue = stock.CurrentPrice * sellDto.Quantity;

            // Créer la transaction
            var transaction = new Transaction
            {
                UserId = userId,
                StockId = sellDto.StockId,
                Type = TransactionType.Sell,
                Quantity = sellDto.Quantity,
                Price = stock.CurrentPrice,
                TotalAmount = totalValue
            };

            _context.Transactions.Add(transaction);

            // Mettre à jour le solde
            user.Balance += totalValue;

            // Mettre à jour la position
            position.Quantity -= sellDto.Quantity;
            position.LastUpdated = DateTime.UtcNow;

            // Supprimer la position si quantité = 0
            if (position.Quantity == 0)
            {
                _context.Portfolios.Remove(position);
            }

            await _context.SaveChangesAsync();

            // Retourner la transaction sous forme de DTO
            var transactionDto = new TransactionDto
            {
                Id = transaction.Id,
                UserId = transaction.UserId,
                StockId = transaction.StockId,
                Type = transaction.Type.ToString(),
                Quantity = transaction.Quantity,
                Price = transaction.Price,
                TotalAmount = transaction.TotalAmount,
                CreatedAt = transaction.CreatedAt,
                Stock = new StockDto
                {
                    Id = stock.Id,
                    Symbol = stock.Symbol,
                    Name = stock.Name,
                    CurrentPrice = stock.CurrentPrice,
                    PreviousPrice = stock.PreviousPrice,
                    LastUpdated = stock.LastUpdated
                }
            };

            return Ok(transactionDto);
        }
    }

    public class BuyStockDto
    {
        public int StockId { get; set; }
        public int Quantity { get; set; }
    }

    public class SellStockDto
    {
        public int StockId { get; set; }
        public int Quantity { get; set; }
    }
}