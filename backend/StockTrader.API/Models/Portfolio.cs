namespace StockTrader.API.Models
{

    public class Portfolio
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int StockId { get; set; }
        public int Quantity { get; set; }
        public decimal AveragePrice { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!; 
        public Stock Stock { get; set; } = null!; 
    }




}