export interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export interface Room {
  id: string;
  players: Player[];
  currentTheme?: string;
  letters: string[];
  usedLetters: string[];
  selectedLetter?: string | null;
  activePlayerId?: string;
  currentTurnStartTime?: number;
  timeLimit: number;
  gameOver?: boolean;
  loser?: string;
}

export interface GameState {
  room?: Room;
  player?: Player;
  isLoading: boolean;
  error?: string;
}
