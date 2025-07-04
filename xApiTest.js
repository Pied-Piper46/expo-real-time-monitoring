// twitter-api-v2ライブラリをインポートします
const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config(); // .envファイルを読み込み

// 環境変数からX API設定を読み込み
function loadXConfig() {
    const requiredVars = [];
    
    if (!process.env.X_APP_KEY) requiredVars.push('X_APP_KEY');
    if (!process.env.X_APP_SECRET) requiredVars.push('X_APP_SECRET');
    if (!process.env.X_ACCESS_TOKEN) requiredVars.push('X_ACCESS_TOKEN');
    if (!process.env.X_ACCESS_SECRET) requiredVars.push('X_ACCESS_SECRET');
    
    if (requiredVars.length > 0) {
        console.error('必須環境変数が設定されていません:', requiredVars.join(', '));
        console.error('.env ファイルを作成し、X API認証情報を設定してください');
        process.exit(1);
    }
    
    console.log('環境変数読み込み完了');
    console.log('X_APP_KEY:', process.env.X_APP_KEY ? 'あり' : 'なし');
    console.log('X_ACCESS_TOKEN:', process.env.X_ACCESS_TOKEN ? 'あり' : 'なし');
    
    return {
        appKey: process.env.X_APP_KEY,
        appSecret: process.env.X_APP_SECRET,
        accessToken: process.env.X_ACCESS_TOKEN,
        accessSecret: process.env.X_ACCESS_SECRET
    };
}

const xConfig = loadXConfig();

// 取得したキーとトークンを設定します
const client = new TwitterApi({
  appKey: xConfig.appKey,
  appSecret: xConfig.appSecret,
  accessToken: xConfig.accessToken,
  accessSecret: xConfig.accessSecret,
});

// 投稿したいメッセージ
const tweetText = 'あと、サービス以降先として、このXのアカウントで住友館の空きを通知しようか迷ってるます、、一応自分にもフォロワーが増えるっていうメリットあるし。。てかXのAPI調べてるけどややこしすぎる。また制限にかかるのだけはやめたい。反省しております😑';

// 投稿を実行する非同期関数を定義します
const postTweet = async () => {
  try {
    console.log('=== X API 投稿開始 ===');
    console.log('投稿テキスト:', tweetText);
    console.log('投稿テキスト長:', tweetText.length);
    
    // client.v2.tweet() を使って投稿します
    const response = await client.v2.tweet(tweetText);
    
    console.log('\n=== 投稿成功！🎉 ===');
    
    // レスポンス全体をログ出力
    console.log('\n--- 完全なレスポンス ---');
    console.log(JSON.stringify(response, null, 2));
    
    // 主要な情報を抽出
    const { data: createdTweet, meta, includes } = response;
    
    console.log('\n--- 投稿されたツイート情報 ---');
    console.log(`ツイートID: ${createdTweet.id}`);
    console.log(`ツイートテキスト: ${createdTweet.text}`);
    console.log(`作成日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`);
    console.log(`表示URL: https://twitter.com/user/status/${createdTweet.id}`);
    
    // メタ情報があれば表示
    if (meta) {
      console.log('\n--- メタ情報 ---');
      console.log(JSON.stringify(meta, null, 2));
    }
    
    // 追加情報があれば表示
    if (includes) {
      console.log('\n--- 追加情報 ---');
      console.log(JSON.stringify(includes, null, 2));
    }
    
    // レート制限情報を取得・表示
    try {
      const rateLimitStatus = await client.v1.getRateLimitStatus();
      console.log('\n--- レート制限情報 ---');
      console.log('ツイート投稿 残り回数:', rateLimitStatus.resources.statuses.update.remaining);
      console.log('リセット時刻:', new Date(rateLimitStatus.resources.statuses.update.reset * 1000).toLocaleString('ja-JP'));
    } catch (rateLimitError) {
      console.log('\n--- レート制限情報取得エラー ---');
      console.log(rateLimitError.message);
    }
    
  } catch (error) {
    console.error('\n=== エラーが発生しました ===');
    console.error('エラータイプ:', error.constructor.name);
    console.error('エラーメッセージ:', error.message);
    
    // HTTP エラーコード
    if (error.code) {
      console.error('HTTPエラーコード:', error.code);
    }
    
    // Twitter API エラーの詳細
    if (error.data) {
      console.error('\n--- Twitter API エラー詳細 ---');
      console.error(JSON.stringify(error.data, null, 2));
    }
    
    // リクエスト詳細
    if (error.request) {
      console.error('\n--- リクエスト詳細 ---');
      console.error('URL:', error.request.url);
      console.error('Method:', error.request.method);
    }
    
    // レスポンス詳細
    if (error.response) {
      console.error('\n--- レスポンス詳細 ---');
      console.error('ステータス:', error.response.status);
      console.error('ステータステキスト:', error.response.statusText);
      console.error('ヘッダー:', error.response.headers);
      console.error('データ:', error.response.data);
    }
    
    // 完全なエラーオブジェクト
    console.error('\n--- 完全なエラーオブジェクト ---');
    console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // 認証エラーの場合
    if (error.code === 401) {
      console.error('\n🔐 認証エラー: X API認証情報を確認してください');
      console.error('確認事項:');
      console.error('1. App Key と App Secret が正しいか');
      console.error('2. Access Token と Access Secret が正しいか');
      console.error('3. トークンの有効期限が切れていないか');
      console.error('4. アプリケーションの権限設定が正しいか');
    }
    
    // レート制限エラーの場合
    if (error.code === 429) {
      console.error('\n⏰ レート制限エラー: 投稿頻度が高すぎます');
      console.error('しばらく時間を置いてから再試行してください');
    }
    
    // その他の一般的なエラー
    if (error.code === 403) {
      console.error('\n🚫 権限エラー: 投稿権限がありません');
    }
  }
};

// 関数を実行します
postTweet();