import { useEffect, useState } from "react";

interface CelebrationPopupProps {
  show: boolean;
}

export function CelebrationPopup({ show }: CelebrationPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Auto-hide after 3 seconds
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="celebration-popup">
      <div className="celebration-content">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-4xl font-bold mb-2" style={{ color: '#00ff00' }}>
          Nice Job CK5!
        </h2>
        <p className="text-xl" style={{ color: '#ffffff' }}>
          You hit 100%!
        </p>
      </div>
    </div>
  );
}
