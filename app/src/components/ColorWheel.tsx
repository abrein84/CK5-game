import { useRef, useEffect, useState } from "react";

interface ColorWheelProps {
  onColorChange: (color: string) => void;
  currentColor: string;
  musicIntensity?: number;
}

export function ColorWheel({ onColorChange, currentColor, musicIntensity = 0 }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate glow intensity based on music
  const glowIntensity = 0.3 + (musicIntensity * 0.7); // 0.3 to 1.0
  const glowSize = 15 + (musicIntensity * 25); // 15px to 40px glow

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 120;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Draw color wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = angle * Math.PI / 180;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      const hue = angle;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.fill();
    }

    // Inner circle for brightness control
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.6);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const getColorFromPosition = (x: number, y: number): string => {
    const canvas = canvasRef.current;
    if (!canvas) return currentColor;

    const rect = canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const dx = canvasX - centerX;
    const dy = canvasY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate angle for hue
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle < 0) angle += 360;

    // Calculate saturation and lightness based on distance from center
    const maxRadius = canvas.width / 2 - 10;
    const normalizedDistance = Math.min(distance / maxRadius, 1);

    const hue = angle;
    const saturation = 100;
    const lightness = normalizedDistance > 0.6 ? 50 : 50 + (1 - normalizedDistance / 0.6) * 30;

    return hslToHex(hue, saturation, lightness);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    const color = getColorFromPosition(e.clientX, e.clientY);
    onColorChange(color);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const color = getColorFromPosition(e.clientX, e.clientY);
      onColorChange(color);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div className="color-wheel-container">
      <canvas
        ref={canvasRef}
        width={120}
        height={120}
        className="color-wheel-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{
          filter: `drop-shadow(0 0 ${glowSize}px rgba(255, 255, 255, ${glowIntensity}))`,
          transform: `scale(${1 + musicIntensity * 0.05})`,
          transition: 'transform 0.1s ease-out',
        }}
      />
      <div className="current-color-indicator" style={{ backgroundColor: currentColor }}></div>
    </div>
  );
}
