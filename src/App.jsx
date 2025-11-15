import { useState, useEffect, useRef } from "react";
import zoomSdk from "@zoom/appssdk";
import Timer from "./components/Timer";
import AddTimer from "./components/AddTimer";
import AIPromptModal from "./components/AIPromptModal";
import { generateUUID } from "./utils/uuid";
import { generateTimerRoom, editRoomWithAI } from "./services/openai";
import "./App.css";

function App() {
  const [timers, setTimers] = useState([]);
  const [zoomReady, setZoomReady] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("Starting...");
  const [showModal, setShowModal] = useState(false);
  const [editingTimer, setEditingTimer] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [roomName, setRoomName] = useState("My Timer Room");
  const [roomId, setRoomId] = useState(() => generateUUID());
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [savedRooms, setSavedRooms] = useState([]);
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [editedRoomName, setEditedRoomName] = useState("");
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showAIRoomModal, setShowAIRoomModal] = useState(false);
  const [showAITimerModal, setShowAITimerModal] = useState(false);
  const [undoState, setUndoState] = useState(null);
  const [showUndoNotification, setShowUndoNotification] = useState(false);
  const roomPickerRef = useRef(null);
  const roomNameInputRef = useRef(null);
  const newRoomInputRef = useRef(null);
  const aiMenuRef = useRef(null);
  const templatesMenuRef = useRef(null);
  const [canvasEnabled, setCanvasEnabled] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [renderingContext, setRenderingContext] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      let shouldSetInteracted = false;

      const savedTimers = localStorage.getItem("timerRoom");

      if (savedTimers) {
        try {
          const {
            timers: loadedTimers,
            roomName: loadedRoomName,
            roomId: loadedRoomId,
          } = JSON.parse(savedTimers);

          if (
            loadedTimers &&
            Array.isArray(loadedTimers) &&
            loadedTimers.length > 0
          ) {
            setTimers(loadedTimers);
            shouldSetInteracted = true;
          }
          if (loadedRoomName) {
            setRoomName(loadedRoomName);
          }
          if (loadedRoomId) {
            setRoomId(loadedRoomId);
          }
        } catch (err) {
          console.error("Error parsing saved timers:", err);
        }
      }

      // Load saved rooms list
      const roomsList = localStorage.getItem("savedRooms");

      if (roomsList) {
        try {
          const rooms = JSON.parse(roomsList);
          setSavedRooms(rooms);
          if (rooms.length > 0) {
            shouldSetInteracted = true;
          }
        } catch (err) {
          console.error("Error parsing saved rooms:", err);
        }
      }

      // Check if user has interacted before
      const interacted = localStorage.getItem("hasInteracted");

      // Set hasInteracted if flag exists OR if we found saved data
      if (interacted === "true" || shouldSetInteracted) {
        setHasInteracted(true);
        // Save the flag if it wasn't set before
        if (interacted !== "true") {
          localStorage.setItem("hasInteracted", "true");
        }
      }
    } catch (err) {
      console.error("Error accessing localStorage:", err);
    }
  }, []);

  // Save current room to localStorage and update saved rooms list
  useEffect(() => {
    if (timers.length > 0) {
      const currentRoom = {
        timers,
        roomName,
        roomId,
        timestamp: Date.now(),
      };
      localStorage.setItem("timerRoom", JSON.stringify(currentRoom));

      // Update saved rooms list in localStorage
      const roomsList = localStorage.getItem("savedRooms");
      let existingRooms = [];

      if (roomsList) {
        try {
          existingRooms = JSON.parse(roomsList);
        } catch (err) {
          console.error("Error parsing saved rooms:", err);
        }
      }

      const existingIndex = existingRooms.findIndex(
        (room) => room.roomId === roomId
      );

      let updatedRooms;
      if (existingIndex >= 0) {
        // Update existing room
        updatedRooms = [...existingRooms];
        updatedRooms[existingIndex] = currentRoom;
      } else {
        // Add new room
        updatedRooms = [...existingRooms, currentRoom];
      }

      localStorage.setItem("savedRooms", JSON.stringify(updatedRooms));

      // Only update state if the list actually changed
      setSavedRooms(updatedRooms);
    } else if (timers.length === 0) {
      // When all timers are deleted, remove the current room from saved rooms
      const roomsList = localStorage.getItem("savedRooms");
      if (roomsList) {
        try {
          const existingRooms = JSON.parse(roomsList);
          const updatedRooms = existingRooms.filter(
            (room) => room.roomId !== roomId
          );
          localStorage.setItem("savedRooms", JSON.stringify(updatedRooms));
          setSavedRooms(updatedRooms);
        } catch (err) {
          console.error("Error updating saved rooms:", err);
        }
      }
      // Clear current room from localStorage
      localStorage.removeItem("timerRoom");
    }
  }, [timers, roomName, roomId]);

  // Close room picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        roomPickerRef.current &&
        !roomPickerRef.current.contains(event.target)
      ) {
        setShowRoomPicker(false);
      }
    };

    if (showRoomPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRoomPicker]);

  // Close AI menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target)) {
        setShowAIMenu(false);
      }
    };

    if (showAIMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAIMenu]);

  // Close templates menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        templatesMenuRef.current &&
        !templatesMenuRef.current.contains(event.target)
      ) {
        setShowTemplates(false);
      }
    };

    if (showTemplates) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTemplates]);

  // Handle keyboard shortcuts for room name editing
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isEditingRoomName) {
        if (event.key === "Enter") {
          saveRoomName();
        } else if (event.key === "Escape") {
          cancelEditingRoomName();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditingRoomName, editedRoomName, roomName, savedRooms]);

  // Handle keyboard shortcuts for new room modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (showNewRoomModal) {
        if (event.key === "Enter") {
          createNewRoom();
        } else if (event.key === "Escape") {
          cancelNewRoom();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNewRoomModal, newRoomName, savedRooms]);

  // Focus new room input when modal opens
  useEffect(() => {
    if (showNewRoomModal) {
      setTimeout(() => {
        newRoomInputRef.current?.focus();
      }, 0);
    }
  }, [showNewRoomModal]);

  const templates = {
    pomodoro: {
      name: "Pomodoro",
      icon: "🍅",
      timers: [
        { title: "Focus Session", message: "Deep work time", seconds: 1500 },
        { title: "Short Break", message: "Rest and recharge", seconds: 300 },
        { title: "Focus Session", message: "Deep work time", seconds: 1500 },
        { title: "Short Break", message: "Rest and recharge", seconds: 300 },
        { title: "Long Break", message: "Extended rest", seconds: 900 },
      ],
    },
    workout: {
      name: "Workout",
      icon: "💪",
      timers: [
        { title: "Warm Up", message: "Light cardio", seconds: 300 },
        { title: "Exercise Set", message: "High intensity", seconds: 600 },
        { title: "Rest", message: "Recovery time", seconds: 120 },
        { title: "Exercise Set", message: "High intensity", seconds: 600 },
        { title: "Cool Down", message: "Stretching", seconds: 300 },
      ],
    },
    tabata: {
      name: "Tabata",
      icon: "⚡",
      timers: [
        { title: "Work", message: "Max effort", seconds: 20 },
        { title: "Rest", message: "Recover", seconds: 10 },
        { title: "Work", message: "Max effort", seconds: 20 },
        { title: "Rest", message: "Recover", seconds: 10 },
        { title: "Work", message: "Max effort", seconds: 20 },
      ],
    },
    standup: {
      name: "Daily Standup",
      icon: "☕",
      timers: [
        { title: "Team Member 1", message: "Updates", seconds: 120 },
        { title: "Team Member 2", message: "Updates", seconds: 120 },
        { title: "Team Member 3", message: "Updates", seconds: 120 },
        {
          title: "Blockers Discussion",
          message: "Address issues",
          seconds: 300,
        },
      ],
    },
    boardMeeting: {
      name: "Board Meeting",
      icon: "📊",
      timers: [
        {
          title: "Opening Remarks",
          message: "Welcome and introductions",
          seconds: 300,
        },
        {
          title: "Financial Review",
          message: "Q3 financial report",
          seconds: 900,
        },
        {
          title: "Strategy Discussion",
          message: "2024 roadmap planning",
          seconds: 1200,
        },
        { title: "Q&A Session", message: "Open questions", seconds: 600 },
        {
          title: "Closing",
          message: "Action items and next steps",
          seconds: 300,
        },
      ],
    },
    presentation: {
      name: "Presentation",
      icon: "🎤",
      timers: [
        { title: "Introduction", message: "Speaker intro", seconds: 180 },
        { title: "Main Content", message: "Core presentation", seconds: 1200 },
        { title: "Demo", message: "Live demonstration", seconds: 600 },
        { title: "Q&A", message: "Questions from audience", seconds: 600 },
      ],
    },
    workshop: {
      name: "Workshop",
      icon: "🛠️",
      timers: [
        { title: "Icebreaker", message: "Team introductions", seconds: 300 },
        { title: "Activity 1", message: "Group exercise", seconds: 900 },
        { title: "Break", message: "Coffee break", seconds: 600 },
        { title: "Activity 2", message: "Hands-on practice", seconds: 1200 },
        { title: "Wrap-up", message: "Summary and feedback", seconds: 300 },
      ],
    },
    testing: {
      name: "Testing Room",
      icon: "🧪",
      timers: [
        {
          title: "Quick Test",
          message: "10 second test",
          seconds: 10,
          alerts: [
            { percentage: 25, type: "warning", enabled: true },
            { percentage: 10, type: "urgent", enabled: true },
            { percentage: 5, type: "critical", enabled: true },
          ],
        },
        {
          title: "Medium Test",
          message: "20 second test",
          seconds: 20,
          alerts: [
            { percentage: 25, type: "warning", enabled: true },
            { percentage: 10, type: "urgent", enabled: true },
            { percentage: 5, type: "critical", enabled: true },
          ],
        },
        {
          title: "Long Test",
          message: "30 second test",
          seconds: 30,
          alerts: [
            { percentage: 25, type: "warning", enabled: true },
            { percentage: 10, type: "urgent", enabled: true },
            { percentage: 5, type: "critical", enabled: true },
          ],
        },
      ],
    },
  };

  const loadTemplate = (templateKey) => {
    const template = templates[templateKey];
    if (template) {
      const newTimers = template.timers.map((t) => ({
        id: generateUUID(),
        title: t.title,
        message: t.message,
        totalSeconds: t.seconds,
        remainingSeconds: t.seconds,
        isRunning: false,
        notificationsEnabled: true,
        alerts: t.alerts || [],
        triggeredAlerts: [],
      }));
      setTimers(newTimers);
      setRoomName(template.name);
      setRoomId(generateUUID());
      setShowTemplates(false);
      setHasInteracted(true);
      localStorage.setItem("hasInteracted", "true");
    }
  };

  const loadSavedRoom = (room) => {
    setTimers(room.timers);
    setRoomName(room.roomName);
    setRoomId(room.roomId || generateUUID()); // Fallback for old rooms without UUID
    setShowRoomPicker(false);
  };

  const deleteSavedRoom = (roomToDelete) => {
    const updatedRooms = savedRooms.filter(
      (room) => room.roomId !== roomToDelete.roomId
    );
    setSavedRooms(updatedRooms);
    localStorage.setItem("savedRooms", JSON.stringify(updatedRooms));

    // If deleting the current room, reset to empty state
    if (roomToDelete.roomId === roomId) {
      setTimers([]);
      setRoomName("My Timer Room");
      setRoomId(generateUUID());
      localStorage.removeItem("timerRoom");
    }
  };

  const startEditingRoomName = () => {
    setEditedRoomName(roomName);
    setIsEditingRoomName(true);
    setShowRoomPicker(false);
    setTimeout(() => {
      roomNameInputRef.current?.focus();
      roomNameInputRef.current?.select();
    }, 0);
  };

  const saveRoomName = () => {
    const trimmedName = editedRoomName.trim();

    if (!trimmedName) {
      alert("Room name cannot be empty");
      return;
    }

    // Check for duplicates (excluding current room by roomId)
    const isDuplicate = savedRooms.some(
      (room) => room.roomName === trimmedName && room.roomId !== roomId
    );

    if (isDuplicate) {
      alert(
        "A room with this name already exists. Please choose a different name."
      );
      return;
    }

    // Update the room name in saved rooms
    const updatedRooms = savedRooms.map((room) =>
      room.roomId === roomId ? { ...room, roomName: trimmedName } : room
    );
    setSavedRooms(updatedRooms);
    localStorage.setItem("savedRooms", JSON.stringify(updatedRooms));

    setRoomName(trimmedName);
    setIsEditingRoomName(false);
  };

  const cancelEditingRoomName = () => {
    setIsEditingRoomName(false);
    setEditedRoomName("");
  };

  const createNewRoom = () => {
    const trimmedName = newRoomName.trim();

    if (!trimmedName) {
      alert("Room name cannot be empty");
      return;
    }

    // Check for duplicates
    const isDuplicate = savedRooms.some(
      (room) => room.roomName === trimmedName
    );

    if (isDuplicate) {
      alert(
        "A room with this name already exists. Please choose a different name."
      );
      return;
    }

    // Create new room
    setTimers([]);
    setRoomName(trimmedName);
    setRoomId(generateUUID());
    setNewRoomName("");
    setShowNewRoomModal(false);
    setHasInteracted(true);
    localStorage.setItem("hasInteracted", "true");
  };

  const cancelNewRoom = () => {
    setShowNewRoomModal(false);
    setNewRoomName("");
  };

  const handleGenerateTimerRoom = async (prompt) => {
    // Save current state for undo
    setUndoState({
      timers: [...timers],
      roomName,
      roomId,
    });

    const result = await generateTimerRoom(prompt);

    // Create timers from AI response
    const newTimers = result.timers.map((t) => ({
      id: generateUUID(),
      title: t.title,
      message: t.message || "",
      totalSeconds: t.seconds,
      remainingSeconds: t.seconds,
      isRunning: false,
      notificationsEnabled: true,
      alerts: [],
      triggeredAlerts: [],
    }));

    setTimers(newTimers);
    setRoomName(result.roomName);
    setRoomId(generateUUID());
    setHasInteracted(true);
    localStorage.setItem("hasInteracted", "true");
    setShowAIRoomModal(false);
    setShowAIMenu(false);
    showUndoToast();
  };

  const handleEditRoomWithAI = async (prompt) => {
    // Save current state for undo
    setUndoState({
      timers: [...timers],
      roomName,
      roomId,
    });

    const currentRoomData = {
      roomName,
      timers: timers.map((t) => ({
        title: t.title,
        message: t.message,
        totalSeconds: t.totalSeconds,
      })),
    };

    const result = await editRoomWithAI(prompt, currentRoomData);

    // Convert AI response to timer objects with UUIDs
    const updatedTimers = result.timers.map((t) => ({
      id: generateUUID(),
      title: t.title,
      message: t.message || "",
      totalSeconds: t.seconds,
      remainingSeconds: t.seconds,
      isRunning: false,
      notificationsEnabled: true,
      alerts: [],
      triggeredAlerts: [],
    }));

    setTimers(updatedTimers);
    setShowAITimerModal(false);
    setShowAIMenu(false);
    showUndoToast();
  };

  const handleUndo = () => {
    if (undoState) {
      setTimers(undoState.timers);
      setRoomName(undoState.roomName);
      setRoomId(undoState.roomId);
      setUndoState(null);
      setShowUndoNotification(false);
      // TODO: Send negative feedback to training system
      console.log("User undid AI changes - negative feedback");
    }
  };

  const handleKeepChanges = () => {
    setUndoState(null);
    setShowUndoNotification(false);
    // TODO: Send positive feedback to training system
    console.log("User kept AI changes - positive feedback");
  };

  const showUndoToast = () => {
    setShowUndoNotification(true);
    // Auto-hide after 15 seconds
    setTimeout(() => {
      if (showUndoNotification) {
        handleKeepChanges();
      }
    }, 15000);
  };

  useEffect(() => {
    async function configureZoomApp() {
      try {
        setDebugInfo("Checking Zoom SDK...");

        if (typeof zoomSdk === "undefined") {
          setDebugInfo("Zoom SDK not found!");
          setError("Zoom SDK not loaded");
          setTimeout(() => setZoomReady(true), 2000);
          return;
        }

        setDebugInfo("Configuring Zoom SDK...");
        const configResponse = await zoomSdk.config({
          capabilities: [
            "shareApp",
            "getMeetingContext",
            "showNotification",
            "drawParticipant",
            "drawImage",
            "drawWebView",
            "clearParticipant",
            "clearImage",
            "clearWebView",
            "runRenderingContext",
            "closeRenderingContext",
            "getUserContext",
            "useRenderingContextVideo",
          ],
          version: "0.16.0",
        });
        setDebugInfo("Zoom SDK configured!");
        console.log("Zoom App configured successfully:", configResponse);
        setZoomReady(true);
      } catch (err) {
        console.error("Error configuring Zoom App:", err);
        setDebugInfo(`Error: ${err.message}`);
        setError(`Config error: ${err.message || JSON.stringify(err)}`);
        // Still allow app to work
        setTimeout(() => setZoomReady(true), 2000);
      }
    }

    configureZoomApp();
  }, []);

  // Camera Mode - draws timer on video feed
  useEffect(() => {
    async function handleCameraMode() {
      // Exit camera mode if disabled or SDK not ready
      if (!canvasEnabled || !zoomReady) {
        if (cameraMode) {
          try {
            // Disable rendering context video first
            await zoomSdk.callZoomApi("useRenderingContextVideo", {
              enable: false,
            });
            console.log("Disabled rendering context video");

            // Then close rendering context
            await zoomSdk.closeRenderingContext();
            setCameraMode(false);
            setRenderingContext(null);
            console.log("Exited camera mode");
          } catch (err) {
            console.error("Error exiting camera mode:", err);
          }
        }
        setShowOverlay(false);
        return;
      }

      // Don't re-enter if already in camera mode
      if (cameraMode) {
        return;
      }

      try {
        console.log("Entering camera mode...");

        // Enter camera mode
        const response = await zoomSdk.runRenderingContext({ view: "camera" });
        console.log("Camera mode response:", response);

        // CRITICAL: Tell Zoom to use the rendering context as your camera feed
        // This makes the overlay visible to ALL participants
        await zoomSdk.callZoomApi("useRenderingContextVideo", {
          enable: true,
        });
        console.log("Enabled rendering context video broadcast");

        // Wait for CEF to load (first time may take longer)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Get current user context for participant UUID
        const userContext = await zoomSdk.getUserContext();
        console.log("User context:", userContext);

        // Use standard dimensions (1280x720 is the default for camera mode)
        const width = 1280;
        const height = 720;

        // Draw participant video (layer 1 - bottom)
        await zoomSdk.drawParticipant({
          participantUUID: userContext.participantUUID,
          x: 0,
          y: 0,
          width: width,
          height: height,
          zIndex: 1,
        });
        console.log("Drew participant video");

        // Draw timer overlay using drawWebView (layer 2 - on top)
        // This renders the timer-overlay.html on top of the video
        await zoomSdk.drawWebView({
          x: 0,
          y: 0,
          width: width,
          height: height,
          zIndex: 2,
        });
        console.log("Drew WebView overlay");

        setCameraMode(true);
        setRenderingContext("camera");
        setShowOverlay(true);
        console.log("Camera mode enabled - visible to all participants!");
      } catch (err) {
        console.error("Error entering camera mode:", err);
        setError(`Camera mode error: ${err.message}`);
        setCanvasEnabled(false);
      }
    }

    handleCameraMode();
  }, [canvasEnabled, zoomReady]);

  // Update overlay with active timer data
  useEffect(() => {
    if (!showOverlay) return;

    // Compute active timer within the effect
    const runningTimerIndex = timers.findIndex((t) => t.isRunning);
    const firstTimerWithTimeIndex = timers.findIndex(
      (t) => t.remainingSeconds > 0
    );
    const activeTimerIndex =
      runningTimerIndex >= 0 ? runningTimerIndex : firstTimerWithTimeIndex;
    const activeTimer = activeTimerIndex >= 0 ? timers[activeTimerIndex] : null;

    // Send timer data to overlay iframe
    const overlayFrame = document.querySelector('iframe[src*="timer-overlay"]');
    if (overlayFrame && overlayFrame.contentWindow) {
      if (activeTimer) {
        overlayFrame.contentWindow.postMessage(
          {
            type: "UPDATE_TIMER",
            timer: activeTimer,
          },
          "*"
        );
      } else {
        overlayFrame.contentWindow.postMessage(
          {
            type: "HIDE_TIMER",
          },
          "*"
        );
      }
    }
  }, [showOverlay, timers]);

  const addTimer = (title, message, totalSeconds, alerts = []) => {
    const newTimer = {
      id: generateUUID(),
      title,
      message,
      totalSeconds,
      remainingSeconds: totalSeconds,
      isRunning: false,
      notificationsEnabled: true,
      alerts: alerts || [],
      triggeredAlerts: [],
    };
    console.log("Adding timer:", newTimer);
    console.log("Current timers:", timers);

    setTimers([...timers, newTimer]);
    setShowModal(false);
  };

  const editTimer = (id) => {
    const timer = timers.find((t) => t.id === id);
    if (timer) {
      setEditingTimer(timer);
    }
  };

  const saveEditedTimer = (title, message, totalSeconds, alerts = []) => {
    if (editingTimer) {
      setTimers(
        timers.map((timer) =>
          timer.id === editingTimer.id
            ? {
                ...timer,
                title,
                message,
                totalSeconds,
                remainingSeconds: totalSeconds,
                alerts: alerts || [],
                triggeredAlerts: [],
              }
            : timer
        )
      );
      setEditingTimer(null);
    }
  };

  const updateTimer = (id, updates) => {
    setTimers(
      timers.map((timer) => {
        // If starting this timer, stop all others
        if (timer.id === id && updates.isRunning === true) {
          return { ...timer, ...updates };
        } else if (timer.id === id) {
          return { ...timer, ...updates };
        } else if (updates.isRunning === true) {
          // Stop all other timers when starting one
          return { ...timer, isRunning: false };
        }
        return timer;
      })
    );
  };

  const deleteTimer = (id) => {
    setTimers(timers.filter((timer) => timer.id !== id));
  };

  const handleTimerFinish = async (timerId, timerTitle) => {
    try {
      await zoomSdk.callZoomApi("showNotification", {
        type: "info",
        title: "Timer Finished!",
        message: `${timerTitle} has finished`,
      });
    } catch (err) {
      console.log("Notification error:", err);
    }

    // Find the finished timer and next timer
    const currentIndex = timers.findIndex((t) => t.id === timerId);
    const nextIndex = currentIndex + 1;

    // Update all timers in one batch: reset finished timer and start next one
    setTimers(
      timers.map((timer, index) => {
        if (index === currentIndex) {
          // Reset the finished timer
          return {
            ...timer,
            remainingSeconds: timer.totalSeconds,
            isRunning: false,
          };
        } else if (index === nextIndex) {
          // Start the next timer
          return { ...timer, isRunning: true };
        } else {
          // Stop all other timers
          return { ...timer, isRunning: false };
        }
      })
    );
  };

  if (!zoomReady) {
    return (
      <div className="loading">
        <h2>Loading Zoom App...</h2>
        <p style={{ fontSize: "14px", color: "#2d8cff", marginTop: "10px" }}>
          {debugInfo}
        </p>
        {error && <p className="error">Error: {error}</p>}
        <p style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
          App will load in a moment...
        </p>
      </div>
    );
  }

  const getTotalTime = () => {
    return timers.reduce((total, timer) => total + timer.remainingSeconds, 0);
  };

  const formatMasterTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(
        2,
        "0"
      )}`;
    }
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const formatCompactTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m`;
    }
    return `${seconds}s`;
  };

  const getRoomTotalTime = (roomTimers) => {
    return roomTimers.reduce((total, timer) => total + timer.totalSeconds, 0);
  };

  const hasRunningTimer = timers.some((t) => t.isRunning);

  // Active timer is the first one with time remaining (or the running one)
  const runningTimerIndex = timers.findIndex((t) => t.isRunning);
  const firstTimerWithTimeIndex = timers.findIndex(
    (t) => t.remainingSeconds > 0
  );

  const activeTimerIndex =
    runningTimerIndex >= 0 ? runningTimerIndex : firstTimerWithTimeIndex;
  const activeTimer = activeTimerIndex >= 0 ? timers[activeTimerIndex] : null;

  const goToNextTimer = () => {
    if (timers.length < 2) return;

    const wasRunning = activeTimer?.isRunning;

    // Set current timer to 0 and stop it
    if (activeTimerIndex >= 0) {
      updateTimer(timers[activeTimerIndex].id, {
        remainingSeconds: 0,
        isRunning: false,
      });
    }

    // Find next timer in linear order (not circular)
    const nextIndex = activeTimerIndex + 1;
    if (nextIndex < timers.length && wasRunning) {
      setTimeout(() => {
        updateTimer(timers[nextIndex].id, { isRunning: true });
      }, 100);
    }
  };

  const goToPreviousTimer = () => {
    if (activeTimerIndex <= 0) return; // Can't go before first

    const wasRunning = activeTimer?.isRunning;

    // Set current timer to 0 and stop it
    if (activeTimerIndex >= 0) {
      updateTimer(timers[activeTimerIndex].id, {
        remainingSeconds: 0,
        isRunning: false,
      });
    }

    // Go to previous timer in linear order
    const prevIndex = activeTimerIndex - 1;
    if (wasRunning) {
      setTimeout(() => {
        updateTimer(timers[prevIndex].id, { isRunning: true });
      }, 100);
    }
  };

  const add30Seconds = () => {
    if (activeTimer) {
      updateTimer(activeTimer.id, {
        remainingSeconds: activeTimer.remainingSeconds + 30,
        totalSeconds: activeTimer.totalSeconds + 30,
      });
    }
  };

  const subtract30Seconds = () => {
    if (activeTimer) {
      const newRemaining = Math.max(0, activeTimer.remainingSeconds - 30);
      const newTotal = Math.max(0, activeTimer.totalSeconds - 30);
      updateTimer(activeTimer.id, {
        remainingSeconds: newRemaining,
        totalSeconds: newTotal,
      });
    }
  };

  const togglePlayPause = () => {
    if (!activeTimer) return;

    // Stop all other timers first
    timers.forEach((timer) => {
      if (timer.id !== activeTimer.id && timer.isRunning) {
        updateTimer(timer.id, { isRunning: false });
      }
    });

    // Toggle the active timer
    const newRunningState = !activeTimer.isRunning;
    updateTimer(activeTimer.id, { isRunning: newRunningState });
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newTimers = [...timers];
    const draggedTimer = newTimers[draggedIndex];
    newTimers.splice(draggedIndex, 1);
    newTimers.splice(index, 0, draggedTimer);

    setTimers(newTimers);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="app">
      <div className="app-header">
        <div className="header-left">
          <div className="room-name-dropdown" ref={roomPickerRef}>
            {isEditingRoomName ? (
              <div className="room-name-edit">
                <input
                  ref={roomNameInputRef}
                  type="text"
                  className="room-name-input"
                  value={editedRoomName}
                  onChange={(e) => setEditedRoomName(e.target.value)}
                  placeholder="Room name"
                  maxLength={50}
                />
                <button
                  className="room-name-save"
                  onClick={saveRoomName}
                  title="Save">
                  ✓
                </button>
                <button
                  className="room-name-cancel"
                  onClick={cancelEditingRoomName}
                  title="Cancel">
                  ✕
                </button>
              </div>
            ) : (
              <div className="room-name-display">
                {timers.length > 0 && (
                  <div className="room-total-time-badge">
                    ⏱ {formatCompactTime(getTotalTime())}
                  </div>
                )}
                <h1
                  className="room-name clickable"
                  onClick={() => {
                    setShowRoomPicker(!showRoomPicker);
                    setShowTemplates(false);
                    setShowAIMenu(false);
                  }}>
                  {roomName} <span className="dropdown-arrow">▼</span>
                </h1>
              </div>
            )}

            {showRoomPicker && (
              <div className="room-picker-menu">
                <button
                  className="room-picker-edit-current"
                  onClick={() => {
                    startEditingRoomName();
                    setShowRoomPicker(false);
                  }}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="currentColor">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                  </svg>
                  <span>Edit Room Name</span>
                </button>
                {savedRooms.length > 0 && (
                  <>
                    <div className="room-picker-divider"></div>
                    {savedRooms.map((room) => (
                      <div
                        key={room.roomId || room.roomName}
                        className="room-picker-item">
                        <button
                          className="room-picker-button"
                          onClick={() => loadSavedRoom(room)}>
                          <div className="room-picker-content">
                            <div className="room-picker-name">
                              {room.roomName}
                            </div>
                            <div className="room-picker-meta">
                              <span className="room-picker-count">
                                {room.timers.length} timers
                              </span>
                              <span className="room-picker-separator">•</span>
                              <span className="room-picker-time">
                                {formatCompactTime(
                                  getRoomTotalTime(room.timers)
                                )}
                              </span>
                            </div>
                          </div>
                        </button>
                        <button
                          className="room-picker-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedRoom(room);
                          }}
                          title="Delete room">
                          ✕
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="header-right">
          <button
            className={`canvas-toggle-btn ${canvasEnabled ? "active" : ""}`}
            onClick={() => setCanvasEnabled(!canvasEnabled)}
            title={
              canvasEnabled
                ? "Hide timer on canvas"
                : "Show timer on canvas for everyone"
            }>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 1a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V1zm4 0v6h8V1H4zm8 8H4v6h8V9zM1 1v2h2V1H1zm2 3H1v2h2V4zM1 7v2h2V7H1zm2 3H1v2h2v-2zm-2 3v2h2v-2H1zM15 1h-2v2h2V1zm-2 3v2h2V4h-2zm2 3h-2v2h2V7zm-2 3v2h2v-2h-2zm2 3h-2v2h2v-2z" />
            </svg>
          </button>

          <div className="template-dropdown" ref={templatesMenuRef}>
            <button
              className="add-button combined"
              onClick={() => {
                setShowTemplates(!showTemplates);
              }}
              title="New Room">
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="currentColor">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
              </svg>
            </button>

            {showTemplates && (
              <div className="template-menu">
                <button
                  className="template-item custom"
                  onClick={() => {
                    setShowTemplates(false);
                    setShowNewRoomModal(true);
                  }}>
                  <span className="template-item-icon">➕</span>
                  <div className="template-item-content">
                    <div className="template-item-name">
                      Make Custom Timer Room
                    </div>
                    <div className="template-item-count">
                      Start from scratch
                    </div>
                  </div>
                </button>
                <button
                  className="template-item ai-generate"
                  onClick={() => {
                    setShowAIRoomModal(true);
                    setShowTemplates(false);
                  }}>
                  <span className="template-item-icon">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="currentColor">
                      <path d="M5 2V0H0v5h2v6H0v5h5v-2h6v2h5v-5h-2V5h2V0h-5v2H5zm6 1v2h2v6h-2v2H5v-2H3V5h2V3h6zm1-2h3v3h-3V1zm3 11v3h-3v-3h3zM4 15H1v-3h3v3zM1 4V1h3v3H1z" />
                    </svg>
                  </span>
                  <div className="template-item-content">
                    <div className="template-item-name">Generate with AI</div>
                    <div className="template-item-count">
                      Create multiple timers from description
                    </div>
                  </div>
                </button>
                {timers.length > 0 && (
                  <button
                    className="template-item ai-generate"
                    onClick={() => {
                      setShowAITimerModal(true);
                      setShowTemplates(false);
                    }}>
                    <span className="template-item-icon">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="currentColor">
                        <path d="M5 2V0H0v5h2v6H0v5h5v-2h6v2h5v-5h-2V5h2V0h-5v2H5zm6 1v2h2v6h-2v2H5v-2H3V5h2V3h6zm1-2h3v3h-3V1zm3 11v3h-3v-3h3zM4 15H1v-3h3v3zM1 4V1h3v3H1z" />
                      </svg>
                    </span>
                    <div className="template-item-content">
                      <div className="template-item-name">
                        Edit with AI
                        <span className="experimental-badge">Experimental</span>
                      </div>
                      <div className="template-item-count">
                        Add, modify, or remove timers
                      </div>
                    </div>
                  </button>
                )}
                <div className="template-divider"></div>
                {Object.entries(templates).map(([key, template]) => (
                  <button
                    key={key}
                    className="template-item"
                    onClick={() => loadTemplate(key)}>
                    <span className="template-item-icon">{template.icon}</span>
                    <div className="template-item-content">
                      <div className="template-item-name">{template.name}</div>
                      <div className="template-item-count">
                        {template.timers.length} timers
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {timers.length === 0 && savedRooms.length === 0 && !hasInteracted ? (
        <div className="welcome-screen">
          <div className="welcome-content">
            {/* Debug info - remove later */}
            <div
              style={{ fontSize: "10px", color: "#666", marginBottom: "10px" }}>
              Debug: timers={timers.length}, rooms={savedRooms.length},
              interacted={hasInteracted ? "yes" : "no"}
            </div>
            <div className="welcome-icon">⏱️</div>
            <h1 className="welcome-title">Welcome to Timer Rooms</h1>
            <p className="welcome-description">
              Create custom timer sequences for your meetings, workouts, and
              daily routines. Get started by choosing a template or creating
              your own.
            </p>
            <div className="welcome-actions">
              <button
                className="welcome-btn primary"
                onClick={() => setShowNewRoomModal(true)}>
                <span className="welcome-btn-icon">➕</span>
                Create Custom Room
              </button>
              <button
                className="welcome-btn secondary"
                onClick={() => setShowTemplates(true)}>
                <span className="welcome-btn-icon">📋</span>
                Browse Templates
              </button>
            </div>
            <div className="welcome-templates">
              <div className="welcome-templates-title">Popular Templates</div>
              <div className="welcome-templates-grid">
                {Object.entries(templates)
                  .slice(0, 6)
                  .map(([key, template]) => (
                    <button
                      key={key}
                      className="welcome-template-card"
                      onClick={() => loadTemplate(key)}>
                      <div className="welcome-template-icon">
                        {template.icon}
                      </div>
                      <div className="welcome-template-name">
                        {template.name}
                      </div>
                      <div className="welcome-template-count">
                        {template.timers.length} timers
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : timers.length === 0 ? (
        <AddTimer onAdd={addTimer} />
      ) : (
        <>
          {activeTimer && (
            <div className="active-timer-section">
              <Timer
                key={activeTimer.id}
                timer={activeTimer}
                onUpdate={updateTimer}
                onDelete={deleteTimer}
                onFinish={handleTimerFinish}
                onEdit={editTimer}
              />
              <div className="master-controls">
                <button
                  className="master-control-btn"
                  onClick={goToPreviousTimer}
                  disabled={activeTimerIndex <= 0}
                  title="Previous timer">
                  ⏮
                </button>
                <button
                  className="master-control-btn subtract-time-btn"
                  onClick={subtract30Seconds}
                  disabled={!activeTimer}
                  title="Subtract 30 seconds">
                  -30
                </button>
                <button
                  className="master-control-btn play-pause-btn"
                  onClick={togglePlayPause}
                  disabled={!activeTimer}
                  title={hasRunningTimer ? "Pause" : "Play"}>
                  {hasRunningTimer ? "⏸" : "▶"}
                </button>
                <button
                  className="master-control-btn add-time-btn"
                  onClick={add30Seconds}
                  disabled={!activeTimer}
                  title="Add 30 seconds">
                  +30
                </button>
                <button
                  className="master-control-btn"
                  onClick={goToNextTimer}
                  disabled={activeTimerIndex >= timers.length - 1}
                  title="Next timer">
                  ⏭
                </button>
              </div>
            </div>
          )}

          {timers.length > 0 && (
            <div className="up-next-section">
              <div className="up-next-header">
                <span>All Timers</span>
                <button
                  className="add-button-small"
                  onClick={() => setShowModal(true)}>
                  Add Timer
                </button>
              </div>
              {timers.map((timer, index) => (
                <Timer
                  key={timer.id}
                  timer={timer}
                  onUpdate={updateTimer}
                  onDelete={deleteTimer}
                  onFinish={handleTimerFinish}
                  onEdit={editTimer}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === index}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              ×
            </button>
            <AddTimer onAdd={addTimer} />
          </div>
        </div>
      )}

      {editingTimer && (
        <div className="modal-overlay" onClick={() => setEditingTimer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setEditingTimer(null)}>
              ×
            </button>
            <AddTimer
              onAdd={saveEditedTimer}
              initialTitle={editingTimer.title}
              initialMessage={editingTimer.message}
              initialMinutes={Math.floor(editingTimer.totalSeconds / 60)}
              initialSeconds={editingTimer.totalSeconds % 60}
              initialAlerts={editingTimer.alerts || []}
              isEditing={true}
            />
          </div>
        </div>
      )}

      {showNewRoomModal && (
        <div className="modal-overlay" onClick={cancelNewRoom}>
          <div
            className="modal-content new-room-modal"
            onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={cancelNewRoom}>
              ×
            </button>
            <div className="new-room-form">
              <h2 className="new-room-title">Create New Timer Room</h2>
              <p className="new-room-description">
                Give your timer room a name to get started
              </p>
              <input
                ref={newRoomInputRef}
                type="text"
                className="new-room-input"
                placeholder="e.g., Morning Routine, Team Meeting, Workout"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                maxLength={50}
              />
              <div className="new-room-actions">
                <button className="new-room-cancel" onClick={cancelNewRoom}>
                  Cancel
                </button>
                <button className="new-room-create" onClick={createNewRoom}>
                  Create Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAIRoomModal && (
        <AIPromptModal
          type="room"
          onClose={() => setShowAIRoomModal(false)}
          onGenerate={handleGenerateTimerRoom}
        />
      )}

      {showAITimerModal && (
        <AIPromptModal
          type="edit"
          onClose={() => setShowAITimerModal(false)}
          onGenerate={handleEditRoomWithAI}
        />
      )}

      {showUndoNotification && undoState && (
        <div className="undo-notification">
          <div className="undo-content">
            <span className="undo-message">AI changes applied</span>
            <div className="undo-actions">
              <button className="undo-button undo-revert" onClick={handleUndo}>
                Undo
              </button>
              <button
                className="undo-button undo-keep"
                onClick={handleKeepChanges}>
                Keep
              </button>
            </div>
          </div>
        </div>
      )}

      {showOverlay && activeTimer && (
        <div className="timer-canvas-overlay">
          <div className="timer-canvas-box">
            <div className="timer-canvas-title">{activeTimer.title}</div>
            <div
              className={`timer-canvas-time ${
                activeTimer.remainingSeconds === 0 ? "finished" : ""
              } ${
                activeTimer.remainingSeconds / activeTimer.totalSeconds <= 0.25
                  ? "warning"
                  : ""
              } ${
                activeTimer.remainingSeconds / activeTimer.totalSeconds <= 0.1
                  ? "urgent"
                  : ""
              } ${
                activeTimer.remainingSeconds / activeTimer.totalSeconds <= 0.05
                  ? "critical"
                  : ""
              }`}>
              {formatMasterTime(activeTimer.remainingSeconds)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
