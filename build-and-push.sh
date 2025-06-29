#!/bin/bash

# マルチプラットフォーム対応でイメージをビルド・プッシュするスクリプト

IMAGE_NAME="yujik/expo-real-time-monitoring"
VERSION="1.3"
PLATFORMS="linux/amd64,linux/arm64"

echo "=== Docker buildx マルチプラットフォームビルド ==="
echo "イメージ名: ${IMAGE_NAME}:${VERSION}"
echo "プラットフォーム: ${PLATFORMS}"
echo ""

# buildx builderがない場合は作成
docker buildx inspect multibuilder >/dev/null 2>&1 || {
    echo "multiplatform-builder を作成中..."
    docker buildx create --name multibuilder --use
}

# buildxを使用してマルチプラットフォームビルド
echo "マルチプラットフォームビルド開始..."
docker buildx build \
    --platform ${PLATFORMS} \
    --tag ${IMAGE_NAME}:${VERSION} \
    --tag ${IMAGE_NAME}:latest \
    --push \
    .

if [ $? -eq 0 ]; then
    echo ""
    echo "ビルド・プッシュが完了しました"
    echo "イメージ: ${IMAGE_NAME}:${VERSION}"
    echo "プラットフォーム: ${PLATFORMS}"
    echo ""
    echo "使用方法:"
    echo "docker-compose -f docker-compose.prod.yml up -d"
else
    echo ""
    echo "ビルド・プッシュに失敗しました"
    exit 1
fi