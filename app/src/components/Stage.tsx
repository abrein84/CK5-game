import { CanvasLightGrid } from "./CanvasLightGrid";

interface GridConfig {
  rows: number;
  cols: number;
  count: number;
  multiGrid: boolean;
  gridCount?: number;
}

interface GridPosition {
  x: number;
  y: number;
}

interface StageProps {
  musicIntensity: number;
  energyLevel: number;
  currentBeam: string;
  selectedIndices: Set<number>;
  gridConfig: GridConfig;
  activeGridIndex: number;
  selectedGridIndices?: Set<number>;
  gridPositions: GridPosition[];
  multiGridSelections?: Set<number>[];
  onActiveLightsChange?: (activeLights: boolean[]) => void;
  onApplyColor?: (applyFn: (color: string, beam: string) => void) => void;
  onApplyBeam?: (applyFn: (beam: string) => void) => void;
  onApplyPulse?: (applyFn: (enabled: boolean, frequency: number) => void) => void;
  onForceOff?: (forceFn: () => void) => void;
  onGridClick?: (gridIndex: number, ctrlKey: boolean) => void;
  // Multi-grid callbacks
  onMultiApplyColor?: (gridIndex: number, applyFn: (color: string, beam: string) => void) => void;
  onMultiApplyBeam?: (gridIndex: number, applyFn: (beam: string) => void) => void;
  onMultiApplyPulse?: (gridIndex: number, applyFn: (enabled: boolean, frequency: number) => void) => void;
  onMultiForceOff?: (gridIndex: number, forceFn: () => void) => void;
  onMultiActiveLightsChange?: (gridIndex: number, activeLights: boolean[]) => void;
}

export function Stage({
  musicIntensity,
  energyLevel,
  currentBeam,
  selectedIndices,
  gridConfig,
  activeGridIndex,
  selectedGridIndices,
  gridPositions,
  multiGridSelections,
  onActiveLightsChange,
  onApplyColor,
  onApplyBeam,
  onApplyPulse,
  onForceOff,
  onGridClick,
  onMultiApplyColor,
  onMultiApplyBeam,
  onMultiApplyPulse,
  onMultiForceOff,
  onMultiActiveLightsChange,
}: StageProps) {
  // For multi-grid: get selected indices for each grid independently
  const getSelectedIndicesForGrid = (gridIndex: number) => {
    if (!gridConfig.multiGrid) return selectedIndices;
    return multiGridSelections?.[gridIndex] || new Set<number>();
  };

  const isGridSelected = (gridIndex: number) => {
    return selectedGridIndices?.has(gridIndex) || false;
  };

  return (
    <div className="stage-container">
      {/* Canvas light grid(s) behind the band */}
      <div className="canvas-light-wrapper">
        {gridConfig.multiGrid ? (
          // Level 4+: Render 3 movable grids
          Array.from({ length: gridConfig.gridCount || 3 }).map((_, i) => {
            const isSelected = isGridSelected(i);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${gridPositions[i].x}px`,
                  top: `${gridPositions[i].y}px`,
                  width: '100px',
                  height: '100px',
                  border: 'none',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
                onClick={(e) => onGridClick?.(i, e.ctrlKey || e.metaKey)}
              >
                <CanvasLightGrid
                  rows={gridConfig.rows}
                  cols={gridConfig.cols}
                  musicIntensity={musicIntensity}
                  energyLevel={energyLevel}
                  currentBeam={currentBeam}
                  selectedIndices={getSelectedIndicesForGrid(i)}
                  onActiveLightsChange={(lights) => onMultiActiveLightsChange?.(i, lights)}
                  onApplyColor={(fn) => onMultiApplyColor?.(i, fn)}
                  onApplyBeam={(fn) => onMultiApplyBeam?.(i, fn)}
                  onApplyPulse={(fn) => onMultiApplyPulse?.(i, fn)}
                  onForceOff={(fn) => onMultiForceOff?.(i, fn)}
                  enableSelection={false}
                  compactMode={true}
                />
              </div>
            );
          })
        ) : (
          // Levels 1-3: Single grid fills entire stage
          <CanvasLightGrid
            rows={gridConfig.rows}
            cols={gridConfig.cols}
            musicIntensity={musicIntensity}
            energyLevel={energyLevel}
            currentBeam={currentBeam}
            selectedIndices={selectedIndices}
            onActiveLightsChange={onActiveLightsChange}
            onApplyColor={onApplyColor}
            onApplyBeam={onApplyBeam}
            onApplyPulse={onApplyPulse}
            onForceOff={onForceOff}
            enableSelection={false}
          />
        )}
      </div>

      {/* Band image with background removed */}
      <div className="band-lineup">
        <img
          src="/sprites/band_image-removebg-preview.png"
          alt="Band performing on stage"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'bottom center',
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );
}
