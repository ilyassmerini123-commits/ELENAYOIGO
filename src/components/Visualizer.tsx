
import React from 'react';

interface VisualizerProps {
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive }) => {
  return (
    <div className="flex items-center justify-center space-x-1.5 h-16">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={`w-2 bg-blue-500 rounded-full transition-all duration-150 ${
            isActive ? 'animate-pulse' : 'h-1.5'
          }`}
          style={{
            height: isActive ? `${Math.random() * 50 + 10}px` : '6px',
            animationDelay: `${i * 0.08}s`,
            opacity: isActive ? 0.4 + (Math.random() * 0.6) : 0.2
          }}
        />
      ))}
    </div>
  );
};

export default Visualizer;
