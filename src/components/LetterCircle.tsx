import React from 'react';

interface LetterCircleProps {
  letters: string[];
  radius?: number;
}

export function LetterCircle({ letters, radius = 150 }: LetterCircleProps) {
  const numLetters = letters.length;
  const angleStep = (2 * Math.PI) / numLetters;

  return (
    <div className="relative w-[350px] h-[350px] mx-auto">
      {/* Background circle */}
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl"
        style={{
          width: radius * 2,
          height: radius * 2,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Letters */}
      {letters.map((letter, index) => {
        const angle = index * angleStep;
        const x = radius * Math.cos(angle - Math.PI / 2);
        const y = radius * Math.sin(angle - Math.PI / 2);

        return (
          <div
            key={index}
            className="absolute flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-md transform -translate-x-1/2 -translate-y-1/2 font-bold text-2xl text-gray-800"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
            }}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}
