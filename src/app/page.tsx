'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { Sparkles, Users, PlusCircle, LogIn } from 'lucide-react';

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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fffffd] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-[#fdc11d] rounded-br-full -translate-x-8 -translate-y-8 transform rotate-12"></div>
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#2c5ba7] rounded-tl-full translate-x-10 translate-y-10 transform -rotate-12"></div>
      <div className="absolute top-1/4 right-10 w-16 h-16 bg-[#fdc11d] rounded-full opacity-30"></div>
      <div className="absolute bottom-1/3 left-10 w-12 h-12 bg-[#2c5ba7] rounded-full opacity-30"></div>

      {/* Zigzag pattern at top */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-[#2c5ba7] z-10"></div>
      <div className="absolute top-8 left-0 right-0 flex">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 bg-[#2c5ba7]"
            style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
          ></div>
        ))}
      </div>

      <div className="max-w-md w-full z-10 pt-8">
        <div className="text-center mb-8 transform -rotate-2">
          <div className="relative inline-block">
            <h1 className="text-5xl sm:text-6xl font-extrabold text-[#1f2a28] mb-2 px-6 py-2 border-4 border-[#fdc11d] bg-[#fffffd] rounded-xl shadow-lg transform rotate-2">
              TapaPalavras
            </h1>
            <Sparkles
              className="absolute -top-4 -right-4 text-[#fdc11d]"
              size={32}
            />
          </div>
          <p className="text-xl text-[#1f2a28] mt-6 font-medium bg-[#fdc11d] p-2 rounded-lg inline-block shadow-md transform rotate-1">
            Aquele joguinho famoso no TikTok, mas aqui você joga online!
          </p>
        </div>

        <div className="relative bg-[#fffffd] rounded-xl shadow-xl p-8 border-4 border-[#2c5ba7] transform rotate-1">
          {/* Cartoon speech bubble pointer */}
          <div className="absolute -top-4 left-8 w-8 h-8 bg-[#fffffd] border-l-4 border-t-4 border-[#2c5ba7] transform rotate-45"></div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-base font-bold text-[#1f2a28] mb-2"
              >
                Seu Nome
              </label>
              <Input
                id="name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full border-2 border-[#2c5ba7] text-[#1f2a28] focus:ring-[#fdc11d] focus:border-[#fdc11d]"
              />
            </div>

            {showJoinForm ? (
              <>
                <div>
                  <label
                    htmlFor="roomId"
                    className="block text-base font-bold text-[#1f2a28] mb-2"
                  >
                    Código da Sala
                  </label>
                  <Input
                    id="roomId"
                    type="text"
                    value={joinRoomId}
                    onChange={(e) =>
                      setJoinRoomId(e.target.value.toUpperCase())
                    }
                    placeholder="Digite o código da sala"
                    className="w-full border-2 border-[#2c5ba7] text-[#1f2a28] focus:ring-[#fdc11d] focus:border-[#fdc11d]"
                    maxLength={6}
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    asChild
                    disabled={!playerName || !joinRoomId}
                    className="w-full bg-[#2c5ba7] hover:bg-[#2c5ba7]/90 text-[#fffffd] font-bold py-6 rounded-xl border-2 border-[#1f2a28] shadow-md transition-transform transform hover:scale-105 hover:-rotate-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <Link
                      href={`/room/${joinRoomId}?name=${encodeURIComponent(
                        playerName
                      )}`}
                      className="flex items-center justify-center gap-2"
                    >
                      <LogIn size={20} />
                      <span>Entrar na Sala</span>
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowJoinForm(false)}
                    className="w-full border-2 border-[#1f2a28] text-[#1f2a28] font-bold rounded-xl hover:bg-[#fdc11d]/10 transition-transform transform hover:scale-105 hover:rotate-1"
                  >
                    Voltar
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={handleCreateRoom}
                  disabled={!playerName}
                  className="w-full bg-[#fdc11d] hover:bg-[#fdc11d]/90 text-[#1f2a28] font-bold py-6 rounded-xl border-2 border-[#1f2a28] shadow-md transition-transform transform hover:scale-105 hover:rotate-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center justify-center gap-2">
                    <PlusCircle size={20} />
                    <span>Criar Sala</span>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowJoinForm(true)}
                  className="w-full bg-[#2c5ba7] hover:bg-[#2c5ba7]/90 text-[#fffffd] font-bold py-6 rounded-xl border-2 border-[#1f2a28] shadow-md transition-transform transform hover:scale-105 hover:-rotate-1"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users size={20} />
                    <span>Entrar em Sala Existente</span>
                  </div>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[#1f2a28] bg-[#fdc11d] font-medium px-4 py-2 rounded-lg inline-block shadow-md transform -rotate-1">
            Compartilhe o código da sala com amigos para jogar juntos!
          </p>
        </div>
      </div>
    </main>
  );
}
