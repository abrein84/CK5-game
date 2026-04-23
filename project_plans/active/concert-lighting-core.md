# Concert Lighting Game - Core Loop
Status: Active
Last updated: 2026-04-21

## Problem
Need to build the core concert lighting control game where players control lighting patterns and colors for a live Phish-style band performance.

## Design
Players see a stage with 4 band members performing. Behind them is a giant screen displaying lighting patterns. As the music plays (starts slow, builds intensity), players:
- Use **arrow keys** to change lighting patterns (up/down/left/right = different patterns)
- Use **number keys (1-8)** to change colors
- Try to **hit the beat** (visual indicators show when to change)
- **Match color tone** to music intensity (warm colors for mellow, bright/cool for intense)
- **Build preset sequences** that can be triggered with saved combinations

### Scoring Components
1. **Beat Score** - Hit lighting changes on the beat (timing-based)
2. **Tone Match Score** - Color choice matches current music intensity/mood
3. **Sequence Bonus** - Successfully execute a saved preset sequence

### Band Members (left to right)
1. **Keyboard player** - Bald with brown hair on sides, button-down shirt, jeans, triple keyboard C-shape rig
2. **Guitarist** - Red-haired, brown guitar
3. **Bassist** - White-haired, black bass
4. **Drummer** - Blue muumuu with red circles

## Implementation

### Phase 1: Stage & Visual Setup
- Create stage layout component
- Render 4 band members (CSS-styled divs for now)
- Giant screen component with pattern rendering
- Pattern library: horizontal bars, vertical bars, diagonal, radial, pulse, wave, etc.

### Phase 2: Music Generation
- Web Audio API procedural music
- Phish-style jam: guitar leads, funky bass, jazzy keys, steady drums
- 3 intensity levels: mellow start → medium groove → high energy
- BPM increases from ~80 → ~140 over time
- Beat detection/timing markers

### Phase 3: Controls & Interaction
- Arrow key handlers for pattern switching
- Number key handlers (1-8) for color palette
- Visual feedback on keypresses
- Beat timing indicators

### Phase 4: Scoring System
- Beat accuracy tracking (hit within timing window)
- Tone matching algorithm (warm colors = low intensity, bright/cool = high)
- Score display and multipliers
- Combo system for sustained good timing

### Phase 5: Preset Builder
- UI to record a sequence of pattern+color changes
- Save/load presets
- Trigger presets with hotkeys
- Preset library storage (localStorage or CSV)

## Open Questions
- Should patterns animate/transition smoothly or snap instantly?
- How long should the song be? (2-3 minutes for a jam?)
- Should there be multiple "songs" or difficulty levels?
- Visual style for band members - stylized cartoon or more realistic?
