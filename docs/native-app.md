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
- Android: Android Studio 2025.2.1以降とAndroid SDK。JDK 21を使用する。最新Android Studioの同梱JDKが25の場合、現在のGradle 8.14.3では利用できないため、別途JDK 21を指定する

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

1. Androidは実機で起動確認する。iOSはXcode導入後にシミュレーターで確認する
2. アプリアイコンとスプラッシュ画像を正式素材へ変更する
3. Mapboxの公開トークン制限にiOS Bundle IDとAndroidアプリを追加する
4. Supabase認証のUniversal Links / App Linksを設定する
5. 実機で地図、ログイン、ルート作成、外部リンク、言語切替を確認する
6. Apple・Googleのストア掲載情報、プライバシー申告、スクリーンショットを準備する

ストアへの公開にはAppleとGoogleそれぞれの開発者登録が必要で、ローカル開発とは別に費用が発生する。

## AndroidのデバッグAPK作成（Android優先）

このMacにはAndroid StudioとSDK管理ツールを導入済み。エミュレーターは容量を節約するため未導入。
SDKには `platform-tools`、`platforms;android-36`、`build-tools;35.0.0` を使用する（36.0.0も導入済み。Gradleの既定は35.0.0）。

JDK 21とSDKの保存先を指定してからビルドする（JDKのディレクトリ名はインストールした版に合わせる）:

```sh
export JAVA_HOME="$HOME/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
npm run mobile:build:android
```

APKの出力先は `android/app/build/outputs/apk/debug/app-debug.apk`。
デバッグ署名付きの実機確認用であり、ストア提出用ではない。署名鍵や `.env` を共有しない。

Android Studioで開く場合も、Settings > Build, Execution, Deployment > Build Tools > Gradle の Gradle JDK に同じJDK 21を指定する。

### 実機で確認する

1. Android端末の開発者向けオプションでUSBデバッグを有効にし、MacへUSB接続する。
2. 端末に表示される接続許可を確認する。
3. `adb devices` で接続を確認し、`adb install -r android/app/build/outputs/apk/debug/app-debug.apk` でインストールする。
4. ピルグリマップを開き、地図表示、ログイン、ルート作成、外部リンク、言語切替、戻るボタンを確認する。

初回ビルドはGradleと依存ライブラリの取得にネット接続と追加の空き容量が必要。

### 確認結果（2026-10-13）

- Android Studio 2026.2.1、Temurin JDK 21.0.12.1、Android SDK API 36を導入。
- Webの本番ビルド、Androidへの同期、Web/AI/認証リンクの22テストが成功。
- `./gradlew --no-daemon --max-workers=2 assembleDebug testDebugUnitTest` が成功。
- Android単体テストは生成時のサンプル1件のみ。画面・地図・認証の動作保証ではない。
- APK約4.7MB、アプリID `jp.pilgrimapp`、min SDK 24、target SDK 36、デバッグ署名v2の検証に成功。
- Android端末は未接続。実機起動と画面操作は未確認。ストア公開用署名・公開は未実施。


### リリース準備（2026-10-18）

- 10月13日以降、ユーザーがワイヤレスデバッグで実機にインストールし、動作を確認済み。今回の写真・退会・通報・ブロック機能を含む更新版は、改めて実機で確認する。
- 退会・通報・ブロックのDB定義と退会用Edge Functionは配置済み。Web公開後の `/delete-account` を確認してからPlay Consoleへ登録する。
- Androidの署名鍵（`.jks` / `.keystore`）と `keystore.properties` はGitの対象外。現在のAPKはデバッグ署名で、Play提出用ではない。
- Play提出前に必要なのは、開発者アカウントの状態確認、既存のアップロード鍵の有無確認、署名付きAABの作成、掲載情報・データセーフティ申告、更新版の実機確認。
- アップロード鍵がすでに存在する場合は継続利用し、勝手に作り直さない。鍵とパスワードのバックアップはリポジトリ外に保管する。
