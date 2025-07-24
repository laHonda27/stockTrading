using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StockTrader.API.Data;
using StockTrader.API.Hubs;
using StockTrader.API.Models;
using StockTrader.API.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };

        // Pour SignalR
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// Configuration
builder.Services.Configure<StockSimulationConfig>(
    builder.Configuration.GetSection(StockSimulationConfig.SectionName));

// Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddSingleton<StockPriceService>();

// SignalR
builder.Services.AddSignalR();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.WithOrigins("http://localhost:3000", "http://frontend:3000")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Attendre que SQL Server soit prêt
        var retryCount = 0;
        var maxRetries = 30;

        while (retryCount < maxRetries)
        {
            try
            {
                await context.Database.CanConnectAsync();
                break;
            }
            catch
            {
                retryCount++;
                Console.WriteLine($"Tentative de connexion à la base de données ({retryCount}/{maxRetries})...");
                await Task.Delay(2000);
            }
        }

        if (retryCount >= maxRetries)
        {
            throw new Exception("Impossible de se connecter à la base de données après plusieurs tentatives");
        }

        Console.WriteLine(" Connexion à la base de données réussie");

        // Vérifier si la base existe déjà
        var databaseExists = await context.Database.CanConnectAsync();

        if (databaseExists)
        {
            // Vérifier si des migrations sont en attente
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync();

            if (pendingMigrations.Any())
            {
                Console.WriteLine("Application des migrations en attente...");
                await context.Database.MigrateAsync();
                Console.WriteLine("Migrations appliquées");
            }
            else
            {
                Console.WriteLine("Base de données déjà à jour");
            }
        }
        else
        {
            // Créer la base de données pour la première fois
            Console.WriteLine("Création de la base de données...");
            await context.Database.EnsureCreatedAsync();
            Console.WriteLine("Base de données créée");
        }

        // Ajouter des données de test si la base est vide
        if (!await context.Stocks.AnyAsync())
        {
            Console.WriteLine("Ajout des données de test...");

            var stocks = new[]
            {
                new Stock { Symbol = "AAPL", Name = "Apple Inc.", CurrentPrice = 150.00m },
                new Stock { Symbol = "GOOGL", Name = "Alphabet Inc.", CurrentPrice = 2500.00m },
                new Stock { Symbol = "MSFT", Name = "Microsoft Corporation", CurrentPrice = 300.00m },
                new Stock { Symbol = "AMZN", Name = "Amazon.com Inc.", CurrentPrice = 3200.00m },
                new Stock { Symbol = "TSLA", Name = "Tesla Inc.", CurrentPrice = 800.00m }
            };

            await context.Stocks.AddRangeAsync(stocks);
            await context.SaveChangesAsync();
            Console.WriteLine("Données de test ajoutées");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Erreur lors de l'initialisation de la base de données : {ex.Message}");
        Console.WriteLine("L'application va continuer sans initialiser la base...");
        
        // Ne pas recréer la base automatiquement pour éviter la perte de données
        // Si vous voulez forcer la recréation, faites-le manuellement
    }
}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<StockPriceHub>("/hubs/stockprice");

// Démarrer le service de simulation des prix
var stockPriceService = app.Services.GetRequiredService<StockPriceService>();
_ = Task.Run(() => stockPriceService.StartSimulation());

app.Run();