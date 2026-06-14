import React, { useEffect, useRef } from 'react';

interface DrawingCanvasProps {
  drawingCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  drawingCanvasRef,
  overlayCanvasRef,
  videoRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncSize = () => {
      const drawCanvas = drawingCanvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      const container = containerRef.current;

      if (!container) return;

      const w = container.clientWidth;
      const h = container.clientHeight;

      if (drawCanvas) {
        drawCanvas.width = w;
        drawCanvas.height = h;
      }
      if (overlayCanvas) {
        overlayCanvas.width = w;
        overlayCanvas.height = h;
      }
    };

    syncSize();

    const observer = new ResizeObserver(syncSize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [drawingCanvasRef, overlayCanvasRef, videoRef]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      {/* Persistent drawing canvas */}
      <canvas
        ref={drawingCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />
      {/* Overlay canvas for cursor and particles */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};

export default DrawingCanvas;
