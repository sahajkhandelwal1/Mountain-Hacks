import React, { useEffect, useRef, useState } from 'react';
import { ForestState } from '../shared/types';

interface ForestCanvasP5Props {
  forestState: ForestState;
}

export function ForestCanvasP5({ forestState }: ForestCanvasP5Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [Sketch, setSketch] = useState<any>(null);
  const treeImageRef = useRef<any>(null);
  const [treeImageUrl, setTreeImageUrl] = useState('');

  useEffect(() => {
    // Get the proper URL for the tree image
    setTreeImageUrl(chrome.runtime.getURL('images/tree.png'));
    
    // Dynamically import react-p5
    import('react-p5').then((mod) => {
      setSketch(() => mod.default);
    }).catch(err => {
      console.error('Failed to load p5.js:', err);
    });
  }, []);

  if (!Sketch || !treeImageUrl) return null;

  const preload = (p: any) => {
    console.log('Loading tree image from:', treeImageUrl);
    treeImageRef.current = p.loadImage(treeImageUrl, 
      () => console.log('Tree image loaded successfully'),
      (err: any) => console.error('Failed to load tree image:', err)
    );
  };

  const setup = (p: any, canvasParentRef: any) => {
    p.createCanvas(p.windowWidth, p.windowHeight).parent(canvasParentRef);
    p.frameRate(30);
  };

  const draw = (p: any) => {
    p.clear();

    if (!forestState || !treeImageRef.current) {
      return;
    }

    const wildfireLevel = forestState.wildfire.level || 0;

    // Sort trees by y position for depth
    const sortedTrees = [...forestState.trees].sort((a, b) => a.y - b.y);

    sortedTrees.forEach((tree, index) => {
      const depthFactor = index / Math.max(1, sortedTrees.length);
      drawTreeSprite(p, tree, wildfireLevel, depthFactor, treeImageRef.current);
    });

    // Wildfire overlay effect
    if (wildfireLevel > 0.3) {
      p.fill(255, 100, 0, wildfireLevel * 30);
      p.noStroke();
      p.rect(0, 0, p.width, p.height);

      // Fire particles
      for (let i = 0; i < wildfireLevel * 20; i++) {
        p.fill(255, p.random(100, 200), 0, 150);
        const x = p.random(p.width);
        const y = p.random(p.height);
        p.ellipse(x, y, 3 + p.random(5));
      }
    }
  };

  const windowResized = (p: any) => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  return (
    <div ref={canvasRef} className="absolute inset-0 w-full h-full" aria-label="Animated forest canvas">
      <Sketch setup={setup} draw={draw} windowResized={windowResized} preload={preload} />
    </div>
  );
}

function drawTreeSprite(p: any, tree: any, wildfireLevel: number, depthFactor: number, treeImage: any) {
  const { x, y, height, status } = tree;

  if (!treeImage) return;

  const scale = (height / 150) * (0.5 + depthFactor * 0.5);
  const displayWidth = treeImage.width * scale;
  const displayHeight = treeImage.height * scale;

  const alpha = 150 + depthFactor * 105;

  p.push();
  p.imageMode(p.CENTER);

  if (status === 'healthy') {
    p.tint(255, alpha);
    p.image(treeImage, x, y, displayWidth, displayHeight);
  } else if (status === 'burning') {
    p.tint(255, 100, 50, alpha);
    p.image(treeImage, x, y, displayWidth, displayHeight);

    // Add fire effect on top
    const flicker = p.sin(p.frameCount * 0.2) * 10;
    p.noTint();
    p.fill(255, 50, 0, 180);
    p.noStroke();
    p.ellipse(x, y - displayHeight * 0.2 + flicker, displayWidth * 0.4, displayHeight * 0.3);
    p.fill(255, 150, 0, 150);
    p.ellipse(x, y - displayHeight * 0.3 + flicker, displayWidth * 0.25, displayHeight * 0.2);
  } else if (status === 'burnt') {
    p.tint(60, 55, 50, alpha * 0.6);
    p.image(treeImage, x, y, displayWidth * 0.7, displayHeight * 0.5);
  }

  p.pop();
}
