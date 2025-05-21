import { Message } from "@/lib/types";
import { generateUUID } from "@/lib/utils";

const ollamaUrl = "http://localhost:11434/api/chat";

export const streamChat = async ({ inputContent, setIsLoading, append }) => {
  try {
    setIsLoading(true);

    const response = await fetch(ollamaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma:2b",  // For Gemma 2b model ollama setup
        messages: [{ role: "user", content: inputContent }],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("Stream completed");
        break;
      }

      // Append chunk to buffer and decode
      buffer += decoder.decode(value, { stream: true });

      // Split buffer by newlines to process complete JSON objects
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            const content = data.message?.content;
            if (content) {
              const message: Message = {
                id: generateUUID(),
                content,
                role: "assistant",
                parts: [{ type: "text", text: content }],
              };
              append(message);
            }
          } catch (err) {
            console.error("Error parsing JSON line:", err, line);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    setIsLoading(false);
  }
};
