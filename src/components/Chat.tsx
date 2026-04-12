"use client";

import { useState, useCallback } from "react";
import MessageList, { type Message } from "./MessageList";
import MessageInput from "./MessageInput";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async () => {
    const userText = input.trim();
    if (!userText || isLoading) return;

    const userMessage: Message = { role: "user", content: userText };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    // AI 応答プレースホルダーを追加してストリーミング中も表示
    setMessages([...nextMessages, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "不明なエラーが発生しました" }));
        throw new Error(err.error ?? "APIエラーが発生しました");
      }

      if (!res.body) throw new Error("レスポンスボディがありません");

      // ストリーミング受信
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages([
          ...nextMessages,
          { role: "assistant", content: accumulated },
        ]);
      }

      // 空レスポンス対応
      if (!accumulated.trim()) {
        setMessages([
          ...nextMessages,
          { role: "assistant", content: "ごめんなさい、うまく応答できませんでした 😅 もう一度話しかけてみてください！" },
        ]);
      }
    } catch (err) {
      // ネットワークエラー・タイムアウト・APIエラーをユーザーフレンドリーなメッセージで表示
      let errorText = "エラーが発生しました。もう一度試してみてください 🙏";

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorText = "通信がタイムアウトしました。ネットワーク状況を確認してください。";
        } else if (err.message.includes("API キー") || err.message.includes("API key")) {
          errorText = err.message;
        } else if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
          errorText = "ネットワークエラーが発生しました。接続を確認してください。";
        } else if (err.message) {
          errorText = err.message;
        }
      }

      setMessages([
        ...nextMessages,
        { role: "assistant", content: `⚠️ ${errorText}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  const isAiTyping = isLoading && messages.at(-1)?.role === "assistant" && messages.at(-1)?.content === "";

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} isLoading={isAiTyping} />
      <MessageInput
        value={input}
        onChange={setInput}
        onSubmit={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
