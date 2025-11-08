import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import { ForestRenderer } from '../forest/ForestRenderer';
import { ForestState } from '../types';

interface ForestCanvasProps {
  width: number;
  height: number;
  forestState: ForestState;
}

export const ForestCanvas: React.FC<ForestCanvasProps> = ({ width, height, forestState }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  const rendererRef = useRef<ForestRenderer | null>(null);
  const forestStateRef = useRef<ForestState>(forestState);

  // Update forest state ref when it changes
  useEffect(() => {
    forestStateRef.current = forestState;
  }, [forestState]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Cleanup previous instance
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }

    // Create new p5 instance
    const sketch = (p: p5) => {
      let renderer: ForestRenderer | null = null;

      p.setup = () => {
        p.createCanvas(width, height);
        renderer = new ForestRenderer(p, width, height);
        rendererRef.current = renderer;
        renderer.setup();
        renderer.setForestState(forestStateRef.current);
      };

      p.draw = () => {
        if (renderer) {
          // Update forest state from ref
          renderer.setForestState(forestStateRef.current);
          renderer.draw();
        }
      };
    };

    p5InstanceRef.current = new p5(sketch, canvasRef.current);

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
      rendererRef.current = null;
    };
  }, [width, height]);

  return <div ref={canvasRef} style={{ width, height }} />;
};

