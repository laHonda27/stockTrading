FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["StockTrader.API.csproj", "."]
RUN dotnet restore "StockTrader.API.csproj"
COPY . .
RUN dotnet build "StockTrader.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "StockTrader.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .


COPY appsettings.Docker.json ./appsettings.Production.json
ENTRYPOINT ["dotnet", "StockTrader.API.dll"]