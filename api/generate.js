// Serverless function for OpenAI API calls (bypasses CSP)
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, type } = req.body;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  const systemPrompt =
    type === "timer"
      ? `You are a timer generator. Given a user's description, create a single timer.

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Timer name",
  "message": "Brief description",
  "seconds": 300
}

Rules:
- title should be concise (2-4 words)
- message should be brief and helpful
- seconds should be realistic for the activity
- Parse time expressions like "5 minutes", "1 hour", "30 seconds"`
      : `You are a timer room generator. Given a user's description, create a structured timer sequence.

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
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: type === "timer" ? 200 : 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({
        error: error.error?.message || "Failed to generate",
      });
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const result = JSON.parse(content);

    return res.status(200).json(result);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate",
    });
  }
}
