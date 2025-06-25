# Expo Monitor Today

2025年大阪万博のパビリオン空き状況を監視し、空きが出た際にSlackに通知するシステムです。

## 機能

- 指定したパビリオンの予約状況を定期的に監視
- 空きまたは残りわずかの状態になった際にSlack通知
- 設定ファイルによる柔軟な監視条件設定
- デバッグモード対応

## 設定項目

### 設定ファイル
`config.json`

### Slack設定
- `webhookUrl`: SlackのWebhook URL（必須）
- `channel`: 通知先チャンネル
- `username`: Bot表示名
- `iconEmoji`: Bot用絵文字

### 監視設定
- `interval`: API呼び出し間隔（秒）
- `pavilions`: 監視対象パビリオンコードの配列
- `notifyOnStatus`: 通知対象ステータス（0=空きあり、1=残りわずか）

### API設定
- `dataUrl`: Expo API(非公式)のURL
- `timeout`: APIタイムアウト（ミリ秒）

## 主要パビリオンコード

よく監視されるパビリオン：

| コード | パビリオン名 |
|--------|-------------|
| H1H9   | 日本館 |
| I900   | いのちの遊び場（クラゲ館） |
| HQH0   | ガンダム |
| HGH0   | ノモの国（パナソニック） |
| C9J0   | 韓国館 |
| HIH0   | 三菱未来館 |
| IC00   | null²（落合陽一） |
| IF00   | いのち動的平衡館（福岡伸一） |

全パビリオンコードは `PAVILION_LIST.md` を参照してください。

## 実行方法

### ローカル実行

#### 1. プロジェクトのクローン

```bash
git clone https://github.com/your-repo/expo-real-time-monitoring.git
```

#### 2. 依存関係のインストール

```bash
npm install
```

#### 3. 設定ファイルの作成

`config.sample.json` をコピーして `config.json` を作成してください：

```bash
cp config.sample.json config.json
```

#### 4. 設定ファイルの編集

`config.json` を編集して、SlackのWebhook URLと監視対象パビリオンを設定してください：

#### 5. 実行
```bash
# 通常実行
npm start

# デバッグモード
npm run dev

# もしくは
node index.js --debug
```

### Docker実行

#### 1. 必要なファイルの準備
```bash
# 設定ファイル
# config.json を編集してSlack Webhook URLと監視パビリオンを設定
cp config.sample.json config.json

# docker-composeファイル
# もしくはscpなど
touch docker-compose.prod.yml # 本番環境
touch docker-compose.yml
```

#### 2. Docker Composeで実行

##### 本番環境（事前ビルド済みイメージ使用）

###### 推奨: デプロイスクリプト使用
```bash
# 本番サーバー上のプロジェクトディレクトリで実行
cd /path/to/expo-real-time-monitoring  # 本番環境のプロジェクトパス
./deploy.sh  # 自動デプロイ（最新イメージプル + 起動確認含む）
```

##### 開発・テスト環境
```bash
# 通常モード
docker-compose up -d

# デバッグモード
docker-compose --profile dev up app-dev

# ログ確認
docker-compose logs -f expo-real-time-monitoring-dev

# 停止
docker-compose down
```

## 使用方法

1. システムを起動すると、設定した間隔でAPIを監視開始
2. 指定したパビリオンに空きが出ると自動でSlack通知
3. `Ctrl+C` で停止

## 通知内容

Slackには以下の情報が通知されます：

- パビリオン名
- 空き状況（空きあり/残りわずか）
- 時間帯
- パビリオンコード
- 予約ページへのリンク

## 注意事項

1. **API負荷**: 短い間隔（1-2秒）での監視はAPIサーバーに負荷をかける可能性があります
2. **営業時間**: 万博の営業時間外（通常9:00-21:00以外）はデータが空になります
3. **予約URL**: 生成される予約URLは基本形式のため、実際の予約にはticketIDsの設定が必要な場合があります
4. **重複通知**: 同じ空きに対して複数回通知される可能性があります

## トラブルシューティング

### エラー: 設定ファイルが見つからない
```
設定ファイルの読み込みに失敗しました: ./config.json
```
- `config.json` ファイルが存在することを確認
- `config.sample.json` をコピーして作成

### エラー: Slack通知送信失敗
```
Slack通知送信エラー: Request failed with status code 404
```
- Webhook URLが正しいことを確認
- Slackワークスペースの設定を確認

### 空きが出ているのに通知されない
- `config.json` の `pavilions` 配列に対象パビリオンコードが含まれているか確認
- デバッグモードで動作状況を確認
- 営業時間内かどうか確認

## ライセンス

MIT License