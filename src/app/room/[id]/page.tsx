'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LetterCircle } from '@/components/LetterCircle';
import { ThemeCard } from '@/components/ThemeCard';
import { PlayerList } from '@/components/PlayerList';
import { TurnTimer } from '@/components/TurnTimer';
import { WordInput } from '@/components/WordInput';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/contexts/SocketContext';

export default function GameRoom() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
  const playerName = searchParams.get('name') || '';
  const isHost = searchParams.get('host') === 'true';

  const {
    socket,
    createRoom,
    joinRoom,
    startGame,
    submitWord,
    room,
    player,
    error,
    isLoading,
  } = useSocket();

  const [isReady, setIsReady] = useState(false);
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (!roomId || !playerName || !socket || hasJoinedRef.current) return;

    // Join the room - only once
    hasJoinedRef.current = true;

    if (isHost) {
      createRoom(playerName);
    } else {
      joinRoom(roomId, playerName);
    }

    setIsReady(true);
  }, [roomId, playerName, socket, isHost]); // Removed createRoom and joinRoom from dependencies

  const handleStartGame = () => {
    if (!room?.id) return;
    startGame(room.id);
  };

  const handleSubmitWord = (word: string) => {
    if (!room?.id) return;
    submitWord(room.id, word);
  };

  const isPlayersTurn = player?.id === room?.activePlayerId;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md w-full">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <Button className="mt-4" asChild>
          <Link href="/">Go Back Home</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!room || !player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-xl text-gray-600">
          Room not found or connection error.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/">Go Back Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">TapaPalavras</h1>
            <div className="bg-white px-3 py-1 rounded-md shadow-sm mt-2 inline-block">
              <span className="text-gray-600 mr-2">Room Code:</span>
              <span className="font-bold text-indigo-600">{room.id}</span>
            </div>
          </div>

          {player.isHost && !room.currentTheme && (
            <Button
              onClick={handleStartGame}
              className="mt-4 md:mt-0"
              disabled={room.players.length < 2}
            >
              {room.players.length < 2
                ? 'Waiting for players...'
                : 'Start Game'}
            </Button>
          )}
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <PlayerList
              players={room.players}
              activePlayerId={room.activePlayerId}
              currentPlayerId={player.id}
            />

            {room.currentTheme && (
              <>
                <ThemeCard theme={room.currentTheme} />

                {room.activePlayerId && room.currentTurnStartTime && (
                  <TurnTimer
                    startTime={room.currentTurnStartTime}
                    timeLimit={room.timeLimit}
                    isActive={isPlayersTurn}
                  />
                )}

                <WordInput
                  onSubmit={handleSubmitWord}
                  isActive={isPlayersTurn}
                />
              </>
            )}
          </div>

          <div className="flex items-center justify-center">
            {room.letters && room.letters.length > 0 ? (
              <LetterCircle letters={room.letters} />
            ) : (
              <div className="bg-gray-100 rounded-full w-[300px] h-[300px] flex items-center justify-center text-gray-400">
                Waiting for game to start...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
