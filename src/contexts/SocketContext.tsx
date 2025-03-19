'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { Player, Room } from '@/types/game';

interface SocketContextType {
  socket: Socket | null;
  createRoom: (playerName: string) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  startGame: (roomId: string) => void;
  submitWord: (roomId: string, word: string) => void;
  room: Room | null;
  player: Player | null;
  error: string | null;
  isLoading: boolean;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  createRoom: () => {},
  joinRoom: () => {},
  startGame: () => {},
  submitWord: () => {},
  room: null,
  player: null,
  error: null,
  isLoading: false,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection
    const socketInstance = io('http://localhost:3001');
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('error', (data: { message: string }) => {
      setError(data.message);
      setIsLoading(false);
    });

    // Room events
    socketInstance.on(
      'room-created',
      (data: { roomId: string; player: Player; room: Room }) => {
        setRoom(data.room);
        setPlayer(data.player);
        setIsLoading(false);
      }
    );

    socketInstance.on('room-joined', (data: { player: Player; room: Room }) => {
      setRoom(data.room);
      setPlayer(data.player);
      setIsLoading(false);
    });

    socketInstance.on(
      'player-joined',
      (data: { player: Player; players: Player[] }) => {
        setRoom((prev) => (prev ? { ...prev, players: data.players } : null));
      }
    );

    socketInstance.on(
      'player-left',
      (data: { playerId: string; players: Player[]; newHostId?: string }) => {
        setRoom((prev) => {
          if (!prev) return null;
          return { ...prev, players: data.players };
        });

        // If current player became host
        if (data.newHostId && player && player.id === data.newHostId) {
          setPlayer({ ...player, isHost: true });
        }
      }
    );

    // Game events
    socketInstance.on(
      'game-started',
      (data: { theme: string; activePlayerId: string; letters: string[] }) => {
        setRoom((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            currentTheme: data.theme,
            activePlayerId: data.activePlayerId,
            letters: data.letters,
            currentTurnStartTime: Date.now(),
          };
        });
      }
    );

    socketInstance.on(
      'turn-changed',
      (data: {
        previousPlayerId: string;
        activePlayerId: string;
        submittedWord: string;
      }) => {
        setRoom((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            activePlayerId: data.activePlayerId,
            currentTurnStartTime: Date.now(),
          };
        });
      }
    );

    socketInstance.on('player-lost', () => {
      // Just show this as a notification - we'll implement this in the UI components
    });

    socketInstance.on(
      'new-round',
      (data: { theme: string; letters: string[] }) => {
        setRoom((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            currentTheme: data.theme,
            letters: data.letters,
          };
        });
      }
    );

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const createRoom = (playerName: string) => {
    if (!socket) return;
    setIsLoading(true);
    setError(null);
    socket.emit('create-room', { playerName });
  };

  const joinRoom = (roomId: string, playerName: string) => {
    if (!socket) return;
    setIsLoading(true);
    setError(null);
    socket.emit('join-room', { roomId, playerName });
  };

  const startGame = (roomId: string) => {
    if (!socket) return;
    socket.emit('start-game', { roomId });
  };

  const submitWord = (roomId: string, word: string) => {
    if (!socket) return;
    socket.emit('submit-word', { roomId, word });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        createRoom,
        joinRoom,
        startGame,
        submitWord,
        room,
        player,
        error,
        isLoading,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
