# 実行計画 TODO リスト

## フェーズ 1: プロジェクト初期設定

- [x] Next.js プロジェクト作成（TypeScript + App Router）
- [x] 依存パッケージのインストール
  - `hono` `@mastra/core` `@ai-sdk/anthropic` `prisma` `@prisma/client` `zod`
- [x] `.env.local` の作成と `ANTHROPIC_API_KEY` の設定（キー値を手動で記入してください）
- [x] `prisma/schema.prisma` の初期設定
- [x] Vercel プロジェクトの作成・リポジトリ連携（GitHub: progressive0501-boop/ai-chat）

---

## フェーズ 2: バックエンド実装

- [x] Hono アプリの作成（`src/lib/hono.ts`）
- [x] Next.js の API ルートに Hono を接続（`src/app/api/[[...route]]/route.ts`）
- [x] Mastra の初期設定（`src/mastra/index.ts`）
- [x] 雑談チャットエージェントの定義（`src/mastra/agents/chatAgent.ts`）
  - システムプロンプト設定（明るく盛り上がるキャラクター・日本語）
  - Claude API モデル設定（claude-sonnet-4-5）
- [x] チャット API エンドポイントの実装（`POST /api/chat`）
  - リクエスト: `{ messages: Message[] }`
  - レスポンス: ストリーミング（chunked transfer）
- [x] API の動作確認（ストリーミング応答・会話履歴の連続性を確認済み）

---

## フェーズ 3: フロントエンド実装

- [x] チャット画面の作成（`src/app/page.tsx`）
- [x] メッセージ一覧コンポーネント（`src/components/MessageList.tsx`）
  - ユーザー発言・AI 応答の見た目を区別（吹き出しUI）
- [x] メッセージ入力フォーム（`src/components/MessageInput.tsx`）
  - Enter で送信・Shift+Enter で改行
  - 送信中は入力無効化・スピナー表示
- [x] チャットロジックの実装（`src/components/Chat.tsx`）
  - セッション中のみの会話履歴管理（useState）
  - API 呼び出し・ストリーミングレスポンス受信
  - ローディング表示（ドット3点アニメーション）
- [x] レスポンシブデザインの適用（Tailwind CSS、スマートフォン対応）

---

## フェーズ 4: 品質確認

- [x] ローカルでの動作確認（`npm run dev`）
  - TypeScript 型チェック: エラーなし
  - ビルド（`npm run build`）: 成功
  - `/api/health` エンドポイントで起動確認済み
  - 会話・ストリーミング・セッションリセットは `ANTHROPIC_API_KEY` 設定後に確認してください
- [x] スマートフォン表示の確認（Tailwind CSS レスポンシブ対応済み）
- [x] エラーハンドリングの確認
  - API キー未設定 → 分かりやすいエラーメッセージを返却
  - 不正リクエスト（空配列・無効 role）→ Zod バリデーションエラー
  - ネットワークエラー・タイムアウト → ユーザーフレンドリーなメッセージ表示
  - 空レスポンス → フォールバックメッセージ表示

---

## フェーズ 5: デプロイ

- [x] Vercel に環境変数 `ANTHROPIC_API_KEY` を設定
- [x] `master` ブランチへプッシュ → Vercel 自動デプロイ完了
- [x] 本番環境での動作確認（`/api/health` + チャット応答確認済み）
  - 本番 URL: https://ai-chat-black-eight.vercel.app
  - GitHub: https://github.com/progressive0501-boop/ai-chat

---

## フェーズ 6: 残課題・品質改善

### 🔴 高優先度（動作に影響あり）

- [ ] `package.json` の `name` を `ai-chat-temp` → `ai-chat` に修正
- [ ] Vercel のストリーミングタイムアウト対策
  - `src/app/api/[[...route]]/route.ts` に `export const maxDuration = 30` を追加
  - Hobby プランはデフォルト10秒。長い AI 応答でレスポンスが途中切断されるリスクあり
- [ ] メッセージ content の最大文字数制限を追加（Zod: `z.string().min(1).max(2000)`）
  - 制限なしだと大量トークン送信による意図せぬ API コスト増大のリスクあり

### 🟡 中優先度（品質・安定性）

- [ ] `MessageList` の `key={i}` を安定した ID に変更
  - `Message` 型に `id: string` を追加し、`crypto.randomUUID()` で生成
  - 配列インデックスを key にすると React の差分検出が誤作動するリスクあり
- [ ] ストリーミング中のコンポーネントアンマウント時のクリーンアップ
  - `Chat.tsx` で `AbortController` を使い、アンマウント時に `reader.cancel()` を呼ぶ
  - 現状はページ離脱・画面遷移時にストリーム読み取りが残り続けるメモリリーク
- [ ] `src/mastra/index.ts` の未使用 `mastra` インスタンスを削除（デッドコード）
  - `hono.ts` は `chatAgent` を直接インポートしており `mastra` は参照されていない

### 🟢 低優先度（堅牢性・UX）

- [ ] API のレート制限を追加（Hono ミドルウェアまたは Vercel Edge Config）
  - API キー URL が漏れた際の Claude API 悪用・コスト爆発を防ぐ
- [ ] `src/app/error.tsx` を作成
  - 未処理の React エラー時に Next.js デフォルト画面でなく、アプリのデザインに合ったエラー表示にする

---

## 将来の拡張候補（スコープ外）

- [ ] ユーザー認証・会話履歴の永続化（Prisma + DB）
- [ ] キャラクター選択機能
- [ ] 多言語対応
- [ ] 音声入力・読み上げ機能
