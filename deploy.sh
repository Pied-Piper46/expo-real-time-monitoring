#!/bin/bash

# 本番環境デプロイメントスクリプト

set -e  # エラー時は即座に終了

IMAGE_NAME="yujik/expo-real-time-monitoring:1.0"
COMPOSE_FILE="docker-compose.prod.yml"

echo "=== Expo Monitor 本番環境デプロイメント ==="
echo "イメージ: ${IMAGE_NAME}"
echo ""

# Step 1: 設定ファイルの確認
if [ ! -f "config.json" ]; then
    echo "Error: config.json が見つかりません"
    echo "次のコマンドで作成してください:"
    echo "cp config.sample.json config.json"
    echo "その後、config.json を編集してSlack Webhook URLを設定してください"
    exit 1
fi

echo "設定ファイル確認完了"

# Step 2: 最新イメージをプル
echo ""
echo "最新イメージをプル中..."
docker-compose -f ${COMPOSE_FILE} pull

# Step 3: 既存コンテナを停止・削除
echo ""
echo "既存コンテナを停止中..."
docker-compose -f ${COMPOSE_FILE} down

# Step 4: 新しいコンテナを起動
echo ""
echo "新しいコンテナを起動中..."
docker-compose -f ${COMPOSE_FILE} up -d

# Step 5: 起動確認
echo ""
echo "起動確認中..."
sleep 5

# コンテナの状態確認
if docker-compose -f ${COMPOSE_FILE} ps | grep -q "Up"; then
    echo "デプロイメント完了"
    echo ""
    echo "コンテナ状態:"
    docker-compose -f ${COMPOSE_FILE} ps
    echo ""
    echo "ログ確認コマンド:"
    echo "docker-compose -f ${COMPOSE_FILE} logs -f expo-monitor"
    echo ""
    echo "停止コマンド:"
    echo "docker-compose -f ${COMPOSE_FILE} down"
else
    echo "Error: コンテナの起動に失敗しました"
    echo ""
    echo "ログを確認してください:"
    echo "docker-compose -f ${COMPOSE_FILE} logs expo-monitor"
    exit 1
fi