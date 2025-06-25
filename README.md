# Expo Monitor Today

2025年大阪万博のパビリオン空き状況を監視し、空きが出た際にSlackに通知するシステムです。

## 機能

- 指定したパビリオンの予約状況を定期的に監視
- 空きまたは残りわずかの状態になった際にSlack通知
- 設定ファイルによる柔軟な監視条件設定
- デバッグモード対応

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 設定ファイルの作成

`config.sample.json` をコピーして `config.json` を作成してください：

```bash
cp config.sample.json config.json
```

### 3. 設定ファイルの編集

`config.json` を編集して、SlackのWebhook URLと監視対象パビリオンを設定してください：

```json
{
  "slack": {
    "webhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    "channel": "#expo-alerts",
    "username": "Expo Monitor Bot",
    "iconEmoji": ":robot_face:"
  },
  "monitoring": {
    "interval": 2,
    "pavilions": [
      "H1H9",
      "I900", 
      "HQH0"
    ],
    "notifyOnStatus": [0, 1]
  },
  "api": {
    "dataUrl": "https://expo.ebii.net/api/data",
    "timeout": 10000
  },
  "debug": false
}
```

## 設定項目

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
- `dataUrl`: Expo APIのURL
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

#### 通常実行
```bash
npm start
```

#### デバッグモード
```bash
npm run dev
```

または：

```bash
node index.js --debug
```

### Docker実行

#### 1. 設定ファイルの準備
```bash
cp config.sample.json config.json
# config.json を編集してSlack Webhook URLと監視パビリオンを設定
```

#### 本番環境セットアップ手順
```bash
# 1. 本番サーバーにプロジェクトファイルを配置
git clone https://github.com/your-repo/expo-monitor-today.git
cd expo-monitor-today

# 2. 設定ファイル作成・編集
cp config.sample.json config.json
vi config.json  # Slack Webhook URL、監視パビリオン等を設定

# 3. 実行権限付与
chmod +x deploy.sh

# 4. デプロイ実行
./deploy.sh
```

#### 2. Docker Composeで実行（推奨）

##### 開発・テスト環境
```bash
# 本番モード
docker-compose up -d

# デバッグモード
docker-compose --profile dev up expo-monitor-dev

# ログ確認
docker-compose logs -f expo-monitor

# 停止
docker-compose down
```

##### 本番環境（事前ビルド済みイメージ使用）

###### 推奨: デプロイスクリプト使用
```bash
# 本番サーバー上のプロジェクトディレクトリで実行
cd /path/to/expo-monitor-today  # 本番環境のプロジェクトパス
./deploy.sh  # 自動デプロイ（最新イメージプル + 起動確認含む）
```

###### 手動デプロイ
```bash
# 最新イメージをプル
docker-compose -f docker-compose.prod.yml pull

# 本番環境用設定で実行
docker-compose -f docker-compose.prod.yml up -d

# 自動更新機能付きで実行（Watchtower）
docker-compose -f docker-compose.prod.yml --profile watchtower up -d

# ログ確認（本番環境）
docker-compose -f docker-compose.prod.yml logs -f expo-monitor

# 停止（本番環境）
docker-compose -f docker-compose.prod.yml down
```

#### 3. Dockerで直接実行
```bash
# イメージをビルド
docker build -t expo-monitor-today .

# コンテナを実行
docker run -d \
  --name expo-monitor \
  --restart unless-stopped \
  -v $(pwd)/config.json:/app/config.json:ro \
  -v $(pwd)/logs:/app/logs \
  expo-monitor-today

# デバッグモードで実行
docker run --rm \
  --name expo-monitor-debug \
  -v $(pwd)/config.json:/app/config.json:ro \
  expo-monitor-today node index.js --debug

# コンテナのログを確認
docker logs -f expo-monitor

# コンテナを停止・削除
docker stop expo-monitor && docker rm expo-monitor
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

## Docker利用時の注意事項

### 共通事項
1. **設定ファイル**: `config.json` は必ずDockerコンテナ実行前に作成してください
2. **ログ出力**: `./logs` ディレクトリにログファイルが作成されます
3. **タイムゾーン**: コンテナ内は日本時間（Asia/Tokyo）に設定済み
4. **セキュリティ**: 非特権ユーザー（expomonitor）でアプリケーションを実行

### 開発環境（docker-compose.yml）
- **リソース制限**: メモリ256MB、CPU 0.5コア制限
- **ログローテーション**: 最大10MB、3ファイル保持

### 本番環境（docker-compose.prod.yml）
- **事前ビルド済みイメージ**: `yujik/expo-monitor-today:1.0` を使用
- **強化されたリソース制限**: メモリ512MB、CPU 1.0コア制限、予約リソース設定
- **セキュリティ強化**: read-only ファイルシステム、特権昇格防止
- **ログローテーション**: 最大10MB、5ファイル保持、圧縮有効
- **ヘルスチェック**: 30秒間隔での死活監視
- **自動更新**: Watchtowerによる自動イメージ更新（オプション）
- **ネットワーク分離**: 専用ネットワークでの実行

### 本番環境での推奨設定
1. **Docker Secretsの利用**: Slack Webhook URLなどの機密情報管理
2. **ログの永続化**: ホストマシンの `/var/log/expo-monitor` への保存
3. **監視システム連携**: Prometheus、Grafana等でのメトリクス収集
4. **バックアップ**: 設定ファイルとログの定期バックアップ

## ファイル構成

```
expo-monitor-today/
├── index.js                 # メインプログラム
├── package.json             # Node.js設定
├── Dockerfile               # Dockerイメージ定義
├── docker-compose.yml       # Docker Compose設定（開発・テスト）
├── docker-compose.prod.yml  # Docker Compose設定（本番環境）
├── .dockerignore            # Docker除外ファイル
├── config.sample.json       # 設定ファイルサンプル
├── config.json              # 実際の設定ファイル（作成要）
├── logs/                    # ログ出力ディレクトリ
├── README.md                # このファイル
├── API_SPECIFICATION.md     # API仕様書
├── PAVILION_LIST.md         # パビリオン一覧
├── SPECIFICATION.md         # プロジェクト仕様
└── CLAUDE.md                # Claude Code用ガイド
```

## ライセンス

MIT License