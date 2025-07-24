import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

class SignalRService {
  private connection: HubConnection | null = null;
  private listeners: Map<string, Function[]> = new Map();

  async connect(token: string): Promise<void> {
    if (this.connection?.state === 'Connected') {
      return;
    }

    this.connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5172/hubs/stockprice', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    // Gestion des événements
    this.connection.on('PriceUpdate', (stocks) => {
      this.emit('PriceUpdate', stocks);
    });

    this.connection.onreconnecting(() => {
      console.log('SignalR - Reconnexion en cours...');
    });

    this.connection.onreconnected(() => {
      console.log('SignalR - Reconnecté !');
    });

    this.connection.onclose(() => {
      console.log('SignalR - Connexion fermée');
    });

    try {
      await this.connection.start();
      console.log('SignalR - Connecté !');
    } catch (err) {
      console.error('SignalR - Erreur de connexion:', err);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.listeners.clear();
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }


}

export const signalRService = new SignalRService();