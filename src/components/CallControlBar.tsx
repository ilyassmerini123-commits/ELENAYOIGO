import React from 'react';
import { useCall } from '../contexts/CallContext';
import { Mic, MicOff, Headphones, Volume2 } from 'lucide-react';

export const CallControlBar: React.FC = () => {
  const { isCallActive, isListening, setIsListening, isBargeInActive, setIsBargeInActive } = useCall();

  if (!isCallActive) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 glass-dark p-4 rounded-full border border-white/10 flex items-center gap-4 shadow-2xl z-50">
      <button 
        onClick={() => setIsListening(!isListening)}
        className={`p-3 rounded-full ${isListening ? 'bg-blue-500' : 'bg-white/10'}`}
      >
        <Headphones size={20} className="text-white" />
      </button>
      <button 
        onClick={() => setIsBargeInActive(!isBargeInActive)}
        className={`p-3 rounded-full ${isBargeInActive ? 'bg-red-500' : 'bg-white/10'}`}
      >
        {isBargeInActive ? <Mic size={20} className="text-white" /> : <MicOff size={20} className="text-white" />}
      </button>
      <div className="text-white text-sm font-mono">
        {isBargeInActive ? 'Barge-in Activo' : 'Escucha Activa'}
      </div>
    </div>
  );
};
