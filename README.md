# test-lnar-hosting-typescript

Notes API と MCP サーバーの TypeScript 実装です。

## 起動方法

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Express API サーバーを起動（ターミナル 1）

```bash
npm run start:api
```

デフォルトポート: http://localhost:3000

開発モード（ファイル変更時に自動再起動）:

```bash
npm run dev:api
```

### 3. MCP サーバーを起動（ターミナル 2）

stdio transport（Claude Desktop / MCP Inspector などで使用）:

```bash
npm run start:mcp
```

### 4. MCP Inspector で動作確認

```bash
npx @modelcontextprotocol/inspector tsx src/mcp_server.ts
```

## API エンドポイント

| メソッド | パス           | 説明                     |
|--------|----------------|--------------------------|
| GET    | /notes         | ノート一覧を取得           |
| POST   | /notes         | ノートを作成               |
| GET    | /notes/:id     | IDでノートを取得           |
| PUT    | /notes/:id     | ノートを更新               |
| DELETE | /notes/:id     | ノートを削除               |

## MCP ツール

| ツール名      | 説明                         |
|-------------|------------------------------|
| list_notes  | すべてのノートを一覧表示        |
| create_note | 新しいノートを作成              |
| get_note    | IDでノートを取得               |
| update_note | タイトルまたは本文を更新         |
| delete_note | ノートを削除                   |

## 環境変数

| 変数名          | 説明                         | デフォルト値              |
|----------------|------------------------------|--------------------------|
| `PORT`         | API サーバーのポート番号        | `3000`                   |
| `API_BASE_URL` | MCP サーバーが接続する API URL  | `http://localhost:3000`  |
