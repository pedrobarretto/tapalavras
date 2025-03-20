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
  usedLetters: string[];
  selectedLetter?: string;
  activePlayerId?: string;
  currentTurnStartTime?: number;
  timeLimit: number;
}

// Game state
const rooms = new Map<string, Room>();

// Generate letters for the game board based on the physical game
function generateRandomLetters(): string[] {
  // Letters from the physical game in clockwise order based on the latest image
  const gameLetters = [
    'S',
    'B',
    'C',
    'O',
    '*',
    'T',
    'M',
    'K',
    'D',
    'N',
    'F',
    'I',
    'E',
    'H',
    'A',
    'G',
    'P',
    'R',
    'L',
    'J',
  ];

  // Shuffle the array to randomize letter positions
  return gameLetters.sort(() => Math.random() - 0.5);
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
      usedLetters: [],
      timeLimit: 10000, // 10 seconds in milliseconds
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
    room.usedLetters = []; // Reset used letters
    room.selectedLetter = undefined;

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

  // Player selects a letter
  socket.on('select-letter', ({ roomId, letter }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Check if it's this player's turn
    if (room.activePlayerId !== socket.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    // Check if letter is available
    if (room.usedLetters.includes(letter)) {
      socket.emit('error', { message: 'Letter already used' });
      return;
    }

    // Set the selected letter
    room.selectedLetter = letter;

    // Notify all players about the letter selection
    io.to(roomId).emit('letter-selected', {
      playerId: socket.id,
      letter,
    });
  });

  // Player passes turn after saying a word
  socket.on('pass-turn', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Check if it's this player's turn
    if (room.activePlayerId !== socket.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    // Check if a letter was selected
    if (!room.selectedLetter) {
      socket.emit('error', { message: 'You must select a letter first' });
      return;
    }

    // Add letter to used letters
    room.usedLetters.push(room.selectedLetter);
    const usedLetter = room.selectedLetter;
    room.selectedLetter = undefined;

    // Check if all letters have been used
    if (room.usedLetters.length >= room.letters.length) {
      // Current player loses if no more letters
      io.to(roomId).emit('player-lost', { playerId: socket.id });

      // Reset for next round
      room.currentTheme = themes[Math.floor(Math.random() * themes.length)];
      room.letters = generateRandomLetters();
      room.usedLetters = [];

      io.to(roomId).emit('new-round', {
        theme: room.currentTheme,
        letters: room.letters,
      });
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
      usedLetter,
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
    room.usedLetters = []; // Reset used letters
    room.selectedLetter = undefined;

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
