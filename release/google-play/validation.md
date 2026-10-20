# 検証記録（2026-10-20）

- Nodeテスト40件成功。
- TypeScript・Vite本番ビルド成功。
- 変更したプライバシー画面とビルドスクリプトのESLint成功。
- ローカル本番プレビューでプライバシー説明と連絡先を表示確認。
- Gradle bundleRelease / assembleRelease、lintVitalRelease成功。
- Google bundletool 1.18.1 validate成功。
- AABの452ペイロードエントリについてJarFileの署名検証成功、すべて同一証明書。
- APKはapksigner検証成功。
- Releaseのマージ済み権限はINTERNETと自アプリの内部レシーバー権限のみ。GPS・広告ID・写真全体読み取り権限なし。debuggable指定なし。
- AAB内に秘密鍵・signing.envはなく、公開連絡先yabasubro@gmail.comを含むことを確認。
- ストア画像を目視確認。アイコン512×512、紹介画像1024×500。

AAB SHA256：`df2ba82dbf36c117b0650095517ccad1b87cc8e7022e6244e679b5ffe5470293`

アップロード証明書SHA256：`de01158dd0d204490fe710bd412560b57722cfc19ce19353480ce5a4599b355b`

標準jarsignerはAndroid Gradle Plugin生成ZIPのエントリ順序によるJarInputStream警告と自己署名証明書の信頼チェーン警告を表示した。AABの構造をbundletool、ペイロード署名をJarFileで個別確認済み。Play Consoleへの受け入れ確認は未実施。

端末はオフライン。今回のリリース署名版の実機起動、掲載スクリーンショット、最終通信観測は未確認。既存デバッグ版を無断アンインストールしない。
