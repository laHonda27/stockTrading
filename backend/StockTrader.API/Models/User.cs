using System.ComponentModel.DataAnnotations;

namespace StockTrader.API.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public decimal Balance { get; set; } = 10000m; // Solde initial fictif

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relations
        public List<Transaction> Transactions { get; set; } = new();
        public List<Portfolio> Portfolios { get; set; } = new();
    }
}