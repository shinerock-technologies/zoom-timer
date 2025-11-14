import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post("/api/generate", async (req, res) => {
  const { prompt, type, currentRoom } = req.body;
  const OPENAI_API_KEY =
    process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  let systemPrompt;
  let userPrompt = prompt;
  let maxTokens = 1000;

  if (type === "edit") {
    systemPrompt = `You are a timer room editor. Given the current room state and a user's edit request, modify the timers accordingly.

Return ONLY a valid JSON object with this exact structure:
{
  "timers": [
    {
      "title": "Timer name",
      "message": "Brief description",
      "seconds": 300
    }
  ]
}

Rules:
- Understand edit requests like "add a 5 minute break", "make all timers 2 minutes longer", "remove the last timer", "change the first timer to 10 minutes"
- Keep existing timers unless specifically asked to modify or remove them
- Add new timers when requested
- Modify timer durations, titles, or messages as requested
- Return ALL timers (modified and unmodified) in the correct order
- Parse time expressions like "5 minutes", "1 hour", "30 seconds"`;

    // Add current room context to the prompt
    if (currentRoom && currentRoom.timers) {
      const timersList = currentRoom.timers
        .map(
          (t, i) =>
            `${i + 1}. "${t.title}" - ${Math.floor(t.totalSeconds / 60)}:${String(t.totalSeconds % 60).padStart(2, "0")} (${t.message || "no description"})`
        )
        .join("\n");

      userPrompt = `Current room: "${currentRoom.roomName}"\nCurrent timers:\n${timersList}\n\nEdit request: ${prompt}`;
    }
    maxTokens = 1500;
  } else if (type === "room") {
    systemPrompt = `You are a timer room generator. Given a user's description, create a structured timer sequence.

Return ONLY a valid JSON object with this exact structure:
{
  "roomName": "Name of the timer room",
  "timers": [
    {
      "title": "Timer name",
      "message": "Brief description",
      "seconds": 300
    }
  ]
}

Rules:
- roomName should be concise and descriptive
- Each timer needs title, message, and seconds (as a number)
- Seconds should be realistic (60-3600 typically)
- Create 3-8 timers depending on the activity
- Order timers logically

Examples:
- "sales pitch" → timers for intro, problem, solution, demo, pricing, Q&A, close
- "morning routine" → timers for exercise, shower, breakfast, planning
- "team meeting" → timers for check-in, updates, discussion, action items`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({
        error: error.error?.message || "Failed to generate",
      });
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    const result = JSON.parse(content);

    return res.status(200).json(result);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate",
    });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
