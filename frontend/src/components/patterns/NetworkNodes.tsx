import React, { useEffect, useRef } from 'react';

interface NetworkNodesProps {
  className?: string;
  nodeCount?: number;
  animated?: boolean;
  color?: string;
  connectionOpacity?: number;
}

const NetworkNodes: React.FC<NetworkNodesProps> = ({
  className = '',
  nodeCount = 20,
  animated = true,
  color = '#667eea',
  connectionOpacity = 0.15,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }

    const nodes: Node[] = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 3 + 2,
    }));

    const maxDistance = 150;

    const animate = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach((node) => {
        if (animated) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
          if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
      });

      // Draw connections
      nodes.forEach((node1, i) => {
        nodes.slice(i + 1).forEach((node2) => {
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(node1.x, node1.y);
            ctx.lineTo(node2.x, node2.y);
            ctx.strokeStyle = color;
            ctx.globalAlpha = connectionOpacity * (1 - distance / maxDistance);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      if (animated) {
        requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [nodeCount, animated, color, connectionOpacity]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity: 0.4 }}
    />
  );
};

export default NetworkNodes;
