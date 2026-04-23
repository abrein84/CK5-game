import { useRef, useEffect, useState } from "react";

interface Light {
  x: number;
  y: number;
  color: string;
  shape: string; // square, circle, triangle, off
  beam: string; // none, all-around, sweep, right, left, up, down
  pulseEnabled: boolean;
  pulseFrequency: number; // Hz: 0.1 to 10
  intensity: number;
  active: boolean;
}

interface CanvasLightGridProps {
  rows: number;
  cols: number;
  musicIntensity: number;
  energyLevel: number;
  selectedIndices: Set<number>;
  onSelectionChange?: (indices: Set<number>) => void;
  onActiveLightsChange?: (activeLights: boolean[]) => void;
  onApplyColor?: (applyFn: (color: string, beam: string) => void) => void;
  onApplyBeam?: (applyFn: (beam: string) => void) => void;
  onApplyPulse?: (applyFn: (enabled: boolean, frequency: number) => void) => void;
  onForceOff?: (forceFn: () => void) => void;
  currentBeam: string;
  enableSelection?: boolean;
  compactMode?: boolean;
}

export function CanvasLightGrid({
  rows,
  cols,
  musicIntensity,
  energyLevel,
  selectedIndices,
  onSelectionChange,
  onActiveLightsChange,
  onApplyColor,
  onApplyBeam,
  onApplyPulse,
  onForceOff,
  currentBeam,
  enableSelection = false,
  compactMode = false,
}: CanvasLightGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lights, setLights] = useState<Light[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const animationRef = useRef<number>();
  const energyLevelRef = useRef(energyLevel);
  const selectedIndicesRef = useRef(selectedIndices);
  const timeRef = useRef(0);

  // Scale factor for beam lengths in compact mode
  const beamScale = compactMode ? 0.15 : 1;

  // Keep refs up to date
  useEffect(() => {
    energyLevelRef.current = energyLevel;
  }, [energyLevel]);

  useEffect(() => {
    selectedIndicesRef.current = selectedIndices;
  }, [selectedIndices]);

  // Initialize lights
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newLights: Light[] = [];

    let gridWidth, gridHeight, offsetX, offsetY;

    if (compactMode) {
      // Fill the 100x100 canvas for multi-grid mode
      gridWidth = 90;
      gridHeight = 90;
      offsetX = 5;
      offsetY = 5;
    } else {
      // Original large canvas positioning for full stage
      gridWidth = 350;
      gridHeight = 180;
      offsetX = (canvas.width - gridWidth) / 2;
      offsetY = 20;
    }

    const cellWidth = gridWidth / cols;
    const cellHeight = gridHeight / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        newLights.push({
          x: offsetX + c * cellWidth + cellWidth / 2,
          y: offsetY + r * cellHeight + cellHeight / 2,
          color: "#000000",
          shape: "square",
          beam: "none",
          pulseEnabled: false,
          pulseFrequency: 1,
          intensity: 0,
          active: false,
        });
      }
    }
    setLights(newLights);
  }, [rows, cols, compactMode]);

  // Force all lights off when energy is zero
  useEffect(() => {
    if (onForceOff) {
      onForceOff(() => {
        setLights(prev =>
          prev.map(light => ({ ...light, active: false, intensity: 0, shape: "off" }))
        );
      });
    }
  }, [onForceOff]);

  // Expose apply functions to parent (only run once on mount)
  useEffect(() => {
    if (onApplyColor) {
      onApplyColor((color: string, beam: string) => {
        // Don't allow turning lights on if energy is zero
        if (energyLevelRef.current <= 0) {
          return;
        }

        setLights(prev =>
          prev.map((light, idx) => {
            if (!selectedIndicesRef.current.has(idx)) return light;

            // If light is OFF, turn it on with current presets
            if (!light.active) {
              return { ...light, color, beam, active: true, intensity: 1 };
            }

            // If light is already ON, only change color
            return { ...light, color };
          })
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (onApplyBeam) {
      onApplyBeam((beam: string) => {
        setLights(prev =>
          prev.map((light, idx) =>
            selectedIndicesRef.current.has(idx) ? { ...light, beam } : light
          )
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (onApplyPulse) {
      onApplyPulse((enabled: boolean, frequency: number) => {
        setLights(prev =>
          prev.map((light, idx) =>
            selectedIndicesRef.current.has(idx)
              ? { ...light, pulseEnabled: enabled, pulseFrequency: frequency }
              : light
          )
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      timeRef.current += 0.016; // ~60fps
      const time = timeRef.current;

      lights.forEach((light, idx) => {
        const isSelected = selectedIndices.has(idx);

        // Show selection on inactive lights (but don't draw them otherwise)
        if (!light.active) {
          if (isSelected) {
            ctx.save();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
            ctx.lineWidth = 1;
            ctx.strokeRect(light.x - 14, light.y - 14, 28, 28);
            ctx.restore();
          }
          return;
        }

        let finalIntensity = light.intensity * (0.4 + musicIntensity * 0.6);

        // Apply pulse using frequency in Hz
        if (light.pulseEnabled) {
          const pulseAmount = (Math.sin(time * light.pulseFrequency * 2 * Math.PI) + 1) / 2;
          const minIntensity = 0.3; // Minimum intensity at trough
          finalIntensity *= minIntensity + (pulseAmount * (1 - minIntensity));
        }

        // Draw base light
        drawLightBase(ctx, light, finalIntensity, isSelected);

        // Draw beam overlay
        if (light.beam !== "none") {
          drawBeam(ctx, light, finalIntensity, time, isSelected);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [lights, musicIntensity, selectedIndices]);

  const drawLightBase = (
    ctx: CanvasRenderingContext2D,
    light: Light,
    intensity: number,
    isSelected: boolean
  ) => {
    ctx.save();
    ctx.globalAlpha = intensity;

    // Radial glow
    const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 50);
    gradient.addColorStop(0, light.color);
    gradient.addColorStop(0.4, light.color + "AA");
    gradient.addColorStop(0.7, light.color + "44");
    gradient.addColorStop(1, "transparent");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(light.x, light.y, 50, 0, Math.PI * 2);
    ctx.fill();

    // Brighter center
    const centerGradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 15);
    centerGradient.addColorStop(0, light.color);
    centerGradient.addColorStop(1, light.color + "88");

    ctx.fillStyle = centerGradient;
    ctx.fillRect(light.x - 10, light.y - 10, 20, 20);

    ctx.restore();

    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
      ctx.lineWidth = 1;
      ctx.strokeRect(light.x - 14, light.y - 14, 28, 28);
      ctx.restore();
    }
  };

  // Unified beam drawing function
  const drawBeam = (
    ctx: CanvasRenderingContext2D,
    light: Light,
    intensity: number,
    time: number,
    isSelected: boolean
  ) => {
    if (light.beam === "none") return;

    // Parse beam format: "type-direction-motion-speed"
    const parts = light.beam.split('-');
    const beamType = parts[0] || 'none';
    const direction = parts[1] || 'down';
    const motion = parts[2] || 'static';
    const speed = parseFloat(parts[3]) || 1;

    // Calculate base angle from direction
    let baseAngle = 0;
    switch (direction) {
      case 'up': baseAngle = -Math.PI / 2; break;
      case 'down': baseAngle = Math.PI / 2; break;
      case 'left': baseAngle = Math.PI; break;
      case 'right': baseAngle = 0; break;
    }

    // Apply motion effects
    let angleOffset = 0;
    let motionIntensity = intensity;

    if (motion === 'sweep') {
      angleOffset = time * 2 * speed;
    } else if (motion === 'pulse') {
      // Pulse the intensity/brightness
      const pulseValue = Math.sin(time * 2 * Math.PI * speed) * 0.5 + 0.5; // 0 to 1
      motionIntensity = intensity * pulseValue;
    }

    ctx.save();
    ctx.globalAlpha = motionIntensity;

    // Directional beams
    const finalAngle = baseAngle + angleOffset;

    if (beamType === 'line') {
      drawLineDirectional(ctx, light, intensity, time, finalAngle);
    } else if (beamType === 'cone') {
      drawConeDirectional(ctx, light, intensity, time, finalAngle);
    } else if (beamType === 'fan') {
      drawFanDirectional(ctx, light, intensity, time, finalAngle);
    } else if (beamType === 'cross') {
      drawCrossDirectional(ctx, light, intensity, time, finalAngle);
    }

    ctx.restore();

    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
      ctx.lineWidth = 1;
      ctx.strokeRect(light.x - 14, light.y - 14, 28, 28);
      ctx.restore();
    }
  };

  const drawLineDirectional = (
    ctx: CanvasRenderingContext2D,
    light: Light,
    intensity: number,
    time: number,
    angle: number
  ) => {
    const beamLength = (600 + Math.sin(time * 2) * 100) * beamScale;

    const endX = light.x + Math.cos(angle) * beamLength;
    const endY = light.y + Math.sin(angle) * beamLength;

    const gradient = ctx.createLinearGradient(light.x, light.y, endX, endY);
    gradient.addColorStop(0, light.color);
    gradient.addColorStop(0.2, light.color + "CC");
    gradient.addColorStop(0.5, light.color + "66");
    gradient.addColorStop(1, "transparent");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(light.x, light.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  };

  const drawConeDirectional = (
    ctx: CanvasRenderingContext2D,
    light: Light,
    intensity: number,
    time: number,
    angle: number
  ) => {
    const beamLength = (400 + Math.sin(time * 2) * 60) * beamScale;
    const coneWidth = 80 * beamScale;

    const endX = light.x + Math.cos(angle) * beamLength;
    const endY = light.y + Math.sin(angle) * beamLength;

    const gradient = ctx.createLinearGradient(light.x, light.y, endX, endY);
    gradient.addColorStop(0, light.color);
    gradient.addColorStop(0.3, light.color + "AA");
    gradient.addColorStop(1, "transparent");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(light.x, light.y);

    const perpAngle = angle + Math.PI / 2;
    ctx.lineTo(
      endX + Math.cos(perpAngle) * coneWidth / 2,
      endY + Math.sin(perpAngle) * coneWidth / 2
    );
    ctx.lineTo(
      endX - Math.cos(perpAngle) * coneWidth / 2,
      endY - Math.sin(perpAngle) * coneWidth / 2
    );
    ctx.closePath();
    ctx.fill();
  };

  const drawFanDirectional = (
    ctx: CanvasRenderingContext2D,
    light: Light,
    intensity: number,
    time: number,
    centerAngle: number
  ) => {
    const beamCount = 7;
    const beamLength = (350 + Math.sin(time * 2) * 50) * beamScale;
    const spreadAngle = Math.PI / 2.5;

    for (let i = 0; i < beamCount; i++) {
      const angle = centerAngle + (i / (beamCount - 1) - 0.5) * spreadAngle;
      const endX = light.x + Math.cos(angle) * beamLength;
      const endY = light.y + Math.sin(angle) * beamLength;

      const gradient = ctx.createLinearGradient(light.x, light.y, endX, endY);
      gradient.addColorStop(0, light.color);
      gradient.addColorStop(1, "transparent");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(light.x, light.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  };

  const drawCrossDirectional = (
    ctx: CanvasRenderingContext2D,
    light: Light,
    intensity: number,
    time: number,
    baseAngle: number
  ) => {
    const beamLength = (300 + Math.sin(time * 2) * 50) * beamScale;
    const angles = [
      baseAngle + Math.PI / 4,
      baseAngle - Math.PI / 4,
      baseAngle + (3 * Math.PI) / 4,
      baseAngle - (3 * Math.PI) / 4
    ];

    angles.forEach(angle => {
      const endX = light.x + Math.cos(angle) * beamLength;
      const endY = light.y + Math.sin(angle) * beamLength;

      const gradient = ctx.createLinearGradient(light.x, light.y, endX, endY);
      gradient.addColorStop(0, light.color);
      gradient.addColorStop(1, "transparent");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(light.x, light.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    });
  };

  // Mouse interaction
  const getLightIndexFromPosition = (x: number, y: number): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    // Find closest light
    let closestIdx = -1;
    let closestDist = Infinity;

    lights.forEach((light, idx) => {
      const dx = canvasX - light.x;
      const dy = canvasY - light.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 20 && dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });

    return closestIdx >= 0 ? closestIdx : null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enableSelection || !onSelectionChange) return;
    setIsDragging(true);
    const idx = getLightIndexFromPosition(e.clientX, e.clientY);
    if (idx !== null) {
      const newSet = new Set(selectedIndices);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      onSelectionChange(newSet);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enableSelection || !onSelectionChange || !isDragging) return;
    const idx = getLightIndexFromPosition(e.clientX, e.clientY);
    if (idx !== null && !selectedIndices.has(idx)) {
      const newSet = new Set([...selectedIndices, idx]);
      onSelectionChange(newSet);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!enableSelection) return;
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [enableSelection]);

  // Notify parent of active lights
  useEffect(() => {
    if (onActiveLightsChange) {
      const activeLights = lights.map(light => light.active);
      onActiveLightsChange(activeLights);
    }
  }, [lights, onActiveLightsChange]);

  // Determine canvas size based on compact mode
  const canvasWidth = compactMode ? 100 : 400;
  const canvasHeight = compactMode ? 100 : 600;

  return (
    <div className="canvas-grid-wrapper" style={{ width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="canvas-light-grid"
        style={{ cursor: enableSelection ? "crosshair" : "default" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
}
