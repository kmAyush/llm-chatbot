const express = require("express");
const { Ollama } = require("ollama");
const app = express();

app.use(express.json());

const ollama = new Ollama({ host: "http://localhost:11434" }); // Ollama default host

app.post("/chat/stream", async (req, res) => {
  const { query } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await ollama.chat({
      model: "llama3", // Replace with your model (e.g., mistral, grok)
      messages: [{ role: "user", content: query }],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.message.content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    res.write("event: close\ndata: {}\n\n");
    res.end();
  } catch (error) {
    console.error("Error:", error);
    res.write(`data: ${JSON.stringify({ error: "Server error" })}\n\n`);
    res.end();
  }
});

app.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});
