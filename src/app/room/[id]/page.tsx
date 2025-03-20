'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LetterCircle } from '@/components/LetterCircle';
import { ThemeCard } from '@/components/ThemeCard';
import { PlayerList } from '@/components/PlayerList';
import { TurnTimer } from '@/components/TurnTimer';
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
    selectLetter,
    passTurn,
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
  }, [roomId, playerName, socket, isHost]);

  const handleStartGame = () => {
    if (!room?.id) return;
    startGame(room.id);
  };

  const handleLetterSelect = (letter: string) => {
    if (!room?.id || !isPlayersTurn) return;
    selectLetter(room.id, letter);
  };

  const handlePassTurn = () => {
    if (!room?.id || !isPlayersTurn || !room.selectedLetter) return;
    passTurn(room.id);
  };

  const isPlayersTurn = player?.id === room?.activePlayerId;
  const playerLost = room?.gameOver && room?.loser === player?.id;
  const isGameOver = room?.gameOver;
  const noMoreLetters = room?.letters?.length === room?.usedLetters?.length;

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
    <div className="min-h-screen bg-[#fffffd] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1f2a28]">
              TapaPalavras
            </h1>
            <div className="bg-[#2c5ba7] px-3 py-1 rounded-md shadow-sm mt-2 inline-block">
              <span className="text-[#fffffd] mr-2">Room Code:</span>
              <span className="font-bold text-[#fdc11d]">{room.id}</span>
            </div>
          </div>

          {player.isHost && !room.currentTheme && (
            <Button
              onClick={handleStartGame}
              className="mt-4 sm:mt-0 bg-[#2c5ba7] text-[#fffffd] hover:bg-[#2c5ba7]/90"
              disabled={room.players.length < 2}
            >
              {room.players.length < 2
                ? 'Waiting for players...'
                : 'Start Game'}
            </Button>
          )}
        </header>

        <div className="flex flex-col items-center">
          {/* Game circle is central */}
          <div className="mb-8 mt-4 flex justify-center">
            {room.letters && room.letters.length > 0 ? (
              <LetterCircle
                letters={room.letters}
                usedLetters={room.usedLetters || []}
                isPlayerTurn={isPlayersTurn && !isGameOver}
                selectedLetter={room.selectedLetter || null}
                onLetterSelect={handleLetterSelect}
                onPassTurn={handlePassTurn}
              />
            ) : (
              <div className="bg-[#fdc11d] rounded-full w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] md:w-[380px] md:h-[380px] flex items-center justify-center text-[#1f2a28] font-semibold">
                <p className="text-center px-4">Waiting for game to start...</p>
              </div>
            )}
          </div>

          <div className="w-full max-w-lg mx-auto grid grid-cols-1 gap-4 sm:gap-6">
            {room.currentTheme && <ThemeCard theme={room.currentTheme} />}

            <PlayerList
              players={room.players}
              activePlayerId={room.activePlayerId}
              currentPlayerId={player.id}
              loserId={room.loser}
            />

            {room.currentTheme &&
              room.activePlayerId &&
              room.currentTurnStartTime &&
              !isGameOver && (
                <div className="bg-[#fffffd] shadow-md rounded-lg p-3 sm:p-4 border border-[#2c5ba7]/20">
                  <TurnTimer
                    startTime={room.currentTurnStartTime}
                    timeLimit={room.timeLimit}
                    isActive={isPlayersTurn}
                  />

                  {isPlayersTurn && (
                    <div className="mt-3 sm:mt-4 bg-[#1f2a28] p-2 sm:p-3 rounded-md text-center">
                      {!room.selectedLetter ? (
                        <p className="text-[#fdc11d] font-bold text-sm sm:text-base">
                          Choose a letter!
                        </p>
                      ) : (
                        <p className="text-[#fdc11d] font-bold text-sm sm:text-base">
                          Say a word and click the center button!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

            {isGameOver && (
              <div
                className={`shadow-md rounded-lg p-3 sm:p-4 text-center ${
                  playerLost ? 'bg-[#1f2a28]' : 'bg-[#2c5ba7]'
                }`}
              >
                {playerLost ? (
                  <p className="text-[#fdc11d] text-lg sm:text-xl font-bold">
                    You lost the game!
                  </p>
                ) : (
                  <>
                    <p className="text-[#fffffd] text-lg sm:text-xl font-bold">
                      Game Over!
                    </p>
                    <p className="text-[#fdc11d] mt-2">
                      {noMoreLetters
                        ? 'No more letters available!'
                        : 'Player ran out of time!'}
                    </p>
                    <p className="text-[#fffffd] mt-2">
                      {room.players.find((p) => p.id === room.loser)?.name ||
                        'Someone'}{' '}
                      lost.
                    </p>
                  </>
                )}

                {player.isHost && (
                  <Button
                    onClick={handleStartGame}
                    className="mt-3 sm:mt-4 bg-[#fdc11d] text-[#1f2a28] hover:bg-[#fdc11d]/80"
                  >
                    Start New Game
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
