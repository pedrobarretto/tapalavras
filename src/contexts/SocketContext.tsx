'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { Player, Room } from '@/types/game';

interface SocketContextType {
  socket: Socket | null;
  createRoom: (playerName: string) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  startGame: (roomId: string, theme: string) => void;
  selectLetter: (roomId: string, letter: string) => void;
  passTurn: (roomId: string) => void;
  room: Room | null;
  player: Player | null;
  error: string | null;
  isLoading: boolean;
  isConnected: boolean;
  debugMessage: string | null;
  clearDebugMessage: () => void;
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
  debugMessage: null,
  clearDebugMessage: () => {},
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);

  const clearDebugMessage = useCallback(() => {
    setDebugMessage(null);
  }, []);

  // Helper for debug messages
  const addDebugMessage = useCallback((message: string) => {
    console.log(message);
    setDebugMessage(message);
    // Auto-clear debug message after 5 seconds
    setTimeout(() => {
      setDebugMessage(null);
    }, 5000);
  }, []);

  useEffect(() => {
    // Create socket connection
    const socketInstance = io('http://localhost:3001');
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      addDebugMessage('Socket connected');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      addDebugMessage('Socket disconnected');
    });

    socketInstance.on('error', (data: { message: string }) => {
      setError(data.message);
      setIsLoading(false);
      addDebugMessage(`Error: ${data.message}`);
    });

    // Room events
    socketInstance.on(
      'room-created',
      (data: { roomId: string; player: Player; room: Room }) => {
        setRoom(data.room);
        setPlayer(data.player);
        setIsLoading(false);
        addDebugMessage(`Room created: ${data.roomId}`);
      }
    );

    socketInstance.on('room-joined', (data: { player: Player; room: Room }) => {
      setRoom(data.room);
      setPlayer(data.player);
      setIsLoading(false);
      addDebugMessage(`Joined room: ${data.room.id}`);
    });

    socketInstance.on(
      'player-joined',
      (data: { player: Player; players: Player[] }) => {
        setRoom((prev) => {
          if (!prev) return null;
          addDebugMessage(`Player joined: ${data.player.name}`);
          return { ...prev, players: data.players };
        });
      }
    );

    socketInstance.on(
      'player-left',
      (data: { playerId: string; players: Player[]; newHostId?: string }) => {
        addDebugMessage(`Player left: ${data.playerId}`);
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
        addDebugMessage(`Game started, theme: ${data.theme}`);
        setRoom((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            currentTheme: data.theme,
            activePlayerId: data.activePlayerId,
            letters: data.letters,
            usedLetters: [],
            currentTurnStartTime: Date.now(),
            gameOver: false,
            loser: undefined,
            selectedLetter: null,
          };
        });
      }
    );

    socketInstance.on(
      'letter-selected',
      (data: { playerId: string; letter: string }) => {
        addDebugMessage(
          `Letter selected: ${data.letter} by player ${data.playerId}`
        );
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
        addDebugMessage(
          `Turn changed from ${data.previousPlayerId} to ${data.activePlayerId}, used letter: ${data.usedLetter}`
        );
        setRoom((prev) => {
          if (!prev) return null;
          const newUsedLetters = [...prev.usedLetters];
          // Only add the used letter if it's not empty (happens when player disconnects)
          if (data.usedLetter) {
            newUsedLetters.push(data.usedLetter);
          }
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
      addDebugMessage(`Player lost: ${data.playerId} (timed out)`);
      setRoom((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          gameOver: true,
          loser: data.playerId,
        };
      });
    });

    socketInstance.on('game-complete', (data: { allLettersUsed: boolean }) => {
      addDebugMessage(
        `Game complete, all letters used: ${data.allLettersUsed}`
      );
      setRoom((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          gameOver: true,
          // No loser if all letters were used successfully
          loser: data.allLettersUsed ? undefined : prev.loser,
        };
      });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [addDebugMessage]);

  const createRoom = useCallback(
    (playerName: string) => {
      if (!socket) return;
      setIsLoading(true);
      setError(null);
      addDebugMessage(`Creating room for player: ${playerName}`);
      socket.emit('create-room', { playerName });
    },
    [socket, addDebugMessage]
  );

  const joinRoom = useCallback(
    (roomId: string, playerName: string) => {
      if (!socket) return;
      setIsLoading(true);
      setError(null);
      addDebugMessage(`Joining room ${roomId} as ${playerName}`);
      socket.emit('join-room', { roomId, playerName });
    },
    [socket, addDebugMessage]
  );

  const startGame = useCallback(
    (roomId: string, theme: string) => {
      if (!socket) return;
      if (!theme.trim()) {
        setError('Um tema é necessário para iniciar o jogo');
        return;
      }
      addDebugMessage(`Starting game in room: ${roomId} with theme: ${theme}`);
      socket.emit('start-game', { roomId, theme });
    },
    [socket, addDebugMessage, setError]
  );

  const selectLetter = useCallback(
    (roomId: string, letter: string) => {
      if (!socket) return;
      addDebugMessage(`Selecting letter: ${letter}`);
      socket.emit('select-letter', { roomId, letter });
    },
    [socket, addDebugMessage]
  );

  const passTurn = useCallback(
    (roomId: string) => {
      if (!socket) return;
      addDebugMessage(`Passing turn in room: ${roomId}`);
      socket.emit('pass-turn', { roomId });
    },
    [socket, addDebugMessage]
  );

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
        debugMessage,
        clearDebugMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
