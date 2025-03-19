'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const router = useRouter();

  const handleCreateRoom = useCallback(() => {
    if (!playerName) return;
    const roomId = nanoid(6).toUpperCase();
    router.push(
      `/room/${roomId}?name=${encodeURIComponent(playerName)}&host=true`
    );
  }, [playerName, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
          TapaPalavras
        </h1>
        <p className="text-xl text-gray-600">
          A fun word game to play with friends!
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Name
            </label>
            <Input
              id="name"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full"
            />
          </div>

          {showJoinForm ? (
            <>
              <div>
                <label
                  htmlFor="roomId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Room Code
                </label>
                <Input
                  id="roomId"
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter room code"
                  className="w-full"
                  maxLength={6}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  asChild
                  disabled={!playerName || !joinRoomId}
                  className="w-full"
                >
                  <Link
                    href={`/room/${joinRoomId}?name=${encodeURIComponent(
                      playerName
                    )}`}
                  >
                    Join Room
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowJoinForm(false)}
                >
                  Back
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleCreateRoom}
                disabled={!playerName}
                className="w-full"
              >
                Create Room
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowJoinForm(true)}
              >
                Join Existing Room
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Share the room code with friends to play together!</p>
      </div>
    </main>
  );
}
