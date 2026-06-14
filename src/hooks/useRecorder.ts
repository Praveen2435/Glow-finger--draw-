import { useRef, useCallback } from 'react';

export function useRecorder(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'glow-finger-session.webm';
        a.click();
        URL.revokeObjectURL(url);
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error('Could not start recording:', err);
    }
  }, [canvasRef]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  const isRecording = useCallback(() => {
    return mediaRecorderRef.current?.state === 'recording';
  }, []);

  return { start, stop, isRecording };
}
