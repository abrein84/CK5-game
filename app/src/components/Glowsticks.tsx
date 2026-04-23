import { useEffect, useState, useRef } from "react";

interface Glowstick {
  id: number;
  x: number;
  startY: number;
  color: string;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  lifetime: number;
}

interface GlowsticksProps {
  crowdMeterRate: number; // Rate of change per second
  isActive: boolean;
}

const GLOWSTICK_COLORS = [
  "#00ff00", // Green
  "#ff0099", // Pink
  "#00ffff", // Cyan
  "#ffff00", // Yellow
  "#ff6600", // Orange
  "#9900ff", // Purple
];

export function Glowsticks({ crowdMeterRate, isActive }: GlowsticksProps) {
  const [glowsticks, setGlowsticks] = useState<Glowstick[]>([]);
  const nextIdRef = useRef(0);
  const animationRef = useRef<number>();

  // Spawn glowsticks based on how fast crowd meter is increasing
  useEffect(() => {
    if (!isActive || crowdMeterRate <= 0) {
      // Clear glowsticks if not doing well
      if (glowsticks.length > 0) {
        setGlowsticks([]);
      }
      return;
    }

    // Spawn rate based on how fast crowd is increasing
    // crowdMeterRate is in % per second
    // Beat match gives +30% spike, tone match gives +1%/sec
    const intensity = Math.min(1, crowdMeterRate / 30); // Normalize to 0-1 (30%/sec = max, from beat match)
    const spawnInterval = Math.max(150, 500 - intensity * 350); // Faster when doing really well

    const interval = setInterval(() => {
      if (Math.random() < Math.min(0.8, intensity * 1.5)) {
        // Vary number of glowsticks based on intensity
        let count = 1;

        if (crowdMeterRate >= 20) {
          // Big spike (beat match!) - lots of glowsticks
          count = 5 + Math.floor(Math.random() * 4); // 5-8 glowsticks
        } else if (crowdMeterRate >= 5) {
          // Good move - several glowsticks
          count = 2 + Math.floor(Math.random() * 2); // 2-3 glowsticks
        } else if (crowdMeterRate >= 2) {
          // Decent - a couple
          count = 1 + Math.floor(Math.random() * 2); // 1-2 glowsticks
        } else {
          // Small positive - just one
          count = Math.random() < 0.5 ? 1 : 2; // 1-2 glowsticks
        }

        // Spawn the glowsticks
        const newSticks: Glowstick[] = [];
        for (let i = 0; i < count; i++) {
          newSticks.push({
            id: nextIdRef.current++,
            x: Math.random() * 100,
            startY: 100,
            color: GLOWSTICK_COLORS[Math.floor(Math.random() * GLOWSTICK_COLORS.length)],
            velocityX: (Math.random() - 0.5) * 0.5,
            velocityY: -1.8 - Math.random() * 1.2,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 15,
            lifetime: 0,
          });
        }

        setGlowsticks(prev => [...prev, ...newSticks]);
      }
    }, spawnInterval);

    return () => clearInterval(interval);
  }, [crowdMeterRate, isActive]);

  // Animate glowsticks
  useEffect(() => {
    const animate = () => {
      setGlowsticks(prev => {
        return prev
          .map(stick => ({
            ...stick,
            x: stick.x + stick.velocityX,
            velocityY: stick.velocityY + 0.05, // Gravity
            rotation: stick.rotation + stick.rotationSpeed,
            lifetime: stick.lifetime + 1,
          }))
          .filter(stick => stick.lifetime < 200); // Remove after ~3 seconds
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!isActive) return null;

  return (
    <div className="glowstick-container">
      {glowsticks.map(stick => {
        const currentY = stick.startY + stick.velocityY * stick.lifetime + 0.05 * stick.lifetime * stick.lifetime / 2;
        const opacity = Math.max(0, 1 - stick.lifetime / 200);

        return (
          <div
            key={stick.id}
            className="glowstick"
            style={{
              left: `${stick.x}%`,
              top: `${currentY}%`,
              transform: `rotate(${stick.rotation}deg)`,
              opacity,
              backgroundColor: stick.color,
              boxShadow: `0 0 10px ${stick.color}, 0 0 20px ${stick.color}`,
            }}
          />
        );
      })}
    </div>
  );
}
