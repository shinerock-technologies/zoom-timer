import { useState, useRef, useEffect } from "react";

function AIPromptModal({ onClose, onGenerate, type = "room" }) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
          "Sales pitch meeting",
          "Morning workout routine",
          "Team standup meeting",
          "Cooking dinner",
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
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AIPromptModal;
