# Expo Real Time Monitoring

2025年大阪万博のパビリオン空き状況を監視し、空きが出た際にSlack/LINE/X(Twitter)に通知するシステムです。

## 機能

- 指定したパビリオンの予約状況を定期的に監視
- 空きまたは残りわずかの状態になった際にSlack/LINE通知
- X(Twitter) API連携対応
- 環境変数による柔軟な設定管理
- ログ機能のオン/オフ切り替え
- デバッグモード対応
- 営業時間外の自動停止機能

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
X_APP_KEY=YOUR_X_APP_KEY
X_APP_SECRET=YOUR_X_APP_SECRET
X_ACCESS_TOKEN=YOUR_X_ACCESS_TOKEN
X_ACCESS_SECRET=YOUR_X_ACCESS_SECRET
```

#### 監視設定

```bash
MONITORING_INTERVAL=2                    # API呼び出し間隔（秒）
MONITORING_PAVILIONS=H1H9,I900,HQH0     # 監視対象パビリオン（カンマ区切り）
MONITORING_NOTIFY_ON_STATUS=0,1          # 通知対象ステータス（0=空きあり、1=残りわずか）
MONITORING_START_TIME=8:00               # 営業開始時刻
MONITORING_END_TIME=21:00                # 営業終了時刻
MONITORING_TIMEZONE=Asia/Tokyo           # タイムゾーン
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
2. 指定したパビリオンに空きが出ると自動でSlack通知
3. `Ctrl+C` で停止

## 通知内容

Slackには以下の情報が通知されます：

- パビリオン名
- 空き状況
- 時間帯
- パビリオンコード
- 予約ページへのリンク

LINEには以下の情報が通知されます：

- パビリオン名
- 空き状況
- 時間帯

X(Twitter)投稿機能も利用可能です（別途設定が必要）。

## 注意事項

1. **API負荷**: 短い間隔（1-2秒）での監視はAPIサーバーに負荷をかける可能性があります
2. **営業時間**: 万博の営業時間外（通常8:00-21:00以外）は自動的に監視を停止します
3. **予約URL**: 生成される予約URLは基本形式のため、実際の予約にはticketIDsの設定が必要な場合があります
4. **重複通知**: 同じ空きに対して複数回通知される可能性があります
5. **環境変数**: 機密情報は環境変数で管理し、`.env`ファイルをGitにコミットしないでください
6. **クラウドデプロイ**: Railway、Render等のクラウドサービスに対応しています

## クラウドデプロイ対応

### Railway / Render デプロイ

1. GitHubリポジトリを接続
2. 環境変数を設定（上記の必須設定を参照）
3. 自動デプロイ開始
4. HTTPS URLが自動生成されるため、X API のCallback URL設定が可能

### 推奨クラウドサービス

- **Railway**: 使用量課金、$5/月〜
- **Render**: 無料プランあり、$19/月〜
- **Vercel**: サーバーレス関数化が必要（現在非対応）

## ライセンス

MIT License