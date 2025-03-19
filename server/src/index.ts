import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { nanoid } from 'nanoid';

// Types
interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

interface Room {
  id: string;
  players: Player[];
  currentTheme?: string;
  letters: string[];
  activePlayerId?: string;
  currentTurnStartTime?: number;
  timeLimit: number;
}

// Game state
const rooms = new Map<string, Room>();

// Generate random letters for the game board
function generateRandomLetters(count = 12): string[] {
  const vowels = 'AEIOU';
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
  const letters = [];

  // Ensure at least 1/3 vowels
  const vowelCount = Math.ceil(count / 3);
  for (let i = 0; i < vowelCount; i++) {
    letters.push(vowels.charAt(Math.floor(Math.random() * vowels.length)));
  }

  // Fill the rest with consonants
  for (let i = vowelCount; i < count; i++) {
    letters.push(
      consonants.charAt(Math.floor(Math.random() * consonants.length))
    );
  }

  // Shuffle the array
  return letters.sort(() => Math.random() - 0.5);
}

// Sample themes
const themes = [
  'Animals',
  'Countries',
  'Food',
  'Sports',
  'Movies',
  'Professions',
  'Body Parts',
  'Clothing',
  'Transportation',
  'Music',
  'Colors',
  'School Subjects',
  'Plants',
  'Technology',
];

// Initialize Express app and Socket.IO
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create a new room
  socket.on('create-room', ({ playerName }) => {
    const roomId = nanoid(6).toUpperCase();
    const player: Player = {
      id: socket.id,
      name: playerName,
      isHost: true,
    };

    const room: Room = {
      id: roomId,
      players: [player],
      letters: generateRandomLetters(),
      timeLimit: 15000, // 15 seconds in milliseconds
    };

    rooms.set(roomId, room);

    socket.join(roomId);
    socket.emit('room-created', { roomId, player, room });
    console.log(`Room created: ${roomId} by ${playerName}`);
  });

  // Join an existing room
  socket.on('join-room', ({ roomId, playerName }) => {
    roomId = roomId.toUpperCase();
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const player: Player = {
      id: socket.id,
      name: playerName,
      isHost: false,
    };

    room.players.push(player);
    socket.join(roomId);
    socket.emit('room-joined', { player, room });
    io.to(roomId).emit('player-joined', { player, players: room.players });
    console.log(`Player ${playerName} joined room ${roomId}`);
  });

  // Start the game
  socket.on('start-game', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Check if player is host
    const player = room.players.find((p) => p.id === socket.id);
    if (!player?.isHost) return;

    // Pick random theme
    const theme = themes[Math.floor(Math.random() * themes.length)];
    room.currentTheme = theme;

    // Set first player randomly
    const firstPlayerId =
      room.players[Math.floor(Math.random() * room.players.length)].id;
    room.activePlayerId = firstPlayerId;
    room.currentTurnStartTime = Date.now();

    io.to(roomId).emit('game-started', {
      theme,
      activePlayerId: firstPlayerId,
      letters: room.letters,
    });

    // Set timeout for turn
    setTimeout(() => {
      if (
        rooms.has(roomId) &&
        rooms.get(roomId)?.activePlayerId === firstPlayerId
      ) {
        endTurn(roomId, firstPlayerId);
      }
    }, room.timeLimit);
  });

  // Player submitted a word
  socket.on('submit-word', ({ roomId, word }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Check if it's this player's turn
    if (room.activePlayerId !== socket.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    // Move to next player
    const currentPlayerIndex = room.players.findIndex(
      (p) => p.id === socket.id
    );
    const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
    const nextPlayerId = room.players[nextPlayerIndex].id;

    room.activePlayerId = nextPlayerId;
    room.currentTurnStartTime = Date.now();

    io.to(roomId).emit('turn-changed', {
      previousPlayerId: socket.id,
      activePlayerId: nextPlayerId,
      submittedWord: word,
    });

    // Set timeout for next turn
    setTimeout(() => {
      if (
        rooms.has(roomId) &&
        rooms.get(roomId)?.activePlayerId === nextPlayerId
      ) {
        endTurn(roomId, nextPlayerId);
      }
    }, room.timeLimit);
  });

  // Time's up for a player
  function endTurn(roomId: string, playerId: string) {
    const room = rooms.get(roomId);
    if (!room || room.activePlayerId !== playerId) return;

    io.to(roomId).emit('player-lost', { playerId });

    // Get new theme and letters for the next round
    room.currentTheme = themes[Math.floor(Math.random() * themes.length)];
    room.letters = generateRandomLetters();

    io.to(roomId).emit('new-round', {
      theme: room.currentTheme,
      letters: room.letters,
    });
  }

  // Player disconnects
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    // Find and remove player from any room they were in
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);

      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);

        // If room is empty, remove it
        if (room.players.length === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} removed (empty)`);
          return;
        }

        // If host left, assign new host
        if (player.isHost && room.players.length > 0) {
          room.players[0].isHost = true;
        }

        // Notify remaining players
        io.to(roomId).emit('player-left', {
          playerId: socket.id,
          players: room.players,
          newHostId: player.isHost ? room.players[0].id : undefined,
        });

        console.log(`Player ${player.name} left room ${roomId}`);
      }
    });
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
