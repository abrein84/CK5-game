import { useRef, useEffect, useState } from "react";

interface Light {
  x: number;
  y: number;
  active: boolean;
}

interface LightSelectorProps {
  rows: number;
  cols: number;
  lights: boolean[]; // Which lights are active
  selectedIndices: Set<number>;
  onSelectionChange: (indices: Set<number>) => void;
  multiGrid?: boolean;
  gridCount?: number;
  activeGridIndex?: number;
  selectedGridIndices?: Set<number>;
  onGridChange?: (index: number) => void;
  onGridClick?: (gridIndex: number, ctrlKey: boolean) => void;
  onMiniGridClick?: (gridIndex: number, ctrlKey: boolean) => void;
}

export function LightSelector({
  rows,
  cols,
  lights,
  selectedIndices,
  onSelectionChange,
  multiGrid = false,
  gridCount = 1,
  activeGridIndex = 0,
  selectedGridIndices,
  onGridChange,
  onGridClick,
  onMiniGridClick,
}: LightSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (multiGrid) {
      // Draw multiple grids
      for (let gridIdx = 0; gridIdx < gridCount; gridIdx++) {
        const canvas = canvasRefs.current[gridIdx];
        if (!canvas) continue;

        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        const cellWidth = canvas.width / cols;
        const cellHeight = canvas.height / rows;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const isGridSelected = selectedGridIndices?.has(gridIdx) || false;

        // Draw grid cells
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const x = c * cellWidth;
            const y = r * cellHeight;

            const isSelected = isGridSelected && selectedIndices.has(idx);
            const isActive = lights[idx];

            // Cell background
            ctx.fillStyle = isActive
              ? "rgba(100, 200, 255, 0.3)"
              : "rgba(50, 50, 50, 0.8)";
            ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);

            // Selection indicator (only for selected grids)
            if (isSelected) {
              ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
              ctx.lineWidth = 2;
              ctx.strokeRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
            }

            // Grid lines
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellWidth, cellHeight);
          }
        }
      }
    } else {
      // Single grid mode (original behavior)
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const x = c * cellWidth;
          const y = r * cellHeight;

          const isSelected = selectedIndices.has(idx);
          const isActive = lights[idx];

          // Cell background
          ctx.fillStyle = isActive
            ? "rgba(100, 200, 255, 0.3)"
            : "rgba(50, 50, 50, 0.8)";
          ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);

          // Selection indicator
          if (isSelected) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
          }

          // Grid lines
          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellWidth, cellHeight);
        }
      }
    }
  }, [rows, cols, lights, selectedIndices, multiGrid, gridCount, activeGridIndex, selectedGridIndices]);

  const getLightIndexFromPosition = (x: number, y: number, canvas: HTMLCanvasElement | null = null): number | null => {
    const targetCanvas = canvas || canvasRef.current;
    if (!targetCanvas) return null;

    const rect = targetCanvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    const cellWidth = targetCanvas.width / cols;
    const cellHeight = targetCanvas.height / rows;

    const col = Math.floor(canvasX / cellWidth);
    const row = Math.floor(canvasY / cellHeight);

    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      return row * cols + col;
    }

    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>, gridIndex?: number) => {
    setIsDragging(true);
    const targetCanvas = gridIndex !== undefined ? canvasRefs.current[gridIndex] : canvasRef.current;
    const idx = getLightIndexFromPosition(e.clientX, e.clientY, targetCanvas);
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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>, gridIndex?: number) => {
    if (isDragging) {
      const targetCanvas = gridIndex !== undefined ? canvasRefs.current[gridIndex] : canvasRef.current;
      const idx = getLightIndexFromPosition(e.clientX, e.clientY, targetCanvas);
      if (idx !== null && !selectedIndices.has(idx)) {
        const newSet = new Set(selectedIndices);
        newSet.add(idx);
        onSelectionChange(newSet);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  if (multiGrid) {
    return (
      <div style={{ marginTop: "8px", display: "flex", gap: "8px", justifyContent: "center", paddingBottom: "20px" }}>
        {Array.from({ length: gridCount }).map((_, i) => {
          const isSelected = selectedGridIndices?.has(i) || false;
          return (
            <div key={i} style={{ position: "relative" }}>
              <canvas
                ref={el => canvasRefs.current[i] = el}
                width={40}
                height={40}
                style={{
                  cursor: "crosshair",
                  border: isSelected ? "3px solid #00ff00" : "2px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "4px",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  boxShadow: isSelected ? "0 0 8px rgba(0, 255, 0, 0.5)" : "none",
                }}
                onClick={(e) => onMiniGridClick?.(i, e.ctrlKey || e.metaKey)}
                onMouseDown={(e) => {
                  if (!e.ctrlKey && !e.metaKey) {
                    onGridChange?.(i);
                  }
                  handleMouseDown(e, i);
                }}
                onMouseMove={(e) => handleMouseMove(e, i)}
              />
              <div style={{
                position: "absolute",
                bottom: "-18px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "10px",
                fontWeight: isSelected ? "bold" : "normal",
                color: isSelected ? "#00ff00" : "rgba(255, 255, 255, 0.6)",
              }}>
                Grid {i + 1}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={72}
      style={{
        cursor: "crosshair",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "4px",
        marginTop: "8px",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    />
  );
}
