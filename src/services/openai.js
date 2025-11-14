export async function generateTimerRoom(prompt) {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        type: "room",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate timer room");
    }

    const result = await response.json();

    // Validate the structure
    if (!result.roomName || !Array.isArray(result.timers)) {
      throw new Error("Invalid response format from AI");
    }

    return result;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}

export async function editRoomWithAI(prompt, currentRoom) {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        type: "edit",
        currentRoom,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to edit room");
    }

    const result = await response.json();

    // Validate the structure
    if (!Array.isArray(result.timers)) {
      throw new Error("Invalid response format from AI");
    }

    return result;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}
