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
                  height: '140px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                }}
              >
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    border: activeGridIndex === i ? '2px solid #00ff00' : '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                  }}
                  onClick={() => onGridClick?.(i, false)}
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

                {/* Grid controls */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '2px',
                  padding: '2px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  borderRadius: '4px',
                }}>
                  {/* Checkbox for multi-selection */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      onGridClick?.(i, true);
                    }}
                    style={{
                      width: '14px',
                      height: '14px',
                      cursor: 'pointer',
                      accentColor: '#00ff00',
                    }}
                    title="Include in multi-selection"
                  />

                  {/* Arrow controls */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1px',
                    width: '60px',
                  }}>
                    <div></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                        window.dispatchEvent(event);
                      }}
                      style={{
                        fontSize: '10px',
                        padding: '2px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        color: 'white',
                      }}
                      title="Move up"
                    >↑</button>
                    <div></div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
                        window.dispatchEvent(event);
                      }}
                      style={{
                        fontSize: '10px',
                        padding: '2px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        color: 'white',
                      }}
                      title="Move left"
                    >←</button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                        window.dispatchEvent(event);
                      }}
                      style={{
                        fontSize: '10px',
                        padding: '2px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        color: 'white',
                      }}
                      title="Move down"
                    >↓</button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
                        window.dispatchEvent(event);
                      }}
                      style={{
                        fontSize: '10px',
                        padding: '2px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        color: 'white',
                      }}
                      title="Move right"
                    >→</button>
                  </div>

                  {/* Grid label */}
                  <span style={{
                    fontSize: '10px',
                    color: activeGridIndex === i ? '#00ff00' : 'rgba(255,255,255,0.6)',
                    fontWeight: activeGridIndex === i ? 'bold' : 'normal',
                  }}>
                    {i + 1}
                  </span>
                </div>
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
          src={`${import.meta.env.BASE_URL}sprites/band_image-removebg-preview.png`}
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
