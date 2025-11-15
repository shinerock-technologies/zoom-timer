import { useState, useRef, useEffect } from "react";

function AIPromptModal({ onClose, onGenerate, type = "room" }) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(0);
  const inputRef = useRef(null);

  const loadingMessages = [
    "Starting engine...",
    "Sprinkling magic...",
    "Consulting the AI Oracle",
    "Brewing timers...",
    "Crafting magic...",
    "Almost there...",
  ];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError("Please enter a description");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await onGenerate(prompt.trim());
      onClose();
    } catch (err) {
      setError(err.message || "Failed to generate. Please try again.");
      setIsGenerating(false);
    }
  };

  const examples =
    type === "room"
      ? [
          "SaaS discovery call",
          "Product demo rehearsal",
          "Client onboarding call",
          "Daily standup meeting",
          "Sprint planning session",
          "Team retrospective",
          "Brainstorming session",
          "Interview practice round",
          "Portfolio presentation",
          "Classroom lesson block",
          "Debate practice round",
          "Tutoring session",
          "Presentation rehearsal",
          "Toastmasters speech practice",
          "Script read-through",
          "Music practice block",
          "Pictionary round",
          "Charades round",
          "Trivia quiz round",
          "Hot seat game",
          "Coffee chat rotation",
          "Meditation session",
          "Stretch break routine",
          "Focus work session",
          "Marketing review meeting",
          "Product prioritization session",
          "Incident response drill",
          "Lightning talk round",
          "Breakout room activity",
        ]
      : [
          "Add a 5 minute break",
          "Make all timers 2 minutes longer",
          "Remove the last timer",
          "Change first timer to 10 minutes",
        ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content ai-prompt-modal"
        onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <div className="ai-prompt-content">
          <div className="ai-prompt-header">
            <h2 className="ai-prompt-title">
              {type === "room" ? "Generate Timer Room" : "Edit with AI"}
            </h2>
            <p className="ai-prompt-description">
              {type === "room"
                ? "Describe the activity and AI will create a sequence of timers"
                : "Tell AI how to modify your timers - add, edit, or remove"}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              className="ai-prompt-input"
              placeholder={
                type === "room"
                  ? "e.g., Sales pitch presentation, morning workout routine, team standup"
                  : "e.g., Add a 5 minute break after the second timer, make all timers 30 seconds longer"
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={isGenerating}
            />

            {error && <div className="ai-prompt-error">{error}</div>}

            <div className="ai-prompt-examples">
              <div className="ai-prompt-examples-label">Suggestions</div>
              <div className="ai-prompt-examples-list">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    className="ai-prompt-example"
                    onClick={() => setPrompt(example)}
                    disabled={isGenerating}>
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="ai-prompt-actions">
              <button
                type="button"
                className="ai-prompt-cancel"
                onClick={onClose}
                disabled={isGenerating}>
                Cancel
              </button>
              <button
                type="submit"
                className="ai-prompt-generate"
                disabled={isGenerating || !prompt.trim()}>
                {isGenerating && (
                  <span className="spinner" aria-hidden="true"></span>
                )}
                {isGenerating ? loadingMessages[loadingMessage] : "Generate"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AIPromptModal;
