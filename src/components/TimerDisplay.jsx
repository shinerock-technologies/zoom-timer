import { useEffect, useRef, useState } from "react";

/**
 * TimerDisplay - A focused timer display component without action buttons
 *
 * Props:
 * - timer: Timer object with id, title, message, remainingSeconds, totalSeconds, isRunning, alerts
 * - onUpdate: Callback when timer updates
 * - onFinish: Callback when timer finishes
 * - variant: Display style - 'default' | 'minimal' | 'large' (default: 'default')
 * - showProgress: Show progress bar (default: true)
 * - showTotal: Show total time alongside remaining time (default: true)
 *
 * Variants:
 * - 'default': Standard size, good for lists
 * - 'minimal': Compact size, minimal padding
 * - 'large': Large display, perfect for active/featured timers
 */
function TimerDisplay({
  timer,
  onUpdate,
  onFinish,
  variant = "default", // 'default', 'minimal', 'large'
  showProgress = true,
  showTotal = true,
}) {
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const startRemainingRef = useRef(null);
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timer.isRunning && timer.remainingSeconds > 0) {
      // Record the start time and remaining seconds when timer starts/resumes
      startTimeRef.current = Date.now();
      startRemainingRef.current = timer.remainingSeconds;

      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newRemaining = Math.max(0, startRemainingRef.current - elapsed);

        if (newRemaining <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          onFinish(timer.id, timer.title);
        } else if (newRemaining !== timer.remainingSeconds) {
          onUpdate(timer.id, { remainingSeconds: newRemaining });
        }
      }, 100); // Check every 100ms for better accuracy
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    timer.isRunning,
    timer.id,
    timer.title,
    timer.remainingSeconds,
    onUpdate,
    onFinish,
  ]);

  // Check for alerts
  useEffect(() => {
    if (!timer.isRunning || !timer.alerts || timer.alerts.length === 0) {
      setActiveAlert(null);
      return;
    }

    const percentRemaining =
      (timer.remainingSeconds / timer.totalSeconds) * 100;

    // Find the highest priority alert that should be active
    const triggeredAlert = timer.alerts
      .filter((alert) => alert.enabled && percentRemaining <= alert.percentage)
      .sort((a, b) => a.percentage - b.percentage)[0];

    setActiveAlert(triggeredAlert || null);
  }, [
    timer.isRunning,
    timer.remainingSeconds,
    timer.totalSeconds,
    timer.alerts,
  ]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const isFinished = timer.remainingSeconds === 0;

  let alertClass = "";
  if (activeAlert) {
    alertClass = `alert-${activeAlert.type}`;
  }

  const progress =
    timer.totalSeconds > 0
      ? ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) *
        100
      : 0;

  // Variant-specific classes
  const variantClasses = {
    default: "timer-display-default",
    minimal: "timer-display-minimal",
    large: "timer-display-large",
  };

  const displayClass = `timer-display-component ${variantClasses[variant]} ${
    timer.isRunning ? "running" : ""
  } ${isFinished ? "finished" : ""} ${alertClass}`;

  return (
    <div className={displayClass}>
      {showProgress && (
        <div className="timer-progress-bar">
          <div
            className="timer-progress-fill"
            style={{ width: `${progress}%` }}></div>
        </div>
      )}
      <div className="timer-display-content">
        {timer.title && (
          <div className="timer-display-title">{timer.title}</div>
        )}
        {/* Show alert text in place of message when alert is active */}
        {activeAlert ? (
          <div
            className={`timer-display-message alert-message alert-${activeAlert.type}`}>
            {activeAlert.type === "warning" && "⚠️ Time running low"}
            {activeAlert.type === "urgent" && "🔔 Almost done"}
            {activeAlert.type === "critical" && "🚨 Final moments"}
          </div>
        ) : (
          timer.message && (
            <div className="timer-display-message">{timer.message}</div>
          )
        )}
        <div className="timer-display-time-section">
          <div className="timer-display-time">
            {formatTime(timer.remainingSeconds)}
          </div>
          {showTotal && (
            <div className="timer-display-total">
              / {formatTime(timer.totalSeconds)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimerDisplay;
