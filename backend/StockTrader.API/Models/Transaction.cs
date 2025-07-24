using System.ComponentModel.DataAnnotations;

namespace StockTrader.API.Models
{
    public enum TransactionType
    {
        Buy,
        Sell
    }

    public class Transaction
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int StockId { get; set; }
        public TransactionType Type { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public User User { get; set; } = null!;
        public Stock Stock { get; set; } = null!;  
    }
}