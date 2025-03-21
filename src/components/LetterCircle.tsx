import { Hand } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface LetterCircleProps {
  letters: string[];
  usedLetters: string[];
  isPlayerTurn: boolean;
  selectedLetter: string | null;
  onLetterSelect: (letter: string) => void;
  onPassTurn: () => void;
  radius?: number;
}

export function LetterCircle({
  letters,
  usedLetters,
  isPlayerTurn,
  selectedLetter,
  onLetterSelect,
  onPassTurn,
  radius = 150,
}: LetterCircleProps) {
  const [containerSize, setContainerSize] = useState({
    width: 400,
    height: 400,
  });
  const [responsiveRadius, setResponsiveRadius] = useState(radius);

  // Handle resizing
  useEffect(() => {
    const updateSize = () => {
      const screenWidth = window.innerWidth;
      let newSize;

      if (screenWidth < 400) {
        // Mobile small
        newSize = { width: screenWidth - 40, height: screenWidth - 40 };
        setResponsiveRadius(Math.min(newSize.width, newSize.height) / 2 - 20);
      } else if (screenWidth < 768) {
        // Mobile large
        newSize = { width: 360, height: 360 };
        setResponsiveRadius(160);
      } else if (screenWidth < 1024) {
        // Tablet
        newSize = { width: 400, height: 400 };
        setResponsiveRadius(180);
      } else {
        // Desktop
        newSize = { width: 500, height: 500 };
        setResponsiveRadius(220);
      }

      setContainerSize(newSize);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const numLetters = letters.length;
  const angleStep = (2 * Math.PI) / numLetters;

  const handleLetterClick = (letter: string, isDisabled: boolean) => {
    if (!isPlayerTurn || isDisabled || selectedLetter) return;
    onLetterSelect(letter);
  };

  const handleCenterButtonClick = () => {
    if (!isPlayerTurn || !selectedLetter) return;
    onPassTurn();
  };

  // Calculate tile size based on responsive radius
  const tileSize = Math.max(Math.min(responsiveRadius * 0.32, 60), 32); // Min 32px, max 60px
  const handIconSize = Math.max(responsiveRadius * 0.15, 24); // Scale hand icon size

  return (
    <div
      className="relative mx-auto"
      style={{ width: containerSize.width, height: containerSize.height }}
    >
      {/* Middle blue ring */}
      <div
        className="absolute rounded-full bg-[#2c5ba7] shadow-xl"
        style={{
          width: responsiveRadius * 1.2,
          height: responsiveRadius * 1.2,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
        }}
      >
        {/* Center yellow internal ring */}
        <div
          className="absolute rounded-full bg-[#fdc11d]"
          style={{
            width: responsiveRadius * 0.7,
            height: responsiveRadius * 0.7,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 11,
          }}
        />

        {/* Center white palm button */}
        <div
          onClick={handleCenterButtonClick}
          className={`absolute rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all duration-200 ${
            isPlayerTurn && selectedLetter
              ? 'bg-[#fffffd] hover:bg-[#fffffd]/80 scale-110'
              : 'bg-[#fffffd]/80 cursor-not-allowed'
          }`}
          style={{
            width: Math.max(responsiveRadius * 0.25, 50),
            height: Math.max(responsiveRadius * 0.25, 50),
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 12,
          }}
        >
          {selectedLetter && (
            <span className="text-[#1f2a28] font-bold">
              <Hand size={handIconSize} />
            </span>
          )}
        </div>
      </div>

      {/* Outer yellow circle */}
      <div
        className="absolute rounded-full bg-[#fdc11d] shadow-xl"
        style={{
          width: responsiveRadius * 2,
          height: responsiveRadius * 2,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Letters */}
      {letters.map((letter, index) => {
        const angle = index * angleStep;
        // Position tiles exactly on the perimeter of the circle
        const distance = responsiveRadius;
        const x = distance * Math.cos(angle - Math.PI / 2);
        const y = distance * Math.sin(angle - Math.PI / 2);
        const isUsed = usedLetters.includes(letter);
        const isSelected = selectedLetter === letter;

        return (
          <div
            key={index}
            onClick={() => handleLetterClick(letter, isUsed)}
            className={`absolute flex items-center justify-center shadow-md transform font-bold border-2 transition-all duration-150 ${
              isUsed
                ? 'bg-[#1f2a28]/20 text-[#1f2a28]/30 border-[#1f2a28]/20 cursor-not-allowed'
                : isSelected
                ? 'bg-[#2c5ba7] text-[#fffffd] border-[#1f2a28] scale-110'
                : 'bg-[#fdc11d] text-[#1f2a28] border-[#1f2a28] hover:scale-105 cursor-pointer'
            }`}
            style={{
              width: tileSize,
              height: tileSize,
              fontSize: `${Math.max(tileSize * 0.5, 18)}px`,
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: `translate(-50%, -50%) rotate(${
                angle + Math.PI / 2
              }rad)`,
              borderRadius: '6px',
            }}
          >
            <span style={{ transform: `rotate(${-(angle + Math.PI / 2)}rad)` }}>
              {letter}
            </span>
          </div>
        );
      })}
    </div>
  );
}
