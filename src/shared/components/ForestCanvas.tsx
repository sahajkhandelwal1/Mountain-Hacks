import React, { useEffect, useRef } from 'react';
import { CanvasForestRenderer } from '../forest/CanvasForestRenderer';
import { ForestState } from '../types';

interface ForestCanvasProps {
  width: number;
  height: number;
  forestState: ForestState;
}

export const ForestCanvas: React.FC<ForestCanvasProps> = ({ width, height, forestState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasForestRenderer | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    const renderer = new CanvasForestRenderer(canvas);
    rendererRef.current = renderer;

    const animate = () => {
      if (rendererRef.current) {
        rendererRef.current.setForestState(forestState);
        rendererRef.current.draw();
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      rendererRef.current = null;
    };
  }, [width, height]);

  // Update forest state when it changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setForestState(forestState);
    }
  }, [forestState]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
};

