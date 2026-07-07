import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

interface CallContextType {
  isCallActive: boolean;
  isListening: boolean;
  isBargeInActive: boolean;
  setIsCallActive: (active: boolean) => void;
  setIsListening: (listening: boolean) => void;
  setIsBargeInActive: (active: boolean) => void;
  // Añadir métodos para manejar el audio aquí
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isBargeInActive, setIsBargeInActive] = useState(false);

  return (
    <CallContext.Provider value={{ 
      isCallActive, setIsCallActive, 
      isListening, setIsListening, 
      isBargeInActive, setIsBargeInActive 
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
};
