import React, { useEffect, useState } from 'react';

interface TurnTimerProps {
  startTime: number;
  timeLimit: number;
  isActive: boolean;
}

export function TurnTimer({ startTime, timeLimit, isActive }: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const updateTimeLeft = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeLeft(remaining);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 100);

    return () => clearInterval(interval);
  }, [startTime, timeLimit, isActive]);

  const seconds = Math.ceil(timeLeft / 1000);
  const percent = (timeLeft / timeLimit) * 100;

  return (
    <div className="w-full max-w-sm mx-auto md:max-w-none my-2 sm:my-4">
      <div className="flex justify-between items-center mb-1 md:mb-2">
        <span className="text-xs sm:text-sm md:text-base font-medium text-[#1f2a28]">
          Tempo restante
        </span>
        <span className="text-xs sm:text-sm md:text-base font-medium text-[#1f2a28]">
          {seconds}s
        </span>
      </div>
      <div className="w-full bg-[#2c5ba7]/20 rounded-full h-2 sm:h-2.5 md:h-3">
        <div
          className={`h-2 sm:h-2.5 md:h-3 rounded-full ${
            percent < 30 ? 'bg-[#1f2a28]' : 'bg-[#fdc11d]'
          }`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
