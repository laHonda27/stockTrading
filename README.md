# StockTrader

Plateforme de simulation de trading d’actions, développée en .NET 9 (backend) et React + TypeScript (frontend).

---

## Sommaire
- [Présentation](#présentation)
- [Architecture](#architecture)
- [Structure du projet](#structure-du-projet)
- [Choix techniques](#choix-techniques)
- [Installation & Lancement](#installation--lancement)
- [Authentification & Sécurité](#authentification--sécurité)
- [Fonctionnalités principales](#fonctionnalités-principales)
- [Démo rapide](#démo-rapide)

---

## Présentation
StockTrader est une application web permettant de simuler l’achat, la vente et le suivi d’actions en temps réel. Elle met en avant les bonnes pratiques modernes côté API et frontend, tout en restant simple et pédagogique.

---

## Architecture

- **Backend** : .NET 9, API RESTful, SignalR pour le temps réel, authentification JWT, Entity Framework Core (SQL Server)
- **Frontend** : React, TypeScript, Axios, gestion d’état via Context, TailwindCSS
- **Conteneurisation** : Docker pour le backend et le frontend, orchestration possible via docker-compose

### Schéma général

```
[ React (Frontend) ] <----> [ .NET API (Backend) ] <----> [ SQL Server ]
         |                        |
         |---- SignalR (WebSocket) |
```

---

## Structure du projet

```
StockTrader/
├── backend/
│   └── StockTrader.API/
│       ├── Controllers/      # Contrôleurs API (Auth, Portfolio, Stocks, Health)
│       ├── Data/             # DbContext EF Core
│       ├── Dtos/             # Objets de transfert (DTO)
│       ├── Hubs/             # SignalR (temps réel)
│       ├── Migrations/       # Migrations EF Core
│       ├── Models/           # Entités de base de données
│       ├── Services/         # Services métiers (Token, StockPrice)
│       ├── appsettings*.json # Configurations (connexion, JWT, etc.)
│       └── Program.cs        # Point d’entrée, configuration DI, middlewares
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Composants UI réutilisables
│   │   ├── context/          # AuthContext (gestion auth globale)
│   │   ├── hooks/            # Hooks personnalisés (SignalR, stocks…)
│   │   ├── pages/            # Pages principales (Dashboard, Login, etc.)
│   │   ├── services/         # Appels API, SignalR
│   │   └── types/            # Types TypeScript
│   ├── public/               # Fichiers statiques
│   └── package.json          # Dépendances et scripts
│
├── docker-compose*.yml       # Orchestration multi-conteneurs
└── README.md                 # Documentation
```

---

## Choix techniques

- **.NET 9** : API moderne, performances, sécurité, support SignalR natif
- **Entity Framework Core** : ORM pour la gestion des entités et des migrations
- **JWT** : Authentification stateless, sécurisée et adaptée au SPA
- **SignalR** : Websockets pour la diffusion temps réel des prix
- **React + TypeScript** : Rapidité de développement, typage, écosystème riche
- **Docker** : Déploiement et portabilité facilités
- **Séparation claire** : DTOs, services, modèles, contrôleurs pour la maintenabilité

---

## Installation & Lancement

### Prérequis
- Docker (recommandé) ou .NET 9 SDK + Node.js 18

### Lancement rapide (via Docker)
```bash
# Récupérer le fichier de composition
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/lahonda27/stocktrading/main/docker-compose.production.yml" -OutFile "docker-compose.yml"
# Démarrer les services
docker-compose up -d
```
- Frontend : http://localhost:3000
- API Swagger : http://localhost:5172/swagger

### Lancement manuel (dev)
- Backend :
  - `cd backend/StockTrader.API`
  - `dotnet restore && dotnet run`
- Frontend :
  - `cd frontend`
  - `npm install && npm start`

---

## Authentification & Sécurité
- **Inscription/Connexion** : Génération d’un JWT signé côté backend, renvoyé au frontend
- **Stockage** : Le token est stocké côté client (localStorage)
- **Utilisation** : Le token est envoyé dans l’en-tête Authorization pour chaque requête API et lors de la connexion SignalR
- **Routes protégées** : Attribut `[Authorize]` côté backend, ProtectedRoute côté frontend
- **Hashage des mots de passe** : SHA256 (pour la démo, à améliorer en prod)

---

## Fonctionnalités principales
- Authentification JWT (inscription, connexion, déconnexion)
- Gestion de portefeuille (achat, vente, historique)
- Consultation des actions et de leur évolution en temps réel
- Dashboard avec statistiques
- API RESTful documentée (Swagger)
- Websockets pour la diffusion des prix (SignalR)

---

---

**Projet réalisé dans un but pédagogique et démonstratif.** 