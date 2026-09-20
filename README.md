# ピルグリマップ

『ゾンビランドサガ』の聖地・観光スポットを探し、巡礼ルートを計画するWebアプリ。

## 技術構成

- React 19 / TypeScript 6 / Vite 8 / React Router 7 / Tailwind CSS 4
- Mapbox GL / react-map-gl、i18next（日英）、Zustand
- Supabase（PostgreSQL・認証・Edge Functions）、Vercel（公開・middleware・sitemap API）
- Node.js 24系、npm、正式なロックファイルは `package-lock.json`

## ローカル起動

Node.js 24系をインストール。nvmを使用する場合は `nvm install && nvm use`。

```sh
npm ci
# 初回のみ。既存の .env / .env.local は上書きしない
test -f .env || cp .env.example .env
# .env をエディターで設定してから起動
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

開くURL: http://127.0.0.1:5173/ 。終了は Ctrl+C。

フロントエンドの必須設定:

| 環境変数 | 内容 |
| --- | --- |
| `VITE_SUPABASE_URL` | 接続先SupabaseのURL |
| `VITE_SUPABASE_ANON_KEY` | 公開用anonキー。service_roleキーは禁止 |
| `VITE_MAPBOX_TOKEN` | ブラウザー用公開トークン。localhostを許可したもの |

Viteは `.env.local` を `.env` より優先する。既存の `.env.local` がある環境では値の重複に注意。`VITE_` の変数は公開バンドルに含まれるため、AIのAPIキーや管理者キーを入れない。`.env*` はGit除外、テンプレートだけを追跡する。

### このMacのCodexで npm が見つからない場合

同梱NodeだけをPATHに追加してもnpmは付属していない場合がある。この環境では以下で実行できる（初回はnpmの取得にネットワーク接続が必要）。

```sh
export PATH="/Users/maeda.riku/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
pnpm --package=npm@11 dlx npm ci
pnpm --package=npm@11 dlx npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

これはnpmを起動するための補助であり、依存関係の管理はnpmで行う。`pnpm install` や `pnpm-lock.yaml` の追加は不要。

## 検証

```sh
npm run typecheck
npm run build
npm test
npm run lint:ai
npm run lint
npm run preview -- --host 127.0.0.1 --port 4173
```

`npm test` は開発AI連携のオフラインテスト。フロントエンド全体の回帰テストではない。既存の全体lintには未解決エラーがある。ビルド時の500kB超チャンク警告は既存課題。

Vite開発サーバーとpreviewはVercelの `middleware.ts` / `api/sitemap.ts` を実行しない。sitemapやサーバー側メタタグはVercel環境で別途検証する。

## SupabaseとDB

通常のフロントエンド開発は、設定済みのSupabaseに接続する。既存 `.env.local` は保持した。接続先が本番の場合、管理・チェックイン・保存等は本番データを変更するため、開発には別プロジェクトを推奨する。

このリポジトリのマイグレーションは重複統合用の1本だけで、初期スキーマや完全なseedは含まれていない。そのため、現在のファイルだけで空のローカルPostgreSQLから完全再現することはできない。DBを完全ローカル化するには、権限・RLS・関数を含むスキーマと個人情報を除いたseedを別途整備する必要がある。既存DBへの `db reset` / `db push` は環境構築の手順として実行しない。

Edge FunctionsはDenoを使用し、Nodeのビルド対象外。追加シークレットの一覧は `supabase/functions/.env.example`。それらはSupabase側のシークレット管理に設定し、フロントエンドの環境変数に混ぜない。

## AdSense

サイト所有者の確認は `index.html` の `google-adsense-account` メタタグと `public/ads.txt` で行う。全ページ共通の自動広告スクリプトは読み込まない。再審査前の確認と、承認後に広告を戻す範囲は `docs/adsense-review-checklist.md` を参照する。

## マルチモデル開発CLI

```sh
# APIキー不要・通信なし。固定サンプルで経路を確認
npm run ai -- --mock "加算関数の実装とレビュー"

# .env にAPIキーと利用可能なモデルIDを設定後、各社1回ずつ疎通
npm run ai -- --smoke-live

# 指定したコードのみをコンテキストとして送る
npm run ai -- --live "このコードの改善案とレビューを作成" --context src/components/ui/LangToggle.tsx
```

実装は `scripts/ai/`。ブラウザー側からimportせず、Node.js 24の組み込みfetchとTypeScript実行機能を使う。追加のAI SDKや常駐APIサーバーは不要。

1. OpenAI Responses APIで計画（ChatGPTの司令塔役をAPIモデルで実装）。
2. Jev Choice APIで `CODE` / `REVIEW` / `ASK_USER` を判定。
3. `CODE` の場合はClaude Messages APIでコード案、続いてレビュー。`REVIEW` はレビューのみ。
4. OpenAIで結果を統合。JSON形式の共通結果を標準出力へ返す。

共通I/OはTypeScriptで定義し、HTTP応答のテキスト・Jevの選択肢・確率分布を実行時に検証。コード本文は自由テキストとして保持する。モデルにJSONのコード本文を強制する実装ではない。

この最小版はコード案・レビューを返す。生成コードの自動適用、シェル実行、Git操作、DB更新、デプロイは行わない。実装担当者が提案を確認して適用・テストする。

設定は `.env`、次に `.env.local` を読む（シェル環境変数が最優先）。`OPENAI_MODEL` と `ANTHROPIC_MODEL` は、そのAPIアカウントで使用できるIDを指定する。`JEV_MODEL=jev-latest` はTypeSafe公式のエイリアスで、結果の再現性が必要なら利用可能な固定モデルIDへ変更する。ChatGPT/ClaudeのWeb契約とは別にAPI利用設定が必要。

- 既定はmock。`--live` または `--smoke-live` を明示した場合だけ通信する。
- リクエストと `--context` のファイル内容、生成途中の内容は3社に送信される。秘密情報・個人データを渡さない。リポジトリの自動収集は行わない。
- 通常は最大5 API呼び出し（CODE）、REVIEWは4、ASK_USERは2。各リクエストは30秒のタイムアウト。自動再試行はしない。
- 計画・コード・レビュー・統合は各4096出力トークン上限。全体の金額上限ではない。提供元でも利用上限を設定する。
- Jevのconfidenceが0.6未満、またはASK_USERの場合は終了コード2。0.6は初期ヒューリスティックであり、正確性の保証ではない。
- 入力は依頼とコンテキスト合計24,000文字以内。設定不足、401/429、タイムアウト、不正応答、途中打ち切りは終了コード1。mockへの自動切り替えはしない。
- 成功時も `status: proposed` とし、適用・テスト済みとは扱わない。

公式仕様: [OpenAI Responses](https://developers.openai.com/api/docs/quickstart)、[Anthropic Messages](https://platform.claude.com/docs/en/api/overview)、[TypeSafe Choice](https://docs.typesafe.ai/primitives/choice)。
