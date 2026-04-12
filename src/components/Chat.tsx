"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import MessageList, { type Message } from "./MessageList";
import MessageInput from "./MessageInput";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // アンマウント時にストリーム読み取りをキャンセル
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(async () => {
    const userText = input.trim();
    if (!userText || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userText,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages([...nextMessages, { id: assistantId, role: "assistant", content: "" }]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
        signal: abortController.signal,
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

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages([
            ...nextMessages,
            { id: assistantId, role: "assistant", content: accumulated },
          ]);
        }
      } finally {
        reader.cancel();
      }

      // 空レスポンス対応
      if (!accumulated.trim()) {
        setMessages([
          ...nextMessages,
          {
            id: assistantId,
            role: "assistant",
            content: "ごめんなさい、うまく応答できませんでした 😅 もう一度話しかけてみてください！",
          },
        ]);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      let errorText = "エラーが発生しました。もう一度試してみてください 🙏";

      if (err instanceof Error) {
        if (err.message.includes("API キー") || err.message.includes("API key")) {
          errorText = err.message;
        } else if (
          err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError")
        ) {
          errorText = "ネットワークエラーが発生しました。接続を確認してください。";
        } else if (err.message) {
          errorText = err.message;
        }
      }

      setMessages([
        ...nextMessages,
        { id: crypto.randomUUID(), role: "assistant", content: `⚠️ ${errorText}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  const isAiTyping =
    isLoading && messages.at(-1)?.role === "assistant" && messages.at(-1)?.content === "";

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
