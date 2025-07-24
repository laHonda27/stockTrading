using System.ComponentModel.DataAnnotations;

namespace StockTrader.API.DTOs
{

	public class PortfolioDto
	{
		public int Id { get; set; }
		public int UserId { get; set; }
		public int StockId { get; set; }
		public int Quantity { get; set; }
		public decimal AveragePrice { get; set; }
		public DateTime LastUpdated { get; set; }
		public StockDto Stock { get; set; } = null!;
	}

	public class StockDto
	{
		public int Id { get; set; }
		public string Symbol { get; set; } = string.Empty;
		public string Name { get; set; } = string.Empty;
		public decimal CurrentPrice { get; set; }
		public decimal PreviousPrice { get; set; }
		public DateTime LastUpdated { get; set; }
	}

	public class TransactionDto
	{
		public int Id { get; set; }
		public int UserId { get; set; }
		public int StockId { get; set; }
		public string Type { get; set; } = string.Empty;
		public int Quantity { get; set; }
		public decimal Price { get; set; }
		public decimal TotalAmount { get; set; }
		public DateTime CreatedAt { get; set; }
		public StockDto Stock { get; set; } = null!;
	}
}