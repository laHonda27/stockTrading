import { useEffect, useRef } from 'react';
import { signalRService } from '../services/signalr';
import { useAuth } from '../context/AuthContext';

export const useSignalR = () => {
  const { user } = useAuth();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    const connectSignalR = async () => {
      if (user && !isConnectedRef.current) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await signalRService.connect(token);
            isConnectedRef.current = true;
          } catch (error) {
            console.error('Erreur connexion SignalR:', error);
          }
        }
      }
    };

    const disconnectSignalR = async () => {
      if (!user && isConnectedRef.current) {
        await signalRService.disconnect();
        isConnectedRef.current = false;
      }
    };

    if (user) {
      connectSignalR();
    } else {
      disconnectSignalR();
    }

    return () => {
      if (isConnectedRef.current) {
        signalRService.disconnect();
        isConnectedRef.current = false;
      }
    };
  }, [user]);

  return signalRService;
};