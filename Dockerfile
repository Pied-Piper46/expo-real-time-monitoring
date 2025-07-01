# Node.js 18 Alpine イメージを使用（軽量）
# マルチプラットフォーム対応
FROM node:18-alpine

# タイムゾーンを日本時間に設定
RUN apk add --no-cache tzdata
ENV TZ=Asia/Tokyo

# 作業ディレクトリを設定
WORKDIR /app

# package.json と package-lock.json をコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production && npm cache clean --force

# アプリケーションのソースコードをコピー
COPY index.js ./
COPY xApiTest.js ./

# アプリケーションを実行
CMD ["node", "index.js"]