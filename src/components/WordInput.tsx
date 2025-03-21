import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WordInputProps {
  onSubmit: (word: string) => void;
  isActive: boolean;
}

export function WordInput({ onSubmit, isActive }: WordInputProps) {
  const [word, setWord] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (word.trim()) {
      onSubmit(word.trim());
      setWord('');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWord(e.target.value);
  };

  if (!isActive) {
    return (
      <div className="w-full max-w-sm mx-auto p-4 bg-[#2c5ba7]/10 rounded-lg border border-[#2c5ba7]/20 mt-4">
        <p className="text-center text-[#1f2a28]">Aguarde sua vez...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto mt-4">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={word}
          onChange={handleChange}
          placeholder="Digite uma palavra..."
          autoFocus
          className="flex-1 border-[#2c5ba7] focus-visible:ring-[#fdc11d]"
        />
        <Button
          type="submit"
          className="bg-[#2c5ba7] text-[#fffffd] hover:bg-[#2c5ba7]/90"
        >
          Enviar
        </Button>
      </div>
      <p className="text-center mt-2 text-sm font-semibold text-[#fdc11d] bg-[#1f2a28] py-1 px-2 rounded-md">
        Sua vez! Digite uma palavra usando as letras acima.
      </p>
    </form>
  );
}
