// 環境変数からAPI設定を読み込み
require('dotenv').config();
const https = require('https');

const botToken = process.env.DISCORD_BOT_TOKEN
const channelId = process.env.DISCORD_CHANNEL_ID

function sendDiscordMessage(payload) {
    return new Promise((resolve) => {
        const data = JSON.stringify(payload);
        
        const options = {
            hostname: 'discord.com',
            port: 443,
            path: `/api/v10/channels/${channelId}/messages`,
            method: 'POST',
            headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'User-Agent': 'ExpoBot (https://github.com/expo-bot, 1.0.0)'
            }
        };

        const req = https.request(options, (res) => {
        let responseData = '';
        
        // レスポンスヘッダーをログ出力
        console.log('Discord API レスポンスヘッダー:');
        console.log('Status Code:', res.statusCode);
        console.log('Headers:', res.headers);
        
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        
        res.on('end', () => {
            console.log('レスポンスボディ:', responseData);
            if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(true);
            } else {
            console.error(`Discord API エラー: ${res.statusCode} - ${responseData}`);
            resolve(false);
            }
        });
        });

        req.on('error', (error) => {
        console.error(`Discord リクエストエラー: ${error.message}`);
        resolve(false);
        });

        req.write(data);
        req.end();
    });
}

// テストメッセージを送信
const testPayload = {
    content: "テストメッセージ：Discord通知が正常に動作しています！",
};

console.log('Discord通知テストを開始します...');
sendDiscordMessage(testPayload)
    .then(success => {
        if (success) {
            console.log('✅ Discord通知が正常に送信されました');
        } else {
            console.log('❌ Discord通知の送信に失敗しました');
        }
    })
    .catch(error => {
        console.error('エラーが発生しました:', error);
    });