import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { chatAgent } from "@/mastra/agents/chatAgent";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const chatSchema = z.object({
  messages: z.array(messageSchema).min(1),
});

const app = new Hono().basePath("/api");

// ヘルスチェック
app.get("/health", (c) => {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  return c.json({ status: "ok", apiKeyConfigured: hasApiKey });
});

app.post("/chat", zValidator("json", chatSchema), async (c) => {
  // API キー未設定チェック
  if (!process.env.ANTHROPIC_API_KEY) {
    return c.json(
      { error: "ANTHROPIC_API_KEY が設定されていません。.env.local を確認してください。" },
      500
    );
  }

  const { messages } = c.req.valid("json");

  const coreMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  try {
    const result = await chatAgent.stream(coreMessages);

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);

    const message =
      error instanceof Error && error.message.includes("API key")
        ? "API キーが無効です。ANTHROPIC_API_KEY を確認してください。"
        : "AI との通信中にエラーが発生しました。しばらく経ってから再試行してください。";

    return c.json({ error: message }, 500);
  }
});

export default app;
