import { useEffect, useRef } from 'react';
import { useCall } from '../contexts/CallContext';

export const useWorkerAudio = (socket: any) => {
  const { isBargeInActive } = useCall();
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (isBargeInActive && socket) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Audio = reader.result?.toString().split(',')[1];
              socket.emit('worker_audio', base64Audio);
            };
            reader.readAsDataURL(event.data);
          }
        };
        mediaRecorder.current.start(100);
      });
    } else {
      mediaRecorder.current?.stop();
      mediaRecorder.current?.stream.getTracks().forEach(track => track.stop());
    }
  }, [isBargeInActive, socket]);
};
