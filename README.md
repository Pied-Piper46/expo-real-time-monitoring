# Expo Real Time Monitoring

2025年大阪万博のパビリオン空き状況を監視し、空きが出た際にSlack/LINE/X(Twitter)/Discordに通知するシステムです。

## 機能

- 指定したパビリオンの予約状況を定期的に監視
- 空きまたは残りわずかの状態になった際に任意のプラットフォームに通知
- 環境変数による柔軟な設定管理
- ログ機能のオン/オフ切り替え
- デバッグモード対応
- 営業時間外の自動停止機能
- 通知制限機能（API制限回避）

## 設定方法

### 環境変数による設定

設定は全て環境変数で管理します。`.env`ファイルまたはクラウドサービスの環境変数として設定してください。

#### 必須設定（通知サービス利用時）

```bash
# Slack通知
SLACK_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# LINE通知
LINE_ENABLED=true
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LINE_CHANNEL_ACCESS_TOKEN

# X(Twitter) API
X_ENABLED=true
X_APP_KEY=YOUR_X_APP_KEY
X_APP_SECRET=YOUR_X_APP_SECRET
X_ACCESS_TOKEN=YOUR_X_ACCESS_TOKEN
X_ACCESS_SECRET=YOUR_X_ACCESS_SECRET

# Discord API設定
DISCORD_ENABLED=true
DISCORD_BOT_TOKEN=YOUR_DISCORD_TOKEN
DISCORD_CHANNEL_ID=DISCORD_CHANNEL_ID
```

#### 監視設定

```bash
MONITORING_INTERVAL=2                    # API呼び出し間隔（秒）
MONITORING_PAVILIONS=H1H9,I900,HQH0      # 監視対象パビリオン（カンマ区切り）
MONITORING_NOTIFY_ON_STATUS=0,1          # 通知対象ステータス（0=空きあり、1=残りわずか）
MONITORING_START_TIME=8:00               # 営業開始時刻
MONITORING_END_TIME=21:00                # 営業終了時刻
MONITORING_TIMEZONE=Asia/Tokyo           # タイムゾーン
```

#### 通知制限設定

```bash
NOTIFICATION_COOLDOWN_ENABLED=false     # 通知制限機能のオン/オフ
NOTIFICATION_COOLDOWN_DURATION=30       # 通知後のクールダウン時間（分）
NOTIFICATION_COOLDOWN_PER_PAVILION=true # パビリオン毎の個別クールダウン
```

#### その他設定

```bash
LOGGING_ENABLED=false                    # ログ記録のオン/オフ
LOGGING_FILE=./availability_log.jsonl    # ログファイルパス
DEBUG=false                              # デバッグモード
```

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

#### 1. リポジトリのクローン

```bash
git clone https://github.com/your-repo/expo-real-time-monitoring.git
```

#### 2. 依存関係のインストール

```bash
npm install
```

#### 3. 環境変数ファイルの作成

`.env.sample` をコピーして `.env` を作成してください：

```bash
cp .env.sample .env
```

#### 4. 環境変数の設定

`.env` ファイルを編集して、通知設定と監視対象パビリオンを設定してください：

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

#### 1. リポジトリのクローン
```bash
git clone https://github.com/your-repo/expo-real-time-monitoring.git
```

#### 2. 環境変数の設定
```bash
cp .env.sample .env
# .env ファイルを編集して必要な環境変数を設定
```

#### 3. Docker Composeで実行

##### 本番環境（事前ビルド済みイメージ使用）

###### 推奨: デプロイスクリプト使用
```bash
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
2. 指定したパビリオンに空きが出ると自動で通知
3. `Ctrl+C` で停止

## 通知内容

- パビリオン名
- 予約空き時間
- 空き状態（空きあり/残りわずか）
予約URLはチケットIDが必要のため通知内容には含みません。

## 通知制限機能

API制限回避のための通知制限機能が利用できます：

### 設定方法

```bash
NOTIFICATION_COOLDOWN_ENABLED=true      # 機能を有効化
NOTIFICATION_COOLDOWN_DURATION=30       # 30分間のクールダウン
NOTIFICATION_COOLDOWN_PER_PAVILION=true # パビリオン毎に個別管理
```

### 動作仕様

- **有効時**: 一度通知したパビリオンは指定時間内の再通知をスキップ
- **API監視継続**: 監視は継続、通知API呼び出しのみ制限
- **パビリオン毎設定**: `true`で各パビリオン毎、`false`で全体共通
- **デバッグログ**: クールダウン状況をコンソールに表示

## 注意事項

1. **API負荷**: 短い間隔（1-2秒）での監視はAPIサーバーに負荷をかける可能性があります
2. **営業時間**: 万博の営業時間外（通常8:00-21:00以外）は自動的に監視を停止します
4. **通知制限**: 通知制限機能を有効にすると同じパビリオンの連続通知を制限します
5. **環境変数**: 機密情報は環境変数で管理し、`.env`ファイルをGitにコミットしないでください
