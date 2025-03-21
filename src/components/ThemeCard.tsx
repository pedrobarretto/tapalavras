import React from 'react';

interface ThemeCardProps {
  theme: string;
}

export function ThemeCard({ theme }: ThemeCardProps) {
  return (
    <div className="w-full max-w-sm mx-auto md:max-w-none bg-[#fffffd] shadow-lg rounded-xl overflow-hidden border-2 border-[#2c5ba7] transform rotate-1 my-2 sm:my-4">
      <div className="px-4 py-2 bg-[#2c5ba7] text-[#fffffd] text-center font-semibold">
        TEMA
      </div>
      <div className="p-4 sm:p-6 flex items-center justify-center">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-[#1f2a28]">
          {theme}
        </h2>
      </div>
    </div>
  );
}
