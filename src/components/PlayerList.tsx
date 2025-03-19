import React from 'react';
import { Player } from '@/types/game';

interface PlayerListProps {
  players: Player[];
  activePlayerId?: string;
  currentPlayerId?: string;
}

export function PlayerList({
  players,
  activePlayerId,
  currentPlayerId,
}: PlayerListProps) {
  return (
    <div className="w-full max-w-sm mx-auto bg-white shadow-md rounded-lg overflow-hidden mb-4">
      <div className="px-4 py-2 bg-gray-800 text-white">
        <h3 className="text-lg font-semibold">Players</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {players.map((player) => {
          const isActive = player.id === activePlayerId;
          const isCurrentPlayer = player.id === currentPlayerId;

          return (
            <li
              key={player.id}
              className={`px-4 py-3 flex items-center ${
                isActive ? 'bg-indigo-50' : ''
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full mr-3 ${
                  isActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span className="flex-1">
                {player.name}
                {player.isHost && (
                  <span className="ml-2 text-xs text-gray-500">(Host)</span>
                )}
                {isCurrentPlayer && (
                  <span className="ml-2 text-xs text-blue-500">(You)</span>
                )}
              </span>
              {isActive && (
                <span className="text-xs font-medium text-green-600">
                  Current Turn
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
