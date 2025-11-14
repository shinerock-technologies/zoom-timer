import { useState } from "react";

function AddTimer({
  onAdd,
  initialTitle = "",
  initialMessage = "",
  initialMinutes = 5,
  initialSeconds = 0,
  initialAlerts = [],
  isEditing = false,
}) {
  const [title, setTitle] = useState(initialTitle);
  const [message, setMessage] = useState(initialMessage);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [showMessageInput, setShowMessageInput] = useState(!!initialMessage);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState(
    initialAlerts.length > 0
      ? initialAlerts
      : [
          { percentage: 25, type: "warning", enabled: false },
          { percentage: 10, type: "urgent", enabled: false },
          { percentage: 5, type: "critical", enabled: false },
        ]
  );

  const incrementTime = (unit) => {
    if (unit === "hours") setHours(Math.min(23, hours + 1));
    if (unit === "minutes") setMinutes(Math.min(59, minutes + 1));
    if (unit === "seconds") setSeconds(Math.min(59, seconds + 1));
  };

  const decrementTime = (unit) => {
    if (unit === "hours") setHours(Math.max(0, hours - 1));
    if (unit === "minutes") setMinutes(Math.max(0, minutes - 1));
    if (unit === "seconds") setSeconds(Math.max(0, seconds - 1));
  };

  const setPreset = (mins) => {
    setHours(0);
    setMinutes(mins);
    setSeconds(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds <= 0) {
      alert("Please set a time greater than 0");
      return;
    }

    // Convert percentage-based alerts to time-based alerts
    const enabledAlerts = alerts
      .filter((a) => a.enabled)
      .map((a) => ({
        ...a,
        time: Math.round((a.percentage / 100) * totalSeconds),
      }));

    onAdd(title || "Timer", message, totalSeconds, enabledAlerts);

    setTitle("");
    setMessage("");
    setHours(0);
    setMinutes(5);
    setSeconds(0);
    setShowMessageInput(false);
  };

  return (
    <form className="add-timer-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="timer-title-input"
        placeholder="Timer name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={50}
      />

      <div className="time-picker">
        <div className="time-segment">
          <button
            type="button"
            className="time-arrow"
            onClick={() => incrementTime("hours")}>
            ▲
          </button>
          <input
            type="number"
            className="time-value"
            value={String(hours).padStart(2, "0")}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              setHours(Math.min(23, Math.max(0, val)));
            }}
            onFocus={(e) => e.target.select()}
            min="0"
            max="23"
          />
          <button
            type="button"
            className="time-arrow"
            onClick={() => decrementTime("hours")}>
            ▼
          </button>
          <div className="time-label">hr</div>
        </div>

        <div className="time-separator">:</div>

        <div className="time-segment">
          <button
            type="button"
            className="time-arrow"
            onClick={() => incrementTime("minutes")}>
            ▲
          </button>
          <input
            type="number"
            className="time-value"
            value={String(minutes).padStart(2, "0")}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              setMinutes(Math.min(59, Math.max(0, val)));
            }}
            onFocus={(e) => e.target.select()}
            min="0"
            max="59"
          />
          <button
            type="button"
            className="time-arrow"
            onClick={() => decrementTime("minutes")}>
            ▼
          </button>
          <div className="time-label">min</div>
        </div>

        <div className="time-separator">:</div>

        <div className="time-segment">
          <button
            type="button"
            className="time-arrow"
            onClick={() => incrementTime("seconds")}>
            ▲
          </button>
          <input
            type="number"
            className="time-value"
            value={String(seconds).padStart(2, "0")}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              setSeconds(Math.min(59, Math.max(0, val)));
            }}
            onFocus={(e) => e.target.select()}
            min="0"
            max="59"
          />
          <button
            type="button"
            className="time-arrow"
            onClick={() => decrementTime("seconds")}>
            ▼
          </button>
          <div className="time-label">sec</div>
        </div>
      </div>

      <div className="preset-buttons">
        <button type="button" onClick={() => setPreset(1)}>
          1 min
        </button>
        <button type="button" onClick={() => setPreset(3)}>
          3 min
        </button>
        <button type="button" onClick={() => setPreset(5)}>
          5 min
        </button>
        <button type="button" onClick={() => setPreset(10)}>
          10 min
        </button>
      </div>

      <div className="options-section">
        <div className="alerts-section">
          <div className="alerts-label">Visual Alerts</div>
          <div className="alerts-list">
            {alerts.map((alert, index) => (
              <label key={index} className={`alert-card alert-${alert.type}`}>
                <input
                  type="checkbox"
                  checked={alert.enabled}
                  onChange={(e) => {
                    const newAlerts = [...alerts];
                    newAlerts[index].enabled = e.target.checked;
                    setAlerts(newAlerts);
                  }}
                />
                <div className="alert-card-content">
                  <span className="alert-percentage">{alert.percentage}%</span>
                  <div className="alert-info">
                    <span className="alert-action">
                      {alert.type === "warning"
                        ? "⚠️ Flash yellow"
                        : alert.type === "urgent"
                        ? "🟠 Flash orange"
                        : "🔴 Flash red"}
                    </span>
                    <span className="alert-when">
                      when {alert.percentage}% time left
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <button type="submit" className="start-button">
        {isEditing ? "Update Timer" : "Save"}
      </button>
    </form>
  );
}

export default AddTimer;
