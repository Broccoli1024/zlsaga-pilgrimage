# ネイティブアプリ開発

ピルグリマップは、Web版と同じReact/ViteコードをCapacitor 8でiOS・Androidへ配布する構成にした。アプリIDは両OSとも `jp.pilgrimapp`、表示名は「ピルグリマップ」。Web版のビルド出力 `dist` を各ネイティブプロジェクトへ同期する。

## 現在できていること

- `ios/` と `android/` のネイティブプロジェクトを生成済み
- Mapbox、Supabase、日英表示を含むWeb版をアプリ内へ同期可能
- Androidの戻るボタンをReact Routerの画面履歴と同期
- 認証確認・パスワード再設定メールは `capacitor://localhost` ではなく公開Web版へ戻す
- iOSはSwift Package Managerを使用し、現時点ではCocoaPods不要
- 秘密鍵をネイティブプロジェクトへ保存しない

## 必要な開発環境

共通でNode.js 24系を使用する。

- iOS: Xcode 26以降。現在のMacにはCommand Line Toolsのみあり、Xcode本体は未導入
- Android: Android Studio 2025.2.1以降とAndroid SDK。Android Studio同梱JDKを使用できる

XcodeやAndroid Studioのインストールは容量が大きいため、OS標準のApp Storeまたは各公式サイトから別途行う。

## 初回セットアップ

```sh
npm ci
test -f .env || cp .env.example .env
# .env にVITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY、VITE_MAPBOX_TOKENを設定
npm run mobile:sync
```

`VITE_` で始まる値はアプリにも含まれる公開設定である。Supabaseの `service_role`、AIのAPIキー、署名鍵は設定しない。

## 開発手順

Web側を変更するたびに同期する。

```sh
npm run mobile:sync
```

iOSを開く:

```sh
npm run mobile:open:ios
```

Androidを開く:

```sh
npm run mobile:open:android
```

ネイティブプロジェクトを作り直す場合だけ `mobile:add:ios` / `mobile:add:android` を使う。通常の更新で再実行しない。

## 認証リンク

現段階では、新規登録の確認メールとパスワード再設定メールは `https://pilgrimapp.jp/` へ移動し、ブラウザー上で処理する。これによりSupabaseへ未登録の内部URLがメールに入ることを防ぐ。

アプリへ直接戻すUniversal Links / App Linksは次の段階で追加する。公開にはApple DeveloperのTeam ID、Android署名証明書、`pilgrimapp.jp` 配下の関連付けファイル、Supabase Authの許可URL設定が必要になる。

## 公開前に必要な作業

1. XcodeとAndroid Studioを導入し、シミュレーターで起動する
2. アプリアイコンとスプラッシュ画像を正式素材へ変更する
3. Mapboxの公開トークン制限にiOS Bundle IDとAndroidアプリを追加する
4. Supabase認証のUniversal Links / App Linksを設定する
5. 実機で地図、ログイン、ルート作成、外部リンク、言語切替を確認する
6. Apple・Googleのストア掲載情報、プライバシー申告、スクリーンショットを準備する

ストアへの公開にはAppleとGoogleそれぞれの開発者登録が必要で、ローカル開発とは別に費用が発生する。
