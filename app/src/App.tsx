import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Stage } from "./components/Stage";
import { ColorWheel } from "./components/ColorWheel";
import { Glowsticks } from "./components/Glowsticks";
import { BeatReaction } from "./components/BeatReaction";
import { LightSelector } from "./components/LightSelector";
import { CelebrationPopup } from "./components/CelebrationPopup";
import { MusicEngine } from "./engine/musicEngine";

const BASE_URL = import.meta.env.BASE_URL;

const SONGS = [
  { name: "The Wedge", file: `${BASE_URL}Songs/phlb13d1_01_The_Wedge.mp3` },
  { name: "Run Like An Antelope", file: `${BASE_URL}Songs/phlb13d1_02_Run_Like_An_Antelope.mp3` },
  { name: "Tube", file: `${BASE_URL}Songs/phlb13d1_03_Tube.mp3` },
  { name: "It's Ice / Kung / It's Ice", file: `${BASE_URL}Songs/phlb13d1_04_Its_Ice__Kung__Its_Ice.mp3` },
  { name: "Piper", file: `${BASE_URL}Songs/phlb13d1_05_Piper.mp3` },
  { name: "Icculus", file: `${BASE_URL}Songs/phlb13d1_06_Icculus.mp3` },
  { name: "Mike's Song / Swept Away / Steep / Weekapaug Groove", file: `${BASE_URL}Songs/phlb13d1_07_Mikes_Song__Swept_Away__Steep__Weekapaug_Groove.mp3` },
  { name: "Light / Party Time", file: `${BASE_URL}Songs/phlb13d1_08_Light__Party_Time.mp3` },
  { name: "Carini / Wolfman's Brother", file: `${BASE_URL}Songs/phlb13d1_09_Carini__Wolfmans_Brother.mp3` },
  { name: "Ghost", file: `${BASE_URL}Songs/phlb13d1_10_Ghost.mp3` },
  { name: "Tweezer", file: `${BASE_URL}Songs/phlb13d1_11_Tweezer.mp3` },
  { name: "You Enjoy Myself", file: `${BASE_URL}Songs/phlb13d1_12_You_Enjoy_Myself.mp3` },
  { name: "No Men In No Man's Land / Auld Lang Syne / Blaze On", file: `${BASE_URL}Songs/phlb13d1_13_No_Men_In_No_Mans_Land__Auld_Lang_Syne__Blaze_On.mp3` },
];

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedSong, setSelectedSong] = useState<typeof SONGS[0] | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [songSelectionScreen, setSongSelectionScreen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentSongNumber, setCurrentSongNumber] = useState(1);
  const [finalCrowdScore, setFinalCrowdScore] = useState(0);
  const [goalAchieved, setGoalAchieved] = useState(false);
  const [color, setColor] = useState("#000000");
  const [beamType, setBeamType] = useState("none"); // none, line, cone, fan, cross
  const [beamDirection, setBeamDirection] = useState("down"); // up, down, left, right
  const [beamMotion, setBeamMotion] = useState("static"); // static, sweep, pulse
  const [beamSpeed, setBeamSpeed] = useState(1); // Speed multiplier for motion (0.1 to 5)
  const [beam, setBeam] = useState("none"); // Combined for backward compatibility
  const [pulseEnabled, setPulseEnabled] = useState(false);
  const [pulseFrequency, setPulseFrequency] = useState(1); // Hz: 0.1 to 10
  const [intensity, setIntensity] = useState(0);
  const [energy, setEnergy] = useState(100); // 0-100
  const [crowdMeter, setCrowdMeter] = useState(0); // 0-100
  const [beatIndicator, setBeatIndicator] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLightsCount, setSelectedLightsCount] = useState(0);
  const [activeLightsCount, setActiveLightsCount] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [activeLights, setActiveLights] = useState<boolean[]>([]);
  // Multi-grid active lights tracking
  const [multiGridActiveLights, setMultiGridActiveLights] = useState<boolean[][]>([[], [], []]);
  // Multi-grid state (level 4+): separate selections for each grid
  const [multiGridSelections, setMultiGridSelections] = useState<Set<number>[]>([
    new Set(),
    new Set(),
    new Set(),
  ]);
  const [lastChangeTime, setLastChangeTime] = useState(Date.now());
  const [targetCrowd] = useState(100); // Goal is always 100%
  const [crowdMeterRate, setCrowdMeterRate] = useState(0); // Rate of change (% per second)
  const [unlockedSongCount, setUnlockedSongCount] = useState(4); // Start with 4 songs
  const [difficultyLevel, setDifficultyLevel] = useState(1); // Difficulty increases each song
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasHit100, setHasHit100] = useState(false);
  const [activeGridIndex, setActiveGridIndex] = useState(0); // For level 4+ multi-grid
  const [selectedGridIndices, setSelectedGridIndices] = useState<Set<number>>(new Set([0])); // Multi-select grids
  const [gridPositions, setGridPositions] = useState([
    { x: 20, y: 50 },    // Grid 0: top-left
    { x: 150, y: 50 },   // Grid 1: top-center
    { x: 280, y: 50 },   // Grid 2: top-right
  ]);
  const previousCrowdMeterRef = useRef(0);
  const forceOffRef = useRef<(() => void) | null>(null);

  // Determine grid configuration based on level
  const getGridConfig = () => {
    if (difficultyLevel === 1) return { rows: 3, cols: 3, count: 9, multiGrid: false };
    if (difficultyLevel === 2) return { rows: 3, cols: 5, count: 15, multiGrid: false };
    if (difficultyLevel === 3) return { rows: 4, cols: 6, count: 24, multiGrid: false };
    // Level 4+: Three movable 3x3 grids
    return { rows: 3, cols: 3, count: 9, multiGrid: true, gridCount: 3 };
  };

  const gridConfig = getGridConfig();
  // Single grid mode callbacks
  const applyColorRef = useRef<((color: string, beam: string) => void) | null>(null);
  const applyBeamRef = useRef<((beam: string) => void) | null>(null);
  const applyPulseRef = useRef<((enabled: boolean, frequency: number) => void) | null>(null);

  // Multi-grid mode callbacks (one set per grid)
  const multiApplyColorRefs = useRef<Array<((color: string, beam: string) => void) | null>>([null, null, null]);
  const multiApplyBeamRefs = useRef<Array<((beam: string) => void) | null>>([null, null, null]);
  const multiApplyPulseRefs = useRef<Array<((enabled: boolean, frequency: number) => void) | null>>([null, null, null]);
  const multiForceOffRefs = useRef<Array<(() => void) | null>>([null, null, null]);

  const musicEngineRef = useRef<MusicEngine | null>(null);

  // ── Viewport management ──────────────────────────────────
  useLayoutEffect(() => {
    const root = document.documentElement;
    let rafId = 0;
    const update = () => {
      const vv = window.visualViewport;
      const w = vv?.width ?? window.innerWidth;
      const h = vv?.height ?? window.innerHeight;
      const maxW = parseFloat(getComputedStyle(root).getPropertyValue("--app-max-width")) || 400;
      const maxH = parseFloat(getComputedStyle(root).getPropertyValue("--app-max-height")) || 800;
      root.style.setProperty("--app-height", `${Math.round(h)}px`);
      root.style.setProperty("--game-width", `${Math.round(Math.min(w, maxW))}px`);
      root.style.setProperty("--game-height", `${Math.min(Math.round(h), maxH)}px`);
    };
    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => { rafId = 0; update(); });
    };
    update();
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
    };
  }, []);

  // ── Initialize music engine ──────────────────────────────
  useEffect(() => {
    if (!gameStarted || !selectedSong) return;

    const engine = new MusicEngine();
    musicEngineRef.current = engine;

    engine.init().then(async () => {
      await engine.loadSong(selectedSong.file);

      engine.onBeat((beat) => {
        setBeatIndicator(true);
        setTimeout(() => setBeatIndicator(false), 150);
      });

      // Detect song ending
      const audio = (engine as any).audio as HTMLAudioElement;
      if (audio) {
        audio.addEventListener('ended', () => {
          // Song finished!
          handleSongEnd();
        });
      }

      engine.start();
    });

    // Update intensity display
    const interval = setInterval(() => {
      if (musicEngineRef.current) {
        setIntensity(musicEngineRef.current.getIntensity());
      }
    }, 100);

    return () => {
      engine.stop();
      clearInterval(interval);
    };
  }, [gameStarted, selectedSong]);

  const handleSongEnd = () => {
    // Save final stats
    setFinalCrowdScore(Math.round(crowdMeter));
    // Goal is achieved if you ever hit 100%, not just ending at 100%
    setGoalAchieved(hasHit100);

    // Stop game and show results
    setGameStarted(false);
    setShowResults(true);
  };

  const handleContinue = () => {
    // Move to next song
    setCurrentSongNumber(prev => prev + 1);
    const newLevel = difficultyLevel + 1;
    setDifficultyLevel(newLevel);

    // Unlock 2 more songs every time you complete a level
    setUnlockedSongCount(prev => Math.min(prev + 2, SONGS.length));

    // Reset selections
    setSelectedIndices(new Set());
    if (newLevel >= 4) {
      // Reset multi-grid state for level 4+
      setMultiGridSelections([new Set(), new Set(), new Set()]);
      setActiveGridIndex(0);
      setSelectedGridIndices(new Set([0]));
      setGridPositions([
        { x: 20, y: 50 },
        { x: 150, y: 50 },
        { x: 280, y: 50 },
      ]);
    }

    setShowResults(false);
    setSongSelectionScreen(true);
    setEnergy(100);
    setCrowdMeter(0);
  };

  const handleRetry = () => {
    // Retry same song - reset selections but keep level
    setShowResults(false);
    setEnergy(100);
    setCrowdMeter(0);
    setSelectedIndices(new Set());
    if (difficultyLevel >= 4) {
      setMultiGridSelections([new Set(), new Set(), new Set()]);
      setActiveGridIndex(0);
      setSelectedGridIndices(new Set([0]));
    }
    setGameStarted(true);
  };

  // ── Update selected lights count when switching grids ───
  useEffect(() => {
    if (gridConfig.multiGrid && activeGridIndex < multiGridSelections.length) {
      setSelectedLightsCount(multiGridSelections[activeGridIndex]?.size || 0);
    }
  }, [activeGridIndex, gridConfig.multiGrid, multiGridSelections]);

  // ── Arrow key controls for multi-grid movement ─────────
  useEffect(() => {
    if (!gameStarted || !gridConfig.multiGrid) return;

    const GRID_SIZE = 100; // Fixed size for each 3x3 grid
    const step = 10; // pixels per keypress

    const checkCollision = (newPos: { x: number; y: number }, checkIndex: number, positions: { x: number; y: number }[]) => {
      for (let i = 0; i < positions.length; i++) {
        if (i === checkIndex) continue; // Don't check against itself
        const other = positions[i];

        // Check if rectangles overlap
        if (
          newPos.x < other.x + GRID_SIZE &&
          newPos.x + GRID_SIZE > other.x &&
          newPos.y < other.y + GRID_SIZE &&
          newPos.y + GRID_SIZE > other.y
        ) {
          return true; // Collision detected
        }
      }
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); // Prevent page scrolling

        setGridPositions(prev => {
          const newPositions = [...prev];

          // Try to move all selected grids
          const proposedPositions = [...prev];
          let canMove = true;

          // Calculate new positions for all selected grids
          selectedGridIndices.forEach(gridIndex => {
            const current = { ...proposedPositions[gridIndex] };

            switch (e.key) {
              case 'ArrowUp':
                current.y = Math.max(0, current.y - step);
                break;
              case 'ArrowDown':
                current.y = Math.min(500, current.y + step);
                break;
              case 'ArrowLeft':
                current.x = Math.max(0, current.x - step);
                break;
              case 'ArrowRight':
                current.x = Math.min(300, current.x + step);
                break;
            }

            proposedPositions[gridIndex] = current;
          });

          // Check for collisions - selected grids shouldn't collide with non-selected grids
          for (let selectedIdx of Array.from(selectedGridIndices)) {
            for (let i = 0; i < proposedPositions.length; i++) {
              if (selectedGridIndices.has(i)) continue; // Skip other selected grids

              const pos1 = proposedPositions[selectedIdx];
              const pos2 = proposedPositions[i];

              if (
                pos1.x < pos2.x + GRID_SIZE &&
                pos1.x + GRID_SIZE > pos2.x &&
                pos1.y < pos2.y + GRID_SIZE &&
                pos1.y + GRID_SIZE > pos2.y
              ) {
                canMove = false;
                break;
              }
            }
            if (!canMove) break;
          }

          return canMove ? proposedPositions : prev;
        });
      }

      // Tab to cycle through grids
      if (e.key === 'Tab' && gridConfig.multiGrid) {
        e.preventDefault();
        const nextIndex = (activeGridIndex + 1) % (gridConfig.gridCount || 3);
        setActiveGridIndex(nextIndex);
        setSelectedGridIndices(new Set([nextIndex]));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gridConfig, activeGridIndex]);

  // ── Energy drain & crowd meter updates ──────────────────
  useEffect(() => {
    if (!gameStarted) return;

    const interval = setInterval(() => {
      setEnergy(prev => {
        // Energy drain increases with difficulty
        const drainMultiplier = 1 + (difficultyLevel - 1) * 0.25;
        const drainRate = activeLightsCount * 0.02 * drainMultiplier;
        let newEnergy = prev - drainRate;

        // Passive energy regeneration (60% per minute = 1% per second = 0.1% per 100ms)
        // 3x bonus when all lights are off (helps recovery)
        const regenRate = activeLightsCount === 0 ? 0.3 : 0.1;
        newEnergy = newEnergy + regenRate;

        newEnergy = Math.max(0, Math.min(100, newEnergy));

        // Force lights off when energy hits zero
        if (newEnergy <= 0) {
          if (gridConfig.multiGrid) {
            // Turn off all grids
            multiForceOffRefs.current.forEach(fn => fn?.());
          } else {
            forceOffRef.current?.();
          }
        }

        return newEnergy;
      });

      // Check tone matching (color warmth vs music intensity)
      const colorWarmth = getColorWarmth(color);
      const isGoodMatch = isToneMatched(colorWarmth, intensity);

      setCrowdMeter(prev => {
        let change = 0;

        // Crowd gain decreases with difficulty
        const gainMultiplier = 1 / (1 + (difficultyLevel - 1) * 0.15);

        if (isGoodMatch && activeLightsCount > 0 && energy > 0) {
          change += 0.05 * gainMultiplier; // Reduced so beat matching is more important
        }

        // Penalty for no changes (boredom)
        const timeSinceChange = Date.now() - lastChangeTime;
        if (timeSinceChange > 5000 && activeLightsCount > 0 && energy > 0) {
          change -= 0.05; // -0.5% per second
        }

        const newValue = Math.max(0, Math.min(100, prev + change));

        // Check if hit 100% for the first time
        if (newValue >= 100 && !hasHit100) {
          setShowCelebration(true);
          setHasHit100(true);
        }

        // Calculate rate of change (convert from per 100ms to per second)
        const rate = (newValue - previousCrowdMeterRef.current) * 10;
        setCrowdMeterRate(rate);
        previousCrowdMeterRef.current = newValue;

        return newValue;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameStarted, activeLightsCount, color, intensity, lastChangeTime, energy, difficultyLevel]);

  // Helper: Get color warmth (0 = cool, 1 = warm)
  const getColorWarmth = (hexColor: string): number => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Warmth = more red/yellow, less blue
    const warmth = (r + g * 0.5 - b) / 384; // Normalize to 0-1
    return Math.max(0, Math.min(1, warmth));
  };

  // Helper: Check if color warmth matches music intensity
  const isToneMatched = (warmth: number, musicIntensity: number): boolean => {
    // Low intensity (0-0.4) wants warm colors (0.5-1)
    // High intensity (0.6-1) wants cool/bright colors (0-0.5)
    if (musicIntensity < 0.4) {
      return warmth > 0.5;
    } else if (musicIntensity > 0.6) {
      return warmth < 0.5;
    }
    return true; // Medium intensity accepts anything
  };

  const dismissWelcome = () => {
    setShowWelcome(false);
    setSongSelectionScreen(true);
  };

  const selectSong = (song: typeof SONGS[0]) => {
    setSelectedSong(song);
    setSongSelectionScreen(false);
  };

  const startGame = async () => {
    setGameStarted(true);
    setHasHit100(false);
    setShowCelebration(false);
  };

  const toggleMute = () => {
    if (musicEngineRef.current) {
      const muted = musicEngineRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  const handleSelectionChange = (indices: Set<number>) => {
    if (gridConfig.multiGrid) {
      // Update only the active grid's selection (the one being edited)
      setMultiGridSelections(prev => {
        const newSelections = [...prev];
        newSelections[activeGridIndex] = indices;
        return newSelections;
      });
      setSelectedLightsCount(indices.size);
    } else {
      setSelectedIndices(indices);
      setSelectedLightsCount(indices.size);
    }
  };

  const handleActiveLightsChange = (lights: boolean[]) => {
    setActiveLights(lights);
    const count = lights.filter(l => l).length;
    setActiveLightsCount(count);
  };

  // Multi-grid version: track each grid's active lights separately
  const handleMultiActiveLightsChange = useCallback((gridIndex: number, lights: boolean[]) => {
    setMultiGridActiveLights(prev => {
      const newLights = [...prev];
      newLights[gridIndex] = lights;
      // Calculate total active lights across all grids
      const totalCount = newLights.reduce((sum, gridLights) =>
        sum + gridLights.filter(l => l).length, 0
      );
      setActiveLightsCount(totalCount);
      return newLights;
    });
  }, []);

  const selectAll = () => {
    const allIndices = Array.from({ length: gridConfig.count }, (_, i) => i);
    if (gridConfig.multiGrid) {
      // Only select all on the active grid (the one being edited)
      setMultiGridSelections(prev => {
        const newSelections = [...prev];
        newSelections[activeGridIndex] = new Set(allIndices);
        return newSelections;
      });
      setSelectedLightsCount(allIndices.length);
    } else {
      setSelectedIndices(new Set(allIndices));
    }
  };

  const deselectAll = () => {
    if (gridConfig.multiGrid) {
      // Only clear selection on the active grid (the one being edited)
      setMultiGridSelections(prev => {
        const newSelections = [...prev];
        newSelections[activeGridIndex] = new Set();
        return newSelections;
      });
      setSelectedLightsCount(0);
    } else {
      setSelectedIndices(new Set());
    }
  };

  const handleForceOff = useCallback((fn: () => void) => {
    forceOffRef.current = fn;
  }, []);

  const handleApplyColor = useCallback((fn: (color: string, beam: string) => void) => {
    applyColorRef.current = fn;
  }, []);

  const handleApplyBeam = useCallback((fn: (beam: string) => void) => {
    applyBeamRef.current = fn;
  }, []);

  const handleApplyPulse = useCallback((fn: (enabled: boolean, frequency: number) => void) => {
    applyPulseRef.current = fn;
  }, []);

  // Multi-grid callback handlers
  const handleMultiApplyColor = useCallback((gridIndex: number, fn: (color: string, beam: string) => void) => {
    multiApplyColorRefs.current[gridIndex] = fn;
  }, []);

  const handleMultiApplyBeam = useCallback((gridIndex: number, fn: (beam: string) => void) => {
    multiApplyBeamRefs.current[gridIndex] = fn;
  }, []);

  const handleMultiApplyPulse = useCallback((gridIndex: number, fn: (enabled: boolean, frequency: number) => void) => {
    multiApplyPulseRefs.current[gridIndex] = fn;
  }, []);

  const handleMultiForceOff = useCallback((gridIndex: number, fn: () => void) => {
    multiForceOffRefs.current[gridIndex] = fn;
  }, []);

  // Handle grid click for multi-selection
  const handleGridClick = (gridIndex: number, ctrlKey: boolean) => {
    if (!gridConfig.multiGrid) return;

    if (ctrlKey) {
      // Ctrl+click: toggle grid in selection
      setSelectedGridIndices(prev => {
        const newSet = new Set(prev);
        if (newSet.has(gridIndex)) {
          newSet.delete(gridIndex);
          // Keep at least one selected
          if (newSet.size === 0) {
            newSet.add(gridIndex);
          }
        } else {
          newSet.add(gridIndex);
        }
        return newSet;
      });
      setActiveGridIndex(gridIndex);
    } else {
      // Regular click: select only this grid
      setSelectedGridIndices(new Set([gridIndex]));
      setActiveGridIndex(gridIndex);
    }
  };

  // Handle clicking on mini-grid in selector (should preserve multi-selection)
  const handleMiniGridClick = (gridIndex: number, ctrlKey: boolean) => {
    if (!gridConfig.multiGrid) return;

    if (ctrlKey) {
      // Ctrl+click on mini-grid: toggle in multi-selection
      handleGridClick(gridIndex, ctrlKey);
    } else {
      // Regular click on mini-grid: just change active for light selection display, preserve multi-selection
      setActiveGridIndex(gridIndex);
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (gridConfig.multiGrid) {
      // Apply to all selected grids
      selectedGridIndices.forEach(gridIndex => {
        multiApplyColorRefs.current[gridIndex]?.(newColor, beam);
      });
    } else {
      applyColorRef.current?.(newColor, beam);
    }
    setLastChangeTime(Date.now());
    checkBeatMatch();
  };

  // Combine beam properties into a single beam value with speed
  const getCombinedBeam = () => {
    if (beamType === 'none') return 'none';
    return `${beamType}-${beamDirection}-${beamMotion}-${beamSpeed}`;
  };

  const handleBeamTypeClick = (newType: string) => {
    setBeamType(newType);
    const combined = newType === 'none' ? 'none' : `${newType}-${beamDirection}-${beamMotion}-${beamSpeed}`;
    setBeam(combined);
    if (gridConfig.multiGrid) {
      selectedGridIndices.forEach(gridIndex => {
        multiApplyBeamRefs.current[gridIndex]?.(combined);
      });
    } else {
      applyBeamRef.current?.(combined);
    }
    setLastChangeTime(Date.now());
    checkBeatMatch();
  };

  const handleBeamDirectionClick = (newDirection: string) => {
    setBeamDirection(newDirection);
    if (beamType === 'none') return;
    const combined = `${beamType}-${newDirection}-${beamMotion}-${beamSpeed}`;
    setBeam(combined);
    if (gridConfig.multiGrid) {
      selectedGridIndices.forEach(gridIndex => {
        multiApplyBeamRefs.current[gridIndex]?.(combined);
      });
    } else {
      applyBeamRef.current?.(combined);
    }
    setLastChangeTime(Date.now());
    checkBeatMatch();
  };

  const handleBeamMotionClick = (newMotion: string) => {
    setBeamMotion(newMotion);
    if (beamType === 'none') return;
    const combined = `${beamType}-${beamDirection}-${newMotion}-${beamSpeed}`;
    setBeam(combined);
    if (gridConfig.multiGrid) {
      selectedGridIndices.forEach(gridIndex => {
        multiApplyBeamRefs.current[gridIndex]?.(combined);
      });
    } else {
      applyBeamRef.current?.(combined);
    }
    setLastChangeTime(Date.now());
    checkBeatMatch();
  };

  const handleBeamSpeedChange = (newSpeed: number) => {
    setBeamSpeed(newSpeed);
    if (beamType === 'none') return;
    const combined = `${beamType}-${beamDirection}-${beamMotion}-${newSpeed}`;
    setBeam(combined);
    if (gridConfig.multiGrid) {
      selectedGridIndices.forEach(gridIndex => {
        multiApplyBeamRefs.current[gridIndex]?.(combined);
      });
    } else {
      applyBeamRef.current?.(combined);
    }
  };

  const checkBeatMatch = () => {
    if (beatIndicator) {
      // Hit on the beat! Bigger bonus, decreases with difficulty
      const beatBonus = 5 / (1 + (difficultyLevel - 1) * 0.15);
      setCrowdMeter(prev => {
        const newValue = Math.min(100, prev + beatBonus);
        // Update rate to show the spike
        setCrowdMeterRate(beatBonus * 10);
        previousCrowdMeterRef.current = newValue;
        return newValue;
      });
    }
  };

  const handlePulseToggle = () => {
    const newEnabled = !pulseEnabled;
    setPulseEnabled(newEnabled);
    if (gridConfig.multiGrid) {
      // Apply to all selected grids
      selectedGridIndices.forEach(gridIndex => {
        multiApplyPulseRefs.current[gridIndex]?.(newEnabled, pulseFrequency);
      });
    } else {
      applyPulseRef.current?.(newEnabled, pulseFrequency);
    }
  };

  const handlePulseFrequencyChange = (newFrequency: number) => {
    setPulseFrequency(newFrequency);
    if (pulseEnabled) {
      if (gridConfig.multiGrid) {
        // Apply to all selected grids
        selectedGridIndices.forEach(gridIndex => {
          multiApplyPulseRefs.current[gridIndex]?.(pulseEnabled, newFrequency);
        });
      } else {
        applyPulseRef.current?.(pulseEnabled, newFrequency);
      }
    }
  };

  // Welcome screen - Trey's intro
  if (showWelcome) {
    return (
      <div className="app-shell relative mx-auto flex w-full flex-col overflow-hidden">
        <div
          className="game-screen flex flex-col items-center justify-center gap-8 p-8"
          style={{
            backgroundImage: `url(${BASE_URL}sprites/welcome%20screen%20background.webp)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <h1 className="text-9xl font-bold text-center mb-8" style={{ color: '#ff1493', textShadow: '4px 4px 12px rgba(0,0,0,1), -2px -2px 4px rgba(0,0,0,0.8)', fontSize: '120px' }}>
            CK5
          </h1>

          <div className="w-full" style={{
            background: 'rgba(0, 0, 0, 0.75)',
            padding: '32px',
            borderRadius: '12px'
          }}>
            <p className="text-xl font-bold leading-relaxed mb-2 text-center" style={{
              color: '#00ffff'
            }}>
              "Hey Chris, really need you to dial it up tonight.
            </p>
            <p className="text-xl font-bold leading-relaxed mb-2 text-center" style={{
              color: '#00ffff'
            }}>
              Also you get to pick the setlist!
            </p>
            <p className="text-xl font-bold leading-relaxed mb-4 text-center" style={{
              color: '#00ffff'
            }}>
              Here are a few songs we practiced, but as we get going we can add more to choose from."
            </p>

            <div className="mb-6 text-center relative">
              <p className="text-xl font-bold italic" style={{
                color: '#00ffff'
              }}>
                — Trey
              </p>
              <img
                src={`${BASE_URL}sprites/Trey-removebg-preview.png`}
                alt="Trey"
                style={{
                  width: '70px',
                  height: '70px',
                  objectFit: 'contain',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(35px, -50%)',
                  pointerEvents: 'none'
                }}
              />
            </div>

            <div className="mb-6 text-center" style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              paddingTop: '24px'
            }}>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: '#a0a0b0' }}>
                Goal
              </p>
              <p className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                Get the crowd to 100%
              </p>
            </div>

            <div className="text-center">
              <button className="ui-cta" onClick={dismissWelcome}>
                Pick the Opener
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Song selection screen
  if (songSelectionScreen) {
    const availableSongs = SONGS.slice(0, unlockedSongCount);

    return (
      <div className="app-shell relative mx-auto flex w-full flex-col overflow-hidden">
        <div className="game-screen flex flex-col items-center justify-start gap-6 p-6" style={{ overflowY: 'auto' }}>
          <div className="mt-6">
            <h1 className="text-2xl font-bold ink-strong text-center">Level {currentSongNumber}</h1>
            <p className="text-sm ink-soft text-center mt-2">
              {currentSongNumber === 1 ? 'Pick the opener' : 'Pick your song'}
            </p>
            <p className="text-xs ink-soft text-center mt-1">
              {availableSongs.length} of {SONGS.length} songs unlocked
            </p>
          </div>

          <div className="w-full max-w-sm flex flex-col gap-2">
            {availableSongs.map((song) => (
              <button
                key={song.file}
                className="ui-button text-left"
                onClick={() => selectSong(song)}
              >
                {song.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Results screen - show after song ends
  if (showResults) {
    return (
      <div className="app-shell relative mx-auto flex w-full flex-col overflow-hidden">
        <div className="game-screen flex flex-col items-center justify-center gap-8 p-6">
          <span className="text-8xl">
            {goalAchieved ? '🎉' : '😐'}
          </span>

          <div className="text-center">
            <p className="text-sm ink-soft uppercase tracking-wide mb-2">Level {currentSongNumber}</p>
            <h1 className="text-3xl font-bold ink-strong">
              {goalAchieved ? 'Complete!' : 'Not Quite...'}
            </h1>
          </div>

          <div className="text-center">
            <p className="text-sm ink-soft uppercase tracking-wide mb-2">Final Score</p>
            <p className={`text-6xl font-bold ${goalAchieved ? 'text-green-600' : 'text-orange-600'}`}>
              {finalCrowdScore}%
            </p>
            <p className="text-sm ink-soft mt-4">
              Goal: {targetCrowd}%
            </p>
          </div>

          <p className="text-sm ink-soft text-center italic max-w-xs">
            {goalAchieved
              ? '"The crowd is absolutely electric! They want more!"'
              : '"Keep at it — they\'re warming up, but not quite there yet."'}
          </p>

          {goalAchieved ? (
            <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
              <button className="ui-cta" onClick={handleContinue}>
                Next Level
              </button>
              <button className="ui-button" onClick={handleRetry}>
                Play Again
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
              <button className="ui-cta" onClick={handleRetry}>
                Retry Level
              </button>
              <button className="ui-button" onClick={() => {
                setShowResults(false);
                setSongSelectionScreen(true);
              }}>
                Choose Different Song
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pre-game screen (song selected, ready to start)
  if (!gameStarted) {
    return (
      <div className="app-shell relative mx-auto flex w-full flex-col overflow-hidden">
        <div className="game-screen flex flex-col items-center justify-center gap-6 p-8">
          <div className="text-center">
            <p className="text-sm ink-soft uppercase tracking-wide mb-2">Level {currentSongNumber}</p>
            <h1 className="text-3xl font-bold ink-strong">Ready to Play</h1>
          </div>
          <p className="text-sm ink-soft text-center max-w-xs">
            Control the concert lighting. Match the beat. Match the vibe.
          </p>
          <div className="ui-panel max-w-xs">
            <p className="text-xs ink-soft text-center mb-2">Now Playing</p>
            <p className="text-base ink-strong text-center font-bold">{selectedSong?.name}</p>
          </div>
          <div className="ui-panel max-w-xs">
            <p className="text-xs ink-soft text-center mb-2">Goal</p>
            <p className="text-2xl ink-strong text-center font-bold">100%</p>
          </div>
          <button className="ui-cta mt-4" onClick={startGame}>
            Start Show
          </button>
          <button className="ui-button" onClick={() => setSongSelectionScreen(true)}>
            Choose Different Song
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell relative mx-auto flex w-full flex-col overflow-hidden">
      <div className="game-screen flex flex-col">
        {/* Glowsticks overlay */}
        <Glowsticks crowdMeterRate={crowdMeterRate} isActive={gameStarted} />

        {/* Crowd reaction overlays */}
        <BeatReaction
          crowdMeter={crowdMeter}
          crowdMeterRate={crowdMeterRate}
          onMilestone={25}
        />

        {/* Celebration popup */}
        <CelebrationPopup show={showCelebration} />

        {/* Target & HUD */}
        <div className="hud">
          <div className="hud-item" style={{ flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span className="hud-label">GOAL: {targetCrowd}%</span>
            <div style={{ fontSize: '20px' }}>
              {crowdMeter < 33 ? '😐' : crowdMeter < 67 ? '🙂' : crowdMeter >= targetCrowd ? '🤩' : '😃'}
            </div>
          </div>
          <div className="hud-item">
            <span className="hud-label">CROWD</span>
            <div className="energy-bar">
              <div className="energy-fill" style={{
                width: `${crowdMeter}%`,
                backgroundColor: crowdMeter < 33 ? '#ff6b35' : crowdMeter < 67 ? '#f7b801' : '#00d9ff'
              }}></div>
            </div>
            <span className="hud-value" style={{ fontSize: '11px', marginTop: '2px' }}>
              {Math.round(crowdMeter)}%
            </span>
          </div>
          <div className="hud-item">
            <span className="hud-label">ENERGY</span>
            <div className="energy-bar">
              <div className="energy-fill" style={{
                width: `${energy}%`,
                backgroundColor: energy < 20 ? '#ff3333' : energy < 50 ? '#ffaa00' : '#00ff88'
              }}></div>
            </div>
            <span className="hud-value" style={{ fontSize: '11px', marginTop: '2px' }}>
              {Math.round(energy)}%
            </span>
          </div>
          <div className="hud-item">
            <span className="hud-label">LIGHTS</span>
            <span className="hud-value">{activeLightsCount}/{gridConfig.multiGrid ? gridConfig.count * (gridConfig.gridCount || 3) : gridConfig.count}</span>
          </div>
          <div
            className={`beat-indicator ${beatIndicator ? 'active' : ''} ${isMuted ? 'muted' : ''}`}
            onClick={toggleMute}
            title={isMuted ? "Unmute music" : "Mute music"}
          >
            {isMuted ? '🔇' : '♪'}
          </div>
          <button
            className="ui-button"
            onClick={handleSongEnd}
            style={{ fontSize: '10px', padding: '4px 8px', marginLeft: '8px' }}
          >
            End Song
          </button>
        </div>

        {/* Stage with band and lights */}
        <div className="stage-wrapper">
          <Stage
            musicIntensity={intensity}
            energyLevel={energy}
            currentBeam={beam}
            selectedIndices={selectedIndices}
            gridConfig={gridConfig}
            activeGridIndex={activeGridIndex}
            selectedGridIndices={selectedGridIndices}
            gridPositions={gridPositions}
            multiGridSelections={multiGridSelections}
            onActiveLightsChange={handleActiveLightsChange}
            onApplyColor={handleApplyColor}
            onApplyBeam={handleApplyBeam}
            onApplyPulse={handleApplyPulse}
            onForceOff={handleForceOff}
            onGridClick={handleGridClick}
            onMultiApplyColor={handleMultiApplyColor}
            onMultiApplyBeam={handleMultiApplyBeam}
            onMultiApplyPulse={handleMultiApplyPulse}
            onMultiForceOff={handleMultiForceOff}
            onMultiActiveLightsChange={handleMultiActiveLightsChange}
          />
        </div>

        {/* Controls */}
        <div className="controls-wrapper-new">
          <div className="color-wheel-section">
            {gridConfig.multiGrid && (
              <div style={{
                fontSize: '9px',
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center',
                marginBottom: '6px',
                lineHeight: '1.3',
              }}>
                Editing: Grid {activeGridIndex + 1} | {selectedGridIndices.size > 1 && `${selectedGridIndices.size} grids selected | `}Ctrl+Click: multi-select | Tab: switch
              </div>
            )}
            <div className="control-label">COLOR</div>
            <ColorWheel currentColor={color} onColorChange={handleColorChange} musicIntensity={intensity} />

            {/* Light selector grid */}
            <LightSelector
              rows={gridConfig.rows}
              cols={gridConfig.cols}
              lights={activeLights}
              selectedIndices={gridConfig.multiGrid ? multiGridSelections[activeGridIndex] : selectedIndices}
              onSelectionChange={handleSelectionChange}
              multiGrid={gridConfig.multiGrid}
              gridCount={gridConfig.gridCount}
              activeGridIndex={activeGridIndex}
              selectedGridIndices={selectedGridIndices}
              onGridChange={setActiveGridIndex}
              onGridClick={handleGridClick}
              onMiniGridClick={handleMiniGridClick}
            />

            {/* Selection controls */}
            <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                className="ui-button"
                onClick={selectAll}
                style={{ fontSize: '10px', padding: '6px 4px' }}
              >
                All ({selectedLightsCount})
              </button>
              <button
                className="ui-button"
                onClick={deselectAll}
                style={{ fontSize: '10px', padding: '6px 4px' }}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="controls-main">
            {/* Beam Type Section */}
            <div className="control-section">
              <div className="control-label">BEAM TYPE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <button
                  className={`pattern-btn ${beamType === 'none' ? 'active' : ''}`}
                  onClick={() => handleBeamTypeClick('none')}
                  style={{ fontSize: '11px' }}
                >
                  NONE
                </button>
                <button
                  className={`pattern-btn ${beamType === 'line' ? 'active' : ''}`}
                  onClick={() => handleBeamTypeClick('line')}
                  style={{ fontSize: '11px' }}
                >
                  LINE
                </button>
                <button
                  className={`pattern-btn ${beamType === 'cone' ? 'active' : ''}`}
                  onClick={() => handleBeamTypeClick('cone')}
                  style={{ fontSize: '11px' }}
                >
                  CONE
                </button>
                <button
                  className={`pattern-btn ${beamType === 'fan' ? 'active' : ''}`}
                  onClick={() => handleBeamTypeClick('fan')}
                  style={{ fontSize: '11px' }}
                >
                  FAN
                </button>
                <button
                  className={`pattern-btn ${beamType === 'cross' ? 'active' : ''}`}
                  onClick={() => handleBeamTypeClick('cross')}
                  style={{ fontSize: '20px', gridColumn: 'span 2' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Beam Direction Section */}
            <div className="control-section">
              <div className="control-label">DIRECTION</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                <button
                  className={`pattern-btn ${beamDirection === 'up' ? 'active' : ''}`}
                  onClick={() => handleBeamDirectionClick('up')}
                  style={{ fontSize: '20px' }}
                  disabled={beamType === 'none'}
                >
                  ↑
                </button>
                <button
                  className={`pattern-btn ${beamDirection === 'down' ? 'active' : ''}`}
                  onClick={() => handleBeamDirectionClick('down')}
                  style={{ fontSize: '20px' }}
                  disabled={beamType === 'none'}
                >
                  ↓
                </button>
                <button
                  className={`pattern-btn ${beamDirection === 'left' ? 'active' : ''}`}
                  onClick={() => handleBeamDirectionClick('left')}
                  style={{ fontSize: '20px' }}
                  disabled={beamType === 'none'}
                >
                  ←
                </button>
                <button
                  className={`pattern-btn ${beamDirection === 'right' ? 'active' : ''}`}
                  onClick={() => handleBeamDirectionClick('right')}
                  style={{ fontSize: '20px' }}
                  disabled={beamType === 'none'}
                >
                  →
                </button>
              </div>
            </div>

            {/* Beam Motion Section */}
            <div className="control-section">
              <div className="control-label">MOTION</div>
              <button
                className={`pattern-btn ${beamMotion !== 'static' ? 'active' : ''}`}
                onClick={() => {
                  const newMotion = beamMotion === 'static' ? 'sweep' : 'static';
                  handleBeamMotionClick(newMotion);
                }}
                style={{ marginBottom: '6px', fontSize: '11px' }}
                disabled={beamType === 'none'}
              >
                {beamMotion !== 'static' ? 'ON' : 'OFF'}
              </button>
              <div className="slider-container">
                <label className="slider-label">Speed: {beamSpeed.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={beamSpeed}
                  onChange={(e) => handleBeamSpeedChange(parseFloat(e.target.value))}
                  className="pulse-slider"
                  disabled={beamType === 'none' || beamMotion === 'static'}
                />
              </div>
            </div>

            {/* Pulse Section */}
            <div className="control-section">
              <div className="control-label">PULSE</div>
              <button
                className={`pattern-btn ${pulseEnabled ? 'active' : ''}`}
                onClick={handlePulseToggle}
                style={{ marginBottom: '6px', fontSize: '11px' }}
              >
                {pulseEnabled ? 'ON' : 'OFF'}
              </button>
              <div className="slider-container">
                <label className="slider-label">{pulseFrequency.toFixed(1)} Hz</label>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={pulseFrequency}
                  onChange={(e) => handlePulseFrequencyChange(parseFloat(e.target.value))}
                  className="pulse-slider"
                />
              </div>
            </div>

            {/* Off Button */}
            <button
              className="pattern-btn off-btn"
              onClick={() => {
                if (gridConfig.multiGrid) {
                  selectedGridIndices.forEach(gridIndex => {
                    multiForceOffRefs.current[gridIndex]?.();
                  });
                } else {
                  forceOffRef.current?.();
                }
              }}
              style={{ fontSize: '11px' }}
            >
              OFF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
