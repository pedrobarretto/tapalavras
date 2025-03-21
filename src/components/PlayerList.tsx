import React from 'react';
import { Player } from '@/types/game';

interface PlayerListProps {
  players: Player[];
  activePlayerId?: string;
  currentPlayerId?: string;
  loserId?: string;
}

export function PlayerList({
  players,
  activePlayerId,
  currentPlayerId,
  loserId,
}: PlayerListProps) {
  return (
    <div className="w-full max-w-sm mx-auto md:max-w-none bg-[#fffffd] shadow-md rounded-lg overflow-hidden mb-4">
      <div className="px-4 py-2 bg-[#2c5ba7] text-[#fffffd]">
        <h3 className="text-md sm:text-lg font-semibold">Jogadores</h3>
      </div>
      <ul className="divide-y divide-[#fdc11d]/30 text-sm sm:text-base">
        {players.map((player) => {
          const isActive = player.id === activePlayerId;
          const isCurrentPlayer = player.id === currentPlayerId;
          const isLoser = player.id === loserId;

          return (
            <li
              key={player.id}
              className={`px-3 sm:px-4 py-2 sm:py-3 md:py-4 flex items-center ${
                isActive ? 'bg-[#fdc11d]/20' : ''
              } ${isLoser ? 'bg-[#1f2a28]/20' : ''}`}
            >
              <div
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 sm:mr-3 ${
                  isActive
                    ? 'bg-[#fdc11d]'
                    : isLoser
                    ? 'bg-[#1f2a28]'
                    : 'bg-[#1f2a28]/30'
                }`}
              />
              <span className="flex-1 text-[#1f2a28]">
                {player.name}
                {player.isHost && (
                  <span className="ml-1 sm:ml-2 text-xs text-[#2c5ba7]">
                    (Anfitrião)
                  </span>
                )}
                {isCurrentPlayer && (
                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-[#2c5ba7] font-bold">
                    (Você)
                  </span>
                )}
              </span>
              {isActive && !isLoser && (
                <span className="text-xs sm:text-sm font-medium text-[#fdc11d] bg-[#1f2a28] px-2 py-1 rounded-full">
                  Sua Vez
                </span>
              )}
              {isLoser && (
                <span className="text-xs sm:text-sm font-medium text-[#fdc11d] bg-[#1f2a28] px-2 py-1 rounded-full">
                  Perdeu
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
