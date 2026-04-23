# Crowd, Energy, and Effects Summary

Status: Reference
Last updated: 2026-04-23

## Energy System

**Location:** `App.tsx` lines 330-353

### Energy Drain
- **Rate:** 0.02% per light per 100ms (= 0.2% per light per second)
- **Difficulty scaling:** Drain increases 25% per level
  - Level 1: 1.0x drain (0.2% per light/sec)
  - Level 2: 1.25x drain (0.25% per light/sec)
  - Level 3: 1.5x drain (0.375% per light/sec)
  - Level 4+: 1.75x drain (0.4375% per light/sec)

### Energy Regeneration
- **Rate:** 0.033% per 100ms = **0.33% per second** = **~20% per minute**
- **Always active:** Regenerates even while lights are on
- **Issue:** With 15 lights on at level 1, drain = 3% per second, regen = 0.33% per second
  - Net drain: **-2.67% per second** → energy depletes in ~37 seconds
  - User perceives regen as "lagging" because it's overwhelmed by drain

### Zero Energy Behavior
- All lights force off when energy hits 0%
- Cannot turn lights back on until energy regenerates above 0%

---

## Crowd Meter System

**Location:** `App.tsx` lines 355-389

### Crowd Gain (Positive)
- **Tone matching:** +0.1% per 100ms (+1% per second) when:
  - Color warmth matches music intensity
  - At least 1 light is active
  - Energy > 0
- **Difficulty scaling:** Gain decreases 15% per level
  - Level 1: 1.0x gain (+1% per second)
  - Level 2: ~0.87x gain (+0.87% per second)
  - Level 3: ~0.77x gain (+0.77% per second)
  - Level 4+: ~0.69x gain (+0.69% per second)

### Crowd Loss (Negative)
- **Boredom penalty:** -0.05% per 100ms (-0.5% per second) when:
  - No changes for 5+ seconds
  - Lights are active
  - Energy > 0

### Beat Bonus
**Location:** `App.tsx` lines 670-682

- **Instant boost:** +3% when color/shape/beam change happens exactly on beat
- **Difficulty scaling:** Bonus decreases 15% per level (same as crowd gain)
  - Level 1: +3%
  - Level 2: +2.61%
  - Level 3: +2.31%
  - Level 4+: +2.07%

---

## Visual Effects

### Glowsticks
**Location:** `Glowsticks.tsx`

**Trigger:** `crowdMeterRate > 0` (crowd increasing)

**Spawn behavior:**
- **Spawn rate:** 150ms to 500ms intervals (faster = better performance)
- **Count scales with rate:**
  - Rate ≥ 20%/sec (beat match): 5-8 glowsticks
  - Rate ≥ 5%/sec: 2-3 glowsticks
  - Rate ≥ 2%/sec: 1-2 glowsticks
  - Rate < 2%/sec: 1-2 glowsticks (50% chance)

**Visual:**
- 6 colors: green, pink, cyan, yellow, orange, purple
- Thrown from bottom, arc upward with physics
- Lifetime: ~3 seconds (200 frames @ 60fps)
- Fade out as they fall

### Crowd Hands
**Location:** `BeatReaction.tsx` lines 46-57

**Trigger:** `crowdMeter > 60%` AND `crowdMeterRate > 0`

**Behavior:**
- 8 hand groups spread across bottom (2% to 98% of screen width)
- Show for 3 seconds, then hide
- Re-triggers when conditions met again

**Visual:**
- Image: `/sprites/Multiple_hands_in_air-removebg-preview.png`
- CSS class: `crowd-arm raised`

### "WOO!" Popups
**Location:** `BeatReaction.tsx` lines 60-87

**Trigger:** Every 25% milestone crossed (25%, 50%, 75%, 100%)

**Behavior:**
- 2-3 "WOO!" text popups appear at random X positions (20-80%)
- Display for 2 seconds
- Only triggers when crossing UP (not on decline)

### Celebration Popup
**Location:** `CelebrationPopup.tsx`

**Trigger:** First time hitting 100% crowd meter

**Behavior:**
- Shows 🎉 emoji + "Nice Job CK5!" message
- Auto-hides after 3 seconds
- Only shows once per song (`hasHit100` flag prevents re-triggering)

---

## Tone Matching Logic

**Location:** `App.tsx` lines 395-418

### Color Warmth Calculation
- Warmth = (R + G×0.5 - B) / 384, normalized to 0-1
- High warmth (0.5-1): Red/yellow colors
- Low warmth (0-0.5): Blue/cyan colors

### Music Intensity Match
- **Low intensity (0-0.4):** Wants warm colors (warmth > 0.5)
- **High intensity (0.6-1.0):** Wants cool/bright colors (warmth < 0.5)
- **Medium intensity (0.4-0.6):** Accepts any color

---

## Current Issues

### Energy Regeneration "Lagging"
**Problem:** Regen (0.33%/sec) cannot keep up with drain from multiple lights (up to 6.5%/sec at level 4 with 15 lights)

**Possible fixes:**
1. Increase passive regen rate (e.g., 1% per second = 60%/min)
2. Add "no lights on" bonus regen (e.g., 2x regen when all lights off)
3. Reduce drain per light
4. Add energy pickups/bonuses for good performance

### Crowd Effect Visibility
**Question:** Are glowsticks/hands/woos appearing as expected?

**Current thresholds:**
- Glowsticks: Any positive crowd change
- Hands: Above 60% crowd + still increasing
- Woos: Every 25% milestone
- Celebration: First 100% hit only

**Potential adjustments:**
- Lower hand threshold (e.g., 40% instead of 60%)
- More frequent woos (every 10-15% instead of 25%)
- Re-triggerable celebration for sustained 100%
