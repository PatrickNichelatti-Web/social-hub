export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500 });
  }

  try {
    const { prompt, useWebSearch } = await req.json();

    const body = {
      model: "claude-sonnet-4-20250514",
      max_tokens: useWebSearch ? 8000 : 5000,
      messages: [{ role: "user", content: prompt }],
    };

    if (useWebSearch) {
      body.tools = [{ type: "web_search_20250305", name: "web_search" }];
    }

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json();
      return new Response(JSON.stringify({ error: err.error?.message || "API Error" }), { status: resp.status });
    }

    const data = await resp.json();
    const text = (data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "")
      .replace(/```json|```/g, "").trim();

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
