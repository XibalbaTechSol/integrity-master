import React from 'react';
import { motion } from 'framer-motion';

interface AISGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const AISGauge: React.FC<AISGaugeProps> = ({ 
  score, 
  size = 80, 
  strokeWidth = 6,
  className = ""
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const arcLength = circumference * 0.75; // 270 degree arc
  const offset = circumference - arcLength;
  
  // Normalize score (300-850) to percentage for the gauge
  const normalizedScore = Math.min(Math.max(score - 300, 0) / 550, 1);
  const strokeDashoffset = arcLength - (normalizedScore * arcLength);

  const getColor = (s: number) => {
    return 'var(--gold)';
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-[225deg]"
      >
        {/* Background Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span className="text-lg font-extrabold text-white leading-none tracking-tighter">
          {score}
        </span>
        <span className="text-[7px] uppercase text-zinc-500 font-bold tracking-widest mt-0.5">
          AIS
        </span>
      </div>
    </div>
  );
};
