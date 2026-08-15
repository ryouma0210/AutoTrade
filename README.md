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

重要: サーバーを置かない構成では、OSに停止された後も継続する常時監視や厳密な時刻での自動売却は保証できません。0.1.0 はアプリ起動中の価格更新時に判定します。

## EAS / GitHub Actions

1. `npx eas init` を実行し、`app.json` の `REPLACE_WITH_EAS_PROJECT_ID` を実際の projectId に置き換える。
2. GitHub Secrets に `EXPO_TOKEN` と、Drive APIを有効化したGoogle CloudサービスアカウントJSON `GDRIVE_SERVICE_ACCOUNT_JSON` を登録する。
3. Driveフォルダー `10OYIyP7Qm4w0z4sZARcwcPHhSQxYWlML` をサービスアカウントへ「編集者」で共有する。
4. `stg` / `production` への push で、それぞれ `auto-trade-stg-v0.1.0.apk` / `auto-trade-prd-v0.1.0.apk` を生成する。

ブランチ構成: `main`（開発）、`stg`（検証）、`production`（本番）
