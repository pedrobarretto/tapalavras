import React from 'react';

interface ThemeCardProps {
  theme: string;
}

export function ThemeCard({ theme }: ThemeCardProps) {
  return (
    <div className="w-full max-w-sm mx-auto bg-white shadow-lg rounded-xl overflow-hidden border-2 border-indigo-500 transform rotate-1 my-4">
      <div className="px-4 py-2 bg-indigo-500 text-white text-center font-semibold">
        THEME
      </div>
      <div className="p-6 flex items-center justify-center">
        <h2 className="text-3xl font-bold text-gray-900">{theme}</h2>
      </div>
    </div>
  );
}
