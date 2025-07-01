// twitter-api-v2ライブラリをインポートします
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

configPath = './config.json'

function loadConfig(configPath) {
    try {
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error(`設定ファイルの読み込みに失敗しました: ${configPath}`);
        console.error('config.sample.json を参考に config.json を作成してください');
        process.exit(1);
    }
}

const config = loadConfig(configPath);

// 取得したキーとトークンを設定します
const client = new TwitterApi({
  appKey: config.x.appKey,
  appSecret: config.x.appSecret,
  accessToken: config.x.accessToken,
  accessSecret: config.x.accessSecret,
});

// 投稿したいメッセージ
const tweetText = '予想以上に登録されており、コスト面で運用が厳しいので、サービス移行先としてこのXアカウントを一時的にBotにしようかなと考えてます。自分にもフォロワーが増えるっていうメリットがあるし';

// 投稿を実行する非同期関数を定義します
const postTweet = async () => {
  try {
    // client.v2.tweet() を使って投稿します
    const { data: createdTweet } = await client.v2.tweet(tweetText);
    console.log('ツイートが成功しました！🎉');
    console.log(`ツイートID: ${createdTweet.id}`);
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
};

// 関数を実行します
postTweet();