using Microsoft.EntityFrameworkCore;
using StockTrader.API.Models;

namespace StockTrader.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Stock> Stocks { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Portfolio> Portfolios { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configuration des relations
            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.User)
                .WithMany(u => u.Transactions)
                .HasForeignKey(t => t.UserId);

            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Stock)
                .WithMany(s => s.Transactions)
                .HasForeignKey(t => t.StockId);

            modelBuilder.Entity<Portfolio>()
                .HasOne(p => p.User)
                .WithMany(u => u.Portfolios)
                .HasForeignKey(p => p.UserId);

            modelBuilder.Entity<Portfolio>()
                .HasOne(p => p.Stock)
                .WithMany(s => s.Portfolios)
                .HasForeignKey(p => p.StockId);

            // Index unique pour éviter les doublons
            modelBuilder.Entity<Portfolio>()
                .HasIndex(p => new { p.UserId, p.StockId })
                .IsUnique();

            // Données de test avec des valeurs statiques
            modelBuilder.Entity<Stock>().HasData(
                new Stock
                {
                    Id = 1,
                    Symbol = "AAPL",
                    Name = "Apple Inc.",
                    CurrentPrice = 150.00m,
                    PreviousPrice = 148.00m,
                    LastUpdated = new DateTime(2024, 1, 1, 12, 0, 0, DateTimeKind.Utc)
                },
                new Stock
                {
                    Id = 2,
                    Symbol = "TSLA",
                    Name = "Tesla Inc.",
                    CurrentPrice = 800.00m,
                    PreviousPrice = 790.00m,
                    LastUpdated = new DateTime(2024, 1, 1, 12, 0, 0, DateTimeKind.Utc)
                },
                new Stock
                {
                    Id = 3,
                    Symbol = "GOOGL",
                    Name = "Alphabet Inc.",
                    CurrentPrice = 2500.00m,
                    PreviousPrice = 2480.00m,
                    LastUpdated = new DateTime(2024, 1, 1, 12, 0, 0, DateTimeKind.Utc)
                },
                new Stock
                {
                    Id = 4,
                    Symbol = "MSFT",
                    Name = "Microsoft Corporation",
                    CurrentPrice = 300.00m,
                    PreviousPrice = 295.00m,
                    LastUpdated = new DateTime(2024, 1, 1, 12, 0, 0, DateTimeKind.Utc)
                }
            );
        }
    }
}