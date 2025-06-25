# Node.js 18 Alpine イメージを使用（軽量）
# マルチプラットフォーム対応
FROM --platform=$BUILDPLATFORM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.json と package-lock.json をコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production && npm cache clean --force

# アプリケーションのソースコードをコピー
COPY index.js ./
COPY config.sample.json ./

# 非特権ユーザーを作成
RUN addgroup -g 1001 -S nodejs && \
    adduser -S expomonitor -u 1001 -G nodejs

# アプリケーションディレクトリの所有者を変更
RUN chown -R expomonitor:nodejs /app

# 非特権ユーザーに切り替え
USER expomonitor

# ヘルスチェック用のスクリプト（オプション）
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)"

# アプリケーションを実行
CMD ["node", "index.js"]