# Google Play提出資料

パッケージ：`jp.pilgrimapp`。初回 `versionCode=1` / `versionName=1.0`。

## 掲載

- `listing-ja.txt`：日本語掲載文、公開連絡先 `yabasubro@gmail.com`
- `assets/icon-512.png`：512×512、独自作成の地図・ピンのアイコン
- `assets/feature-1024x500.png`：1024×500、紹介画像
- `review-access.txt`：審査用案内。認証情報は含まない
- スクリーンショット：実機接続待ち。実際のAndroid画面を撮影し、個人情報を含まないことを目視確認して追加する

素材は既存のアプリ配色に合わせた幾何学的デザイン。作品キャラクター等の画像は含めない。Androidランチャーにも同じアイコンを設定する。再生成は Pillow を導入したPythonで `scripts/release/store-art.py` を実行する（日本語フォントはmacOSのヒラギノ）。

## 署名とビルド

アップロード鍵と `signing.env` はリポジトリ外の専用フォルダで管理する。このMacでは `~/.local/share/pilgrimapp-release/`。パスワードや秘密鍵をGit・チャット・ストア掲載素材へ含めない。

Node 24、JDK 21、Android SDKを設定した環境で：

```sh
node --env-file="$HOME/.local/share/pilgrimapp-release/signing.env" scripts/release/android.mjs
```

出力：`android/app/build/outputs/bundle/release/app-release.aab`。
ローカル検証用のリリースAPK：`android/app/build/outputs/apk/release/app-release.apk`。

初回提出時はPlay App SigningでGoogle側のアプリ署名鍵を作成し、このローカル鍵をアップロード鍵として使う。既存のデバッグAPKは署名が違うためリリースAPKで上書きできない。確認のために普段使いのアプリを無断でアンインストールしない。Play経由での実機確認は内部テスト配布後に行う。

秘密鍵とパスワードは暗号化された別媒体・パスワード管理ツールにもバックアップする。このMac内だけの保存では故障対策にならない。公開証明書 `upload-certificate.pem` には秘密鍵は含まれない。次のPlayアップロード時はversionCodeを増やす。

## 審査・申告の残作業

対象年齢は運営方針の確定待ち。作品名から機械的に年齢区分を決めない。UGC写真あり、通報・ブロックあり。ログインが必要な機能あり。広告は実際の最終配布版に合わせて回答する。

Transitの公開利用規約を確認したが、個人データの保持・IP推定・二次利用の説明は確認できていない。申告上の「共有なし」を断定していない。`data-safety.md` を参照。

本人確認・電話番号確認、ConsoleへのAABアップロード、申告の送信、テスト開始日時の設定は別工程。今日SNSで募集済みというユーザー報告あり。開始日が確定してから再案内する。
