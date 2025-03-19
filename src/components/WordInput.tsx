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
      <div className="w-full max-w-sm mx-auto p-4 bg-gray-100 rounded-lg border border-gray-200 mt-4">
        <p className="text-center text-gray-500">Wait for your turn...</p>
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
          placeholder="Enter a word..."
          autoFocus
          className="flex-1"
        />
        <Button type="submit" variant="default">
          Submit
        </Button>
      </div>
      <p className="text-center mt-2 text-sm font-semibold text-green-600">
        Your turn! Enter a word using the letters above.
      </p>
    </form>
  );
}
