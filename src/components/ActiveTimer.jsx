import { useState } from "react";
import TimerDisplay from "./TimerDisplay";

function ActiveTimer({
  activeTimer,
  activeTimerIndex,
  timersLength,
  hasRunningTimer,
  onUpdate,
  onFinish,
  onGoToPrevious,
  onGoToNext,
  onTogglePlayPause,
  onAdd30Seconds,
  onSubtract30Seconds,
}) {
  const [variant, setVariant] = useState("large");

  if (!activeTimer) return null;

  const variants = ["large", "default", "minimal"];
  const variantLabels = {
    large: "Large",
    default: "Default",
    minimal: "Minimal",
  };

  const cycleVariant = () => {
    const currentIndex = variants.indexOf(variant);
    const nextIndex = (currentIndex + 1) % variants.length;
    setVariant(variants[nextIndex]);
  };

  return (
    <div className="active-timer-section">
      <div className="active-timer-header">
        <button
          className="variant-toggle-btn"
          onClick={cycleVariant}
          title="Change display style">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z" />
          </svg>
          <span>{variantLabels[variant]}</span>
        </button>
      </div>
      <TimerDisplay
        key={activeTimer.id}
        timer={activeTimer}
        onUpdate={onUpdate}
        onFinish={onFinish}
        variant={variant}
        showProgress={true}
        showTotal={true}
      />
      <div className="master-controls">
        <button
          className="master-control-btn"
          onClick={onGoToPrevious}
          disabled={activeTimerIndex <= 0}
          title="Previous timer">
          ⏮
        </button>
        <button
          className="master-control-btn subtract-time-btn"
          onClick={onSubtract30Seconds}
          disabled={!activeTimer}
          title="Subtract 30 seconds">
          -30
        </button>
        <button
          className="master-control-btn play-pause-btn"
          onClick={onTogglePlayPause}
          disabled={!activeTimer}
          title={hasRunningTimer ? "Pause" : "Play"}>
          {hasRunningTimer ? "⏸" : "▶"}
        </button>
        <button
          className="master-control-btn add-time-btn"
          onClick={onAdd30Seconds}
          disabled={!activeTimer}
          title="Add 30 seconds">
          +30
        </button>
        <button
          className="master-control-btn"
          onClick={onGoToNext}
          disabled={activeTimerIndex >= timersLength - 1}
          title="Next timer">
          ⏭
        </button>
      </div>
    </div>
  );
}

export default ActiveTimer;
