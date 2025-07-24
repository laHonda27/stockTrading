using StockTrader.API.Models;

namespace StockTrader.API.Services
{
    public interface ITokenService
    {
        string GenerateToken(User user);
    }
}