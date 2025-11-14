import { useEffect, useRef, useState } from "react";

function Timer({
  timer,
  onUpdate,
  onDelete,
  onFinish,
  onEdit,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging = false,
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
  }, [timer.isRunning, timer.id, timer.title, onUpdate, onFinish]);

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

  const handleStart = () => {
    if (timer.remainingSeconds > 0) {
      // Starting this timer will stop all others (handled in updateTimer)
      onUpdate(timer.id, { isRunning: true });
    }
  };

  const handlePause = () => {
    onUpdate(timer.id, { isRunning: false });
  };

  const handleReset = () => {
    onUpdate(timer.id, {
      remainingSeconds: timer.totalSeconds,
      isRunning: false,
    });
  };

  const isFinished = timer.remainingSeconds === 0;

  let alertClass = "";
  if (activeAlert) {
    alertClass = `alert-${activeAlert.type}`;
  }

  const cardClass = `timer-card ${timer.isRunning ? "running" : ""} ${
    isFinished ? "finished" : ""
  } ${alertClass} ${isDragging ? "dragging" : ""}`;

  const progress =
    timer.totalSeconds > 0
      ? ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) *
        100
      : 0;

  return (
    <div
      className={cardClass}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}>
      <div className="timer-progress-bar">
        <div
          className="timer-progress-fill"
          style={{ width: `${progress}%` }}></div>
      </div>
      <div className="timer-content">
        {draggable && (
          <div className="drag-handle" title="Drag to reorder">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 4h12v1H2V4zm0 3.5h12v1H2v-1zM2 11h12v1H2v-1z" />
            </svg>
          </div>
        )}
        <div className="timer-left">
          {timer.title && <div className="timer-title">{timer.title}</div>}
          <div className="timer-display">
            <span className="timer-time-display">
              {formatTime(timer.remainingSeconds)}
            </span>
            <span className="timer-total">
              / {formatTime(timer.totalSeconds)}
            </span>
          </div>
        </div>
        <div className="timer-actions">
          <button
            className="icon-btn settings-btn"
            onClick={() => onEdit && onEdit(timer.id)}
            title="Edit timer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
            </svg>
          </button>
          {timer.isRunning ? (
            <button
              className="icon-btn pause-icon"
              onClick={handlePause}
              title="Pause">
              ⏸
            </button>
          ) : (
            <button
              className="icon-btn play-icon"
              onClick={handleStart}
              disabled={isFinished}
              title="Start">
              ▶
            </button>
          )}
          <button
            className="icon-btn delete-icon"
            onClick={() => onDelete(timer.id)}
            title="Delete">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default Timer;
