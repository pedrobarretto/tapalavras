'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LetterCircle } from '@/components/LetterCircle';
import { ThemeCard } from '@/components/ThemeCard';
import { PlayerList } from '@/components/PlayerList';
import { TurnTimer } from '@/components/TurnTimer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSocket } from '@/contexts/SocketContext';

export default function GameRoom() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
  const playerName = searchParams.get('name') || '';
  const isHost = searchParams.get('host') === 'true';
  const isDebugMode = searchParams.get('debug') === 'true';

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
    debugMessage,
    clearDebugMessage,
  } = useSocket();

  const [isReady, setIsReady] = useState(false);
  const hasJoinedRef = useRef(false);
  const [customTheme, setCustomTheme] = useState('');

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
  }, [roomId, playerName, socket, isHost, createRoom, joinRoom]);

  const handleStartGame = () => {
    if (!room?.id) return;
    if (!customTheme.trim()) return;
    startGame(room.id, customTheme);
    setCustomTheme(''); // Reset for next round
  };

  const handleLetterSelect = (letter: string) => {
    if (!room?.id || !isPlayersTurn || isGameOver) return;
    selectLetter(room.id, letter);
  };

  const handlePassTurn = () => {
    if (!room?.id || !isPlayersTurn || !room.selectedLetter || isGameOver)
      return;
    passTurn(room.id);
  };

  const isPlayersTurn = player?.id === room?.activePlayerId;
  const playerLost = room?.gameOver && room?.loser === player?.id;
  const isGameOver = room?.gameOver;
  const gameCompletedSuccessfully = isGameOver && !room?.loser;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md w-full">
          <p className="font-bold">Erro</p>
          <p>{error}</p>
        </div>
        <Button className="mt-4" asChild>
          <Link href="/">Voltar para o Início</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-xl text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!room || !player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-xl text-gray-600">
          Sala não encontrada ou erro de conexão.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/">Voltar para o Início</Link>
        </Button>
      </div>
    );
  }

  const availableLettersCount = room.letters
    ? room.letters.filter((letter) => !room.usedLetters.includes(letter)).length
    : 0;

  return (
    <div className="min-h-screen bg-[#fffffd] p-4 sm:p-6">
      {isDebugMode && debugMessage && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black text-white p-2 text-xs">
          <div>Debug: {debugMessage}</div>
          <div>Game state: {isGameOver ? 'Over' : 'Active'}</div>
          <div>Available letters: {availableLettersCount}</div>
          <div>Used letters: {room.usedLetters.join(', ')}</div>
          <div>Active player: {room.activePlayerId}</div>
          <div>
            You are: {player.id} {isPlayersTurn ? '(Your turn)' : ''}
          </div>
          <Button
            onClick={clearDebugMessage}
            size="sm"
            variant="outline"
            className="mt-1"
          >
            Clear
          </Button>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1f2a28]">
              TapaPalavras
            </h1>
            <div className="bg-[#2c5ba7] px-3 py-1 rounded-md shadow-sm mt-2 inline-block">
              <span className="text-[#fffffd] mr-2">Código da Sala:</span>
              <span className="font-bold text-[#fdc11d]">{room.id}</span>
            </div>
          </div>

          {player.isHost && (!room.currentTheme || isGameOver) && (
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="flex flex-col gap-1">
                <Input
                  type="text"
                  placeholder="Digite um tema..."
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  className="border-[#2c5ba7] max-w-xs"
                  required
                />
                <p className="text-xs text-[#2c5ba7] italic">
                  Digite um tema para o jogo (ex: Filmes, Animais, Países)
                </p>
              </div>
              <Button
                onClick={handleStartGame}
                className="bg-[#2c5ba7] text-[#fffffd] hover:bg-[#2c5ba7]/90"
                disabled={room.players.length < 2 || !customTheme.trim()}
              >
                {room.players.length < 2
                  ? 'Aguardando jogadores...'
                  : !customTheme.trim()
                  ? 'Digite um tema'
                  : isGameOver
                  ? 'Iniciar Novo Jogo'
                  : 'Iniciar Jogo'}
              </Button>
            </div>
          )}
        </header>

        <div className="flex flex-col md:flex-row md:items-start md:gap-8">
          {/* Game circle on left for desktop, centered for mobile */}
          <div className="mb-8 mt-4 md:mt-0 flex justify-center md:justify-start md:flex-shrink-0 md:w-1/2">
            {room.letters && room.letters.length > 0 ? (
              <LetterCircle
                letters={room.letters}
                usedLetters={room.usedLetters || []}
                isPlayerTurn={isPlayersTurn && !isGameOver}
                selectedLetter={room.selectedLetter || null}
                onLetterSelect={handleLetterSelect}
                onPassTurn={handlePassTurn}
                radius={180}
              />
            ) : (
              <div className="bg-[#fdc11d] rounded-full w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] md:w-[400px] md:h-[400px] flex items-center justify-center text-[#1f2a28] font-semibold">
                <p className="text-center px-4">
                  Aguardando o início do jogo...
                </p>
              </div>
            )}
          </div>

          {/* Game info on right for desktop, below for mobile */}
          <div className="w-full md:w-1/2 max-w-lg md:max-w-none mx-auto grid grid-cols-1 gap-4 sm:gap-6">
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
                          Escolha uma letra!
                        </p>
                      ) : (
                        <p className="text-[#fdc11d] font-bold text-sm sm:text-base">
                          Diga uma palavra e clique no botão central!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

            {isGameOver && (
              <div
                className={`shadow-md rounded-lg p-3 sm:p-4 text-center ${
                  playerLost
                    ? 'bg-[#1f2a28]'
                    : gameCompletedSuccessfully
                    ? 'bg-green-600'
                    : 'bg-[#2c5ba7]'
                }`}
              >
                {playerLost ? (
                  <p className="text-[#fdc11d] text-lg sm:text-xl font-bold">
                    Você perdeu o jogo!
                  </p>
                ) : gameCompletedSuccessfully ? (
                  <>
                    <p className="text-[#fffffd] text-lg sm:text-xl font-bold">
                      Parabéns! Jogo Completo!
                    </p>
                    <p className="text-[#fdc11d] mt-2">
                      Todas as letras foram usadas com sucesso!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[#fffffd] text-lg sm:text-xl font-bold">
                      Fim de Jogo!
                    </p>
                    <p className="text-[#fdc11d] mt-2">
                      {room.loser
                        ? `${
                            room.players.find((p) => p.id === room.loser)
                              ?.name || 'O jogador'
                          } esgotou o tempo!`
                        : 'O jogo terminou!'}
                    </p>
                    {room.loser && (
                      <p className="text-[#fffffd] mt-2">
                        {room.players.find((p) => p.id === room.loser)?.name ||
                          'Alguém'}{' '}
                        perdeu.
                      </p>
                    )}
                  </>
                )}

                {player.isHost && (
                  <div className="mt-3 sm:mt-4 flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <Input
                        type="text"
                        placeholder="Digite um tema..."
                        value={customTheme}
                        onChange={(e) => setCustomTheme(e.target.value)}
                        className="border-[#fdc11d] bg-[#fffffd] max-w-xs mx-auto"
                        required
                      />
                      <p className="text-xs text-[#fffffd] italic text-center">
                        Digite um tema para o jogo (ex: Filmes, Animais, Países)
                      </p>
                    </div>
                    <Button
                      onClick={handleStartGame}
                      className="bg-[#fdc11d] text-[#1f2a28] hover:bg-[#fdc11d]/80"
                      disabled={!customTheme.trim()}
                    >
                      {!customTheme.trim()
                        ? 'Digite um tema'
                        : 'Iniciar Novo Jogo'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
