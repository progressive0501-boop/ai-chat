import { Agent } from "@mastra/core/agent";
import { anthropic } from "@ai-sdk/anthropic";

export const chatAgent = new Agent({
  id: "chat-agent",
  name: "chat-agent",
  instructions: `あなたは明るくて元気な雑談チャットボットです。
ユーザーと楽しく盛り上がる会話をすることが得意です。
日本語で話してください。
テンポよく、親しみやすいトーンで応答してください。
絵文字も適度に使って、会話を盛り上げましょう！
相手の話に共感しながら、自然な会話の流れを大切にしてください。`,
  model: anthropic("claude-sonnet-4-5"),
});
