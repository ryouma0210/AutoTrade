# 自動トレード

Expo SDK 57 / React Native 0.86 のローカルファースト株式管理・自動売却アプリです。SQLite に保有銘柄、売買履歴、売却ルール、資産推移を保存し、証券会社の認証情報だけを SecureStore に保存します。

## 開発

```bash
npm install
npm start
npm run typecheck
npm test
```

初回起動時はデモ銘柄が入り、価格更新と売却判定を安全に試せます。実口座モードは `src/services/broker.ts` の汎用 HTTP アダプターを、利用する証券会社の認証・注文仕様へ合わせて実装してから使用してください。

デモ銘柄は`stg`およびローカル開発時のみ投入されます。`production`ではデモデータを投入せず、保有銘柄が空の状態で開始します。過去のビルドで作成済みのSQLiteデータはアップデート後も残るため、既存端末で確認する場合はアプリを再インストールするかアプリデータを削除してください。

重要: サーバーを置かない構成では、OSに停止された後も継続する常時監視や厳密な時刻での自動売却は保証できません。0.1.0 はアプリ起動中の価格更新時に判定します。

## GitHub Actions / APK配布

1. FishingWalkと同じrclone設定をBase64化し、GitHub Repository Secret `GDRIVE_RCLONE_CONFIG_BASE64` に登録する。
2. `stg` / `production` へのpushでGitHub ActionsがExpo PrebuildとGradleを実行する。
3. `auto-trade-stg-v0.1.0.apk`はDriveの`STG`フォルダーへ、`auto-trade-prd-v0.1.0.apk`は`PRD`フォルダーへアップロードする。

EAS Buildは使用しないため、`EXPO_TOKEN`とEAS projectIdは不要です。

ブランチ構成: `main`（開発）、`stg`（検証）、`production`（本番）
