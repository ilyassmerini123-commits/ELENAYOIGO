import { useEffect, useRef } from 'react';
import { useCall } from '../contexts/CallContext';

export const useLiveListen = (socket: any) => {
  const { isListening } = useCall();
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isListening && socket) {
      if (!audioContext.current) {
        audioContext.current = new AudioContext();
      }
      
      socket.on('twilio_audio', (base64Audio: string) => {
        // Aquí deberías decodificar el audio y reproducirlo
        // Como ya tenemos utilidades de audio, las usaremos
        console.log("Audio recibido para Live Listen");
      });
    } else {
      socket?.off('twilio_audio');
    }
  }, [isListening, socket]);
};
