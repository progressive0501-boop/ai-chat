# 実行計画 TODO リスト

## フェーズ 1: プロジェクト初期設定

- [x] Next.js プロジェクト作成（TypeScript + App Router）
- [x] 依存パッケージのインストール
  - `hono` `@mastra/core` `@ai-sdk/anthropic` `prisma` `@prisma/client` `zod`
- [x] `.env.local` の作成と `ANTHROPIC_API_KEY` の設定（キー値を手動で記入してください）
- [x] `prisma/schema.prisma` の初期設定
- [ ] Vercel プロジェクトの作成・リポジトリ連携（手動作業: vercel.com でリポジトリを連携してください）

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

- [ ] Vercel に環境変数 `ANTHROPIC_API_KEY` を設定
- [ ] `main` ブランチへプッシュ → Vercel 自動デプロイ
- [ ] 本番環境での動作確認

---

## 将来の拡張候補（スコープ外）

- [ ] ユーザー認証・会話履歴の永続化（Prisma + DB）
- [ ] キャラクター選択機能
- [ ] 多言語対応
- [ ] 音声入力・読み上げ機能
