// Vercel serverless function: POST /api/analyze
// Holds the Anthropic API key server-side. Never call api.anthropic.com
// directly from the browser — that would expose your key to every user.
//
// Setup:
//   1. Get an API key at https://console.anthropic.com
//   2. In the Vercel project: Settings → Environment Variables →
//      add ANTHROPIC_API_KEY = sk-ant-...
//   3. Deploy. Vercel auto-detects this file as a serverless function
//      at the URL /api/analyze — no extra config needed.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing prompt" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY is not set on the server" });
    return;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(502).json({ error: "Anthropic API error", detail: errText });
      return;
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: "Request failed", detail: String(err) });
  }
}
