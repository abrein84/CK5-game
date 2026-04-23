import { useEffect, useState } from "react";

interface CrowdArm {
  id: number;
  x: number;
  delay: number;
}

interface WooPopup {
  id: number;
  x: number;
}

interface BeatReactionProps {
  crowdMeter: number;
  crowdMeterRate: number;
  onMilestone?: number; // Trigger Woo! when crossing this threshold
}

export function BeatReaction({ crowdMeter, crowdMeterRate, onMilestone }: BeatReactionProps) {
  const [crowdArms, setCrowdArms] = useState<CrowdArm[]>([]);
  const [wooPopups, setWooPopups] = useState<WooPopup[]>([]);
  const [nextWooId, setNextWooId] = useState(0);
  const [previousMilestone, setPreviousMilestone] = useState(0);

  const [showHands, setShowHands] = useState(false);

  // Generate crowd arms at bottom - spread all the way across
  useEffect(() => {
    // Create 8 hand groups spread across the entire bottom
    const armCount = 8;
    const arms: CrowdArm[] = [];

    for (let i = 0; i < armCount; i++) {
      arms.push({
        id: i,
        x: 2 + (i * (96 / (armCount - 1))), // Spread from 2% to 98%
        delay: 0,
      });
    }

    setCrowdArms(arms);
  }, []);

  // Show hands when crowd is doing well (above 60% meter)
  useEffect(() => {
    if (crowdMeter > 60 && crowdMeterRate > 0) {
      setShowHands(true);

      // Hide after 3 seconds
      const timeout = setTimeout(() => {
        setShowHands(false);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [crowdMeter, crowdMeterRate]);

  // Check for milestone crossings to trigger "Woo!"
  useEffect(() => {
    if (!onMilestone) return;

    const currentMilestone = Math.floor(crowdMeter / onMilestone) * onMilestone;

    if (currentMilestone > previousMilestone && currentMilestone > 0) {
      // Milestone crossed! Trigger Woo!
      const newWoos: WooPopup[] = [];
      const wooCount = 2 + Math.floor(Math.random() * 2); // 2-3 Woos

      for (let i = 0; i < wooCount; i++) {
        newWoos.push({
          id: nextWooId + i,
          x: 20 + Math.random() * 60,
        });
      }

      setWooPopups(prev => [...prev, ...newWoos]);
      setNextWooId(prev => prev + wooCount);

      // Remove after animation
      setTimeout(() => {
        setWooPopups(prev => prev.filter(w => !newWoos.find(nw => nw.id === w.id)));
      }, 2000);

      setPreviousMilestone(currentMilestone);
    }
  }, [crowdMeter, onMilestone, previousMilestone, nextWooId]);

  return (
    <>
      {/* Crowd arms at bottom */}
      <div className="crowd-arms-container">
        {showHands && crowdArms.map((arm) => (
          <img
            key={arm.id}
            src={`${import.meta.env.BASE_URL}sprites/Multiple_hands_in_air-removebg-preview.png`}
            alt="Crowd hands"
            className="crowd-arm raised"
            style={{
              left: `${arm.x}%`,
            }}
          />
        ))}
      </div>

      {/* Woo! popups for milestones */}
      <div className="woo-container">
        {wooPopups.map(woo => (
          <div
            key={woo.id}
            className="crowd-woo"
            style={{
              left: `${woo.x}%`,
            }}
          >
            WOO!
          </div>
        ))}
      </div>
    </>
  );
}
