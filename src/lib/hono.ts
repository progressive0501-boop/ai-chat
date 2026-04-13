import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { chatAgent } from "@/mastra/agents/chatAgent";

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(50000),
});

// data URL の最大長: 5MB ファイルの base64 エンコード後 ≈ 6.7MB 文字
// Vercel Hobby プランのペイロード上限(4.5MB)に注意。本番環境では画像サイズを調整すること。
const imagePartSchema = z.object({
  type: z.literal("image"),
  dataUrl: z.string().startsWith("data:").max(8_000_000),
  mediaType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
});

const contentPartSchema = z.discriminatedUnion("type", [textPartSchema, imagePartSchema]);

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([
    z.string().min(1).max(50000),
    z.array(contentPartSchema).min(1),
  ]),
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

  const coreMessages = messages.map((m) => {
    if (typeof m.content === "string") {
      return {
        role: m.role as "user" | "assistant",
        content: m.content,
      };
    }

    return {
      role: m.role as "user" | "assistant",
      content: m.content.map((part) => {
        if (part.type === "text") {
          return { type: "text" as const, text: part.text };
        }
        // AI SDK の ImagePart には raw base64 を渡す（data URL ではなく）
        const base64 = part.dataUrl.includes(",")
          ? part.dataUrl.split(",")[1]
          : part.dataUrl;
        return {
          type: "image" as const,
          image: base64,
          mimeType: part.mediaType,
        };
      }),
    };
  });

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
