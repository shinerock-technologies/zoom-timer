import { useState, useEffect, useRef } from "react";
import zoomSdk from "@zoom/appssdk";
import Timer from "./components/Timer";
import AddTimer from "./components/AddTimer";
import ActiveTimer from "./components/ActiveTimer";
import AIPromptSheet from "./components/AIPromptSheet";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./components/ui/sheet";
import { Button } from "./components/ui/button";
import { WandSparkles } from "lucide-react";
import { generateUUID } from "./utils/uuid";
import { generateTimerRoom, editRoomWithAI } from "./services/openai";
import { Toaster } from "./components/ui/sonner";
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
  const [showGenerateMenu, setShowGenerateMenu] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [roomName, setRoomName] = useState("My Timer Room");
  const [roomId, setRoomId] = useState(() => generateUUID());
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [savedRooms, setSavedRooms] = useState([]);
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [editedRoomName, setEditedRoomName] = useState("");
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomMode, setNewRoomMode] = useState("manual"); // "manual" or "ai"
  const [aiRoomPrompt, setAiRoomPrompt] = useState("");
  const [isGeneratingRoom, setIsGeneratingRoom] = useState(false);
  const [aiRoomError, setAiRoomError] = useState(null);
  const [aiLoadingMessage, setAiLoadingMessage] = useState(0);
  const [showTemplateSheet, setShowTemplateSheet] = useState(false);
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
  const generateMenuRef = useRef(null);
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

  // Close generate menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        generateMenuRef.current &&
        !generateMenuRef.current.contains(event.target)
      ) {
        setShowGenerateMenu(false);
      }
    };

    if (showGenerateMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showGenerateMenu]);

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

  // Rotate AI loading messages
  useEffect(() => {
    if (!isGeneratingRoom) return;

    const loadingMessages = [
      "Starting engine...",
      "Sprinkling magic...",
      "Consulting the AI Oracle",
      "Brewing timers...",
      "Crafting magic...",
      "Almost there...",
    ];

    const interval = setInterval(() => {
      setAiLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isGeneratingRoom]);

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
            { percentage: 90, type: "warning", enabled: true },
            { percentage: 10, type: "urgent", enabled: true },
            { percentage: 5, type: "critical", enabled: true },
          ],
        },
        {
          title: "Medium Test",
          message: "20 second test",
          seconds: 10,
          alerts: [
            { percentage: 95, type: "warning", enabled: true },
            { percentage: 10, type: "urgent", enabled: true },
            { percentage: 5, type: "critical", enabled: true },
          ],
        },
        {
          title: "Long Test",
          message: "30 second test",
          seconds: 10,
          alerts: [
            { percentage: 95, type: "warning", enabled: true },
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
    setNewRoomMode("manual");
    setAiRoomPrompt("");
    setAiRoomError(null);
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

  const handleGenerateRoomFromSheet = async (e) => {
    e.preventDefault();

    if (!aiRoomPrompt.trim()) {
      setAiRoomError("Please enter a description");
      return;
    }

    setIsGeneratingRoom(true);
    setAiRoomError(null);

    try {
      // Save current state for undo
      setUndoState({
        timers: [...timers],
        roomName,
        roomId,
      });

      const result = await generateTimerRoom(aiRoomPrompt.trim());

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
      setShowNewRoomModal(false);
      setAiRoomPrompt("");
      setNewRoomMode("manual");
      showUndoToast();
    } catch (err) {
      setAiRoomError(err.message || "Failed to generate. Please try again.");
    } finally {
      setIsGeneratingRoom(false);
    }
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
      <div
        className="app-header"
        style={{ padding: "8px 16px", minHeight: "48px" }}>
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
                <Button
                  size="sm"
                  variant="primary"
                  className="h-8 w-8 p-0"
                  onClick={saveRoomName}
                  title="Save">
                  ✓
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={cancelEditingRoomName}
                  title="Cancel">
                  ✕
                </Button>
              </div>
            ) : (
              <div
                className="room-name-display"
                style={{ justifyContent: "flex-start" }}>
                {timers.length > 0 && (
                  <div className="room-total-time-badge">
                    {formatCompactTime(getTotalTime())}
                  </div>
                )}
                <h1
                  className="room-name clickable"
                  style={{ textAlign: "left" }}
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
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-[#2d8cff] hover:bg-[rgba(45,140,255,0.15)] hover:text-[#2d8cff] transition-colors"
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
                </Button>
                {savedRooms.length > 0 && (
                  <>
                    <div className="room-picker-divider"></div>
                    {savedRooms.map((room) => (
                      <div
                        key={room.roomId || room.roomName}
                        className="room-picker-item">
                        <Button
                          variant="ghost"
                          className="flex-1 justify-start h-auto py-2 px-3 hover:bg-[#2a2a2a] transition-colors"
                          onClick={() => loadSavedRoom(room)}>
                          <div className="flex flex-col items-start gap-0 w-full">
                            <div className="text-white font-medium text-left">
                              {room.roomName}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#888]">
                              <span>{room.timers.length} timers</span>
                              <span>•</span>
                              <span className="text-[#2d8cff]">
                                {formatCompactTime(
                                  getRoomTotalTime(room.timers)
                                )}
                              </span>
                            </div>
                          </div>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-[#888] hover:text-red-500 hover:bg-[rgba(244,67,54,0.1)] transition-colors mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedRoom(room);
                          }}
                          title="Delete room">
                          ✕
                        </Button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="header-right">
          <div className="template-dropdown" ref={generateMenuRef}>
            <Button
              size="sm"
              variant="active"
              className="h-8 gap-1.5 px-2 sm:px-3"
              onClick={() => setShowGenerateMenu(!showGenerateMenu)}
              title="Generate with AI">
              <WandSparkles size={14} />
              <span className="hidden sm:inline">Generate</span>
            </Button>

            {showGenerateMenu && (
              <div className="template-menu">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 px-3 hover:bg-[#2a2a2a] transition-colors"
                  onClick={() => {
                    setShowGenerateMenu(false);
                    setShowAIRoomModal(true);
                  }}>
                  <div className="flex flex-col items-start gap-0 w-full">
                    <div className="text-white font-medium text-left">
                      Generate Room
                    </div>
                    <div className="text-xs text-[#888]">
                      Create multiple timers from description
                    </div>
                  </div>
                </Button>
                {timers.length > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto py-2 px-3 hover:bg-[#2a2a2a] transition-colors"
                    onClick={() => {
                      setShowGenerateMenu(false);
                      setShowAITimerModal(true);
                    }}>
                    <div className="flex flex-col items-start gap-0 w-full">
                      <div className="text-white font-medium text-left flex items-center gap-2">
                        Edit Timer
                        <span className="experimental-badge">Experimental</span>
                      </div>
                      <div className="text-xs text-[#888]">
                        Add, modify, or remove timers
                      </div>
                    </div>
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="template-dropdown" ref={templatesMenuRef}>
            <Button
              size="sm"
              variant="active"
              className="h-8 gap-2 px-2 sm:px-3"
              onClick={() => {
                setShowTemplates(!showTemplates);
              }}
              title="Create">
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="currentColor">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
              </svg>
              <span className="hidden sm:inline">Create</span>
            </Button>

            {showTemplates && (
              <div className="template-menu">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 px-3 hover:bg-[#2a2a2a] transition-colors"
                  onClick={() => {
                    setShowTemplates(false);
                    setShowNewRoomModal(true);
                  }}>
                  <div className="flex flex-col items-start gap-0 w-full">
                    <div className="text-white font-medium text-left">
                      New Room
                    </div>
                    <div className="text-xs text-[#888]">
                      Create a custom timer room
                    </div>
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 px-3 hover:bg-[#2a2a2a] transition-colors"
                  onClick={() => {
                    setShowTemplates(false);
                    setShowModal(true);
                  }}>
                  <div className="flex flex-col items-start gap-0 w-full">
                    <div className="text-white font-medium text-left">
                      New Timer
                    </div>
                    <div className="text-xs text-[#888]">
                      Add a timer to current room
                    </div>
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 px-3 hover:bg-[#2a2a2a] transition-colors"
                  onClick={() => {
                    setShowTemplates(false);
                    setShowTemplateSheet(true);
                  }}>
                  <div className="flex flex-col items-start gap-0 w-full">
                    <div className="text-white font-medium text-left">
                      From Template
                    </div>
                    <div className="text-xs text-[#888]">
                      Browse pre-made timer rooms
                    </div>
                  </div>
                </Button>
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
              <Button
                variant="primary"
                size="lg"
                className="gap-2"
                onClick={() => setShowNewRoomModal(true)}>
                <span className="welcome-btn-icon">➕</span>
                Create Custom Room
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => setShowTemplates(true)}>
                <span className="welcome-btn-icon">📋</span>
                Browse Templates
              </Button>
            </div>
            <div className="welcome-templates">
              <div className="welcome-templates-title">Popular Templates</div>
              <div className="welcome-templates-grid">
                {Object.entries(templates)
                  .slice(0, 6)
                  .map(([key, template]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      className="welcome-template-card h-auto flex-col py-4"
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
                    </Button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : timers.length === 0 ? (
        <AddTimer onAdd={addTimer} />
      ) : (
        <>
          <ActiveTimer
            activeTimer={activeTimer}
            activeTimerIndex={activeTimerIndex}
            timersLength={timers.length}
            hasRunningTimer={hasRunningTimer}
            onUpdate={updateTimer}
            onFinish={handleTimerFinish}
            onGoToPrevious={goToPreviousTimer}
            onGoToNext={goToNextTimer}
            onTogglePlayPause={togglePlayPause}
            onAdd30Seconds={add30Seconds}
            onSubtract30Seconds={subtract30Seconds}
          />

          {timers.length > 0 && (
            <div className="up-next-section">
              <div className="up-next-header">
                <span>All Timers</span>
                <Button
                  variant="active"
                  size="sm"
                  onClick={() => setShowModal(true)}>
                  Add Timer
                </Button>
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

      <Sheet open={showModal} onOpenChange={setShowModal}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Add Timer</SheetTitle>
            <SheetDescription>
              Create a new timer for your sequence
            </SheetDescription>
          </SheetHeader>
          <AddTimer onAdd={addTimer} />
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!editingTimer}
        onOpenChange={(open) => !open && setEditingTimer(null)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Edit Timer</SheetTitle>
            <SheetDescription>Update your timer settings</SheetDescription>
          </SheetHeader>
          {editingTimer && (
            <AddTimer
              onAdd={saveEditedTimer}
              initialTitle={editingTimer.title}
              initialMessage={editingTimer.message}
              initialMinutes={Math.floor(editingTimer.totalSeconds / 60)}
              initialSeconds={editingTimer.totalSeconds % 60}
              initialAlerts={editingTimer.alerts || []}
              isEditing={true}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={showNewRoomModal} onOpenChange={setShowNewRoomModal}>
        <SheetContent
          side="right"
          className="flex flex-col gap-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Timer Room</SheetTitle>
            <SheetDescription>
              {newRoomMode === "manual"
                ? "Give your timer room a name to get started"
                : "Describe the activity and AI will create a sequence of timers"}
            </SheetDescription>
          </SheetHeader>

          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-[#2a2a2a] rounded">
            <Button
              variant={newRoomMode === "manual" ? "primary" : "ghost"}
              className="flex-1"
              onClick={() => setNewRoomMode("manual")}>
              Manual
            </Button>
            <Button
              variant={newRoomMode === "ai" ? "primary" : "ghost"}
              className="flex-1 gap-2"
              onClick={() => setNewRoomMode("ai")}>
              <WandSparkles size={14} />
              AI Generate
            </Button>
          </div>

          {/* Manual Mode */}
          {newRoomMode === "manual" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white">
                  Room Name
                </label>
                <input
                  ref={newRoomInputRef}
                  type="text"
                  className="w-full px-4 py-3 bg-[#2a2a2a] border-2 border-[#3d3d3d] rounded text-white placeholder:text-[#666] focus:outline-none focus:ring-0 focus:border-[#2d8cff] transition-all"
                  placeholder="e.g., Morning Routine, Team Meeting, Workout"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createNewRoom();
                    if (e.key === "Escape") cancelNewRoom();
                  }}
                  maxLength={50}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={cancelNewRoom}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={createNewRoom}
                  disabled={!newRoomName.trim()}>
                  Create Room
                </Button>
              </div>
            </div>
          )}

          {/* AI Mode */}
          {newRoomMode === "ai" && (
            <form
              onSubmit={handleGenerateRoomFromSheet}
              className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white">
                  Describe Your Activity
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-[#2a2a2a] border-2 border-[#3d3d3d] rounded text-white placeholder:text-[#666] focus:outline-none focus:ring-0 focus:border-[#2d8cff] transition-all resize-none"
                  placeholder="e.g., Sales pitch presentation, morning workout routine, team standup"
                  value={aiRoomPrompt}
                  onChange={(e) => setAiRoomPrompt(e.target.value)}
                  rows={4}
                  disabled={isGeneratingRoom}
                />
              </div>

              {aiRoomError && (
                <div className="px-3 py-2 bg-[rgba(244,67,54,0.1)] border border-[rgba(244,67,54,0.3)] rounded text-[#f44336] text-sm">
                  {aiRoomError}
                </div>
              )}

              <div>
                <div className="text-xs text-[#666] font-medium uppercase tracking-wide mb-2">
                  Suggestions
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "SaaS discovery call",
                    "Product demo rehearsal",
                    "Client onboarding call",
                    "Daily standup meeting",
                    "Sprint planning session",
                  ].map((example, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="default"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setAiRoomPrompt(example)}
                      disabled={isGeneratingRoom}>
                      {example}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={cancelNewRoom}
                  disabled={isGeneratingRoom}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 gap-2"
                  disabled={isGeneratingRoom || !aiRoomPrompt.trim()}>
                  {isGeneratingRoom && (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  )}
                  {isGeneratingRoom
                    ? [
                        "Starting engine...",
                        "Sprinkling magic...",
                        "Consulting the AI Oracle",
                        "Brewing timers...",
                        "Crafting magic...",
                        "Almost there...",
                      ][aiLoadingMessage]
                    : "Generate"}
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>

      <AIPromptSheet
        open={showAIRoomModal}
        onOpenChange={setShowAIRoomModal}
        type="room"
        onGenerate={handleGenerateTimerRoom}
      />

      <AIPromptSheet
        open={showAITimerModal}
        onOpenChange={setShowAITimerModal}
        type="edit"
        onGenerate={handleEditRoomWithAI}
      />

      {showUndoNotification && undoState && (
        <div className="undo-notification">
          <div className="undo-content">
            <span className="undo-message">AI changes applied</span>
            <div className="undo-actions">
              <Button variant="outline" size="sm" onClick={handleUndo}>
                Undo
              </Button>
              <Button variant="primary" size="sm" onClick={handleKeepChanges}>
                Keep
              </Button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={showTemplateSheet} onOpenChange={setShowTemplateSheet}>
        <SheetContent
          side="right"
          className="flex flex-col gap-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Choose a Template</SheetTitle>
            <SheetDescription>
              Select a pre-made timer room template to get started quickly
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-2">
            {Object.entries(templates).map(([key, template]) => (
              <Button
                key={key}
                variant="ghost"
                className="w-full justify-start h-auto py-3 px-3 gap-3"
                onClick={() => {
                  loadTemplate(key);
                  setShowTemplateSheet(false);
                }}>
                <div className="flex flex-col items-start gap-0">
                  <div className="text-white font-medium">{template.name}</div>
                  <div className="text-xs text-[#888]">
                    {template.timers.length} timers
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

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
      <Toaster />
    </div>
  );
}

export default App;
