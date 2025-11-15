import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";

function AIPromptDrawer({ open, onOpenChange, onGenerate, type = "room" }) {
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
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

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
      onOpenChange(false);
      setPrompt("");
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
        ]
      : [
          "Add a 5 minute break",
          "Make all timers 2 minutes longer",
          "Remove the last timer",
        ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {type === "room" ? "Generate Timer Room" : "Edit with AI"}
          </DrawerTitle>
          <DrawerDescription>
            {type === "room"
              ? "Describe the activity and AI will create a sequence of timers"
              : "Tell AI how to modify your timers - add, edit, or remove"}
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="px-4 pb-4">
          <textarea
            ref={inputRef}
            className="w-full px-4 py-3 bg-[#2d2d2d] border-2 border-[#3d3d3d] rounded-md text-white placeholder:text-[#666] focus:outline-none focus:border-[#2d8cff] transition-colors resize-none"
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

          {error && (
            <div className="mt-2 px-3 py-2 bg-[rgba(244,67,54,0.1)] border border-[rgba(244,67,54,0.3)] rounded text-[#f44336] text-sm">
              {error}
            </div>
          )}

          <div className="mt-4">
            <div className="text-xs text-[#666] font-medium uppercase tracking-wide mb-2">
              Suggestions
            </div>
            <div className="flex flex-wrap gap-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  className="px-3 py-1.5 bg-[#2d2d2d] border border-[#3d3d3d] rounded-full text-[#888] text-xs hover:bg-[#3d3d3d] hover:text-[#2d8cff] hover:border-[#2d8cff] transition-colors disabled:opacity-50"
                  onClick={() => setPrompt(example)}
                  disabled={isGenerating}>
                  {example}
                </button>
              ))}
            </div>
          </div>

          <DrawerFooter className="px-0 pt-4">
            <Button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="w-full">
              {isGenerating && (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
              )}
              {isGenerating ? loadingMessages[loadingMessage] : "Generate"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
              className="w-full">
              Cancel
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

export default AIPromptDrawer;
