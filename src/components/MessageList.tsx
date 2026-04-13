import { useEffect, useRef } from "react";

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; dataUrl: string; mediaType: string };

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string | ContentPart[];
};

type Props = {
  messages: Message[];
  isLoading: boolean;
};

function MessageContent({ content }: { content: string | ContentPart[] }) {
  if (typeof content === "string") {
    return <>{content}</>;
  }
  return (
    <div className="space-y-2">
      {content.map((part, i) => {
        if (part.type === "text") {
          return (
            <p key={i} className="whitespace-pre-wrap">
              {part.text}
            </p>
          );
        }
        return (
          <img
            key={i}
            src={part.dataUrl}
            alt="添付画像"
            className="max-w-full rounded-lg block"
          />
        );
      })}
    </div>
  );
}

export default function MessageList({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-gray-400">
          <span className="text-5xl">💬</span>
          <p className="text-lg font-medium">気軽に話しかけてね！</p>
          <p className="text-sm">何でも話せる雑談ボットだよ 😊</p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-end gap-2 ${
            msg.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {msg.role === "assistant" && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow">
              AI
            </div>
          )}

          <div
            className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
              msg.role === "user"
                ? "bg-violet-600 text-white rounded-br-sm"
                : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
            }`}
          >
            <MessageContent content={msg.content} />
          </div>

          {msg.role === "user" && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold shadow">
              You
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex items-end gap-2 justify-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow">
            AI
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
            <div className="flex gap-1 items-center h-4">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
