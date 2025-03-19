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
  activePlayerId?: string;
  currentTurnStartTime?: number;
  timeLimit: number;
}

export interface GameState {
  room?: Room;
  player?: Player;
  isLoading: boolean;
  error?: string;
}
