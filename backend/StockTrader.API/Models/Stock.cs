using System.ComponentModel.DataAnnotations;
using StockTrader.API.Models;

namespace StockTrader.API.Models
{
    public class Stock
    {
        public int Id { get; set; }

        [Required]
        [StringLength(10)]
        public string Symbol { get; set; } = string.Empty; // Ex: AAPL, TSLA

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty; // Ex: Apple Inc.

        [Required]
        public decimal CurrentPrice { get; set; }

        public decimal PreviousPrice { get; set; }

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        // Relations
        public List<Transaction> Transactions { get; set; } = new();
        public List<Portfolio> Portfolios { get; set; } = new();
    }
}