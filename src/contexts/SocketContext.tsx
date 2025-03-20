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
  selectLetter: (roomId: string, letter: string) => void;
  passTurn: (roomId: string) => void;
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
  selectLetter: () => {},
  passTurn: () => {},
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
            usedLetters: [],
            currentTurnStartTime: Date.now(),
          };
        });
      }
    );

    socketInstance.on(
      'letter-selected',
      (data: { playerId: string; letter: string }) => {
        setRoom((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            selectedLetter: data.letter,
          };
        });
      }
    );

    socketInstance.on(
      'turn-changed',
      (data: {
        previousPlayerId: string;
        activePlayerId: string;
        usedLetter: string;
      }) => {
        setRoom((prev) => {
          if (!prev) return null;
          const newUsedLetters = [...prev.usedLetters, data.usedLetter];
          return {
            ...prev,
            activePlayerId: data.activePlayerId,
            currentTurnStartTime: Date.now(),
            usedLetters: newUsedLetters,
            selectedLetter: null,
          };
        });
      }
    );

    socketInstance.on('player-lost', (data: { playerId: string }) => {
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          gameOver: true,
          loser: data.playerId,
        };
      });
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
            usedLetters: [],
            gameOver: false,
            loser: undefined,
            selectedLetter: null,
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

  const selectLetter = (roomId: string, letter: string) => {
    if (!socket) return;
    socket.emit('select-letter', { roomId, letter });
  };

  const passTurn = (roomId: string) => {
    if (!socket) return;
    socket.emit('pass-turn', { roomId });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        createRoom,
        joinRoom,
        startGame,
        selectLetter,
        passTurn,
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
