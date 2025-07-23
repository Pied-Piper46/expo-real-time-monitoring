const axios = require('axios');
const https = require('https');
const { TwitterApi } = require('twitter-api-v2');
const crypto = require('crypto');

// プロセス内のXAPIクライアント状態管理用
let xApiCallCount = 0;

async function sendSlackMessage(config, displayName, timeDetails) {
    if (!config.enabled || !config.webhookUrl) {
        return { success: false, reason: 'disabled or not configured' };
    }
    
    try {
        const hasAvailable = timeDetails.includes('空きあり');
        const message = {
            channel: config.channel,
            username: config.username || 'Expo Monitor Bot',
            icon_emoji: config.iconEmoji || ':robot_face:',
            attachments: [{
                color: hasAvailable ? 'good' : 'warning',
                title: `空き状況変化 - ${displayName}`,
                fields: [
                    {
                        title: '時間',
                        value: timeDetails,
                        short: true
                    }
                ],
                footer: 'Expo Monitor',
                ts: Math.floor(Date.now() / 1000)
            }]
        };
        
        await axios.post(config.webhookUrl, message);
        return { success: true, platform: 'Slack' };
    } catch (error) {
        return { success: false, platform: 'Slack', error: error.message };
    }
}

async function sendLineMessage(config, displayName, timeDetails) {
    if (!config.enabled || !config.channelAccessToken) {
        return { success: false, reason: 'disabled or not configured' };
    }
    
    try {
        const message = {
            messages: [{
                type: "text",
                text: `空き状況変化 - ${displayName}\n時間: ${timeDetails}`
            }]
        };
        
        await axios.post('https://api.line.me/v2/bot/message/broadcast', message, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.channelAccessToken}`
            }
        });
        return { success: true, platform: 'LINE' };
    } catch (error) {
        return { success: false, platform: 'LINE', error: error.message };
    }
}

async function sendXMessage(config, displayName, timeDetails) {
    if (!config.enabled || !config.appKey) {
        return { success: false, reason: 'disabled or not configured' };
    }
    
    try {
        // プロセス内でのX API呼び出し統計を更新
        xApiCallCount++;
        
        console.log(`[X API Debug] API呼び出し #${xApiCallCount}`);
        
        // 強制的にユニークなnonce生成を確保するため、複数の要素を組み合わせ
        const processId = process.pid;
        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        const microseconds = process.hrtime.bigint();
        
        // プロセス内キャッシュを避けるため、完全に新しいクライアントを作成
        // HTTP接続の再利用を無効化し、OAuth1のnonce重複を防ぐ
        const client = new TwitterApi({
            appKey: config.appKey,
            appSecret: config.appSecret,
            accessToken: config.accessToken,
            accessSecret: config.accessSecret
        }, {
            // HTTP接続プールを無効化してキャッシュを防ぐ
            httpAgent: new https.Agent({ 
                keepAlive: false,
                maxSockets: 1,
                timeout: 30000,
                // 強制的に新しい接続を作成
                maxFreeSockets: 0
            }),
            httpsAgent: new https.Agent({ 
                keepAlive: false,
                maxSockets: 1,
                timeout: 30000,
                maxFreeSockets: 0
            }),
            // TwitterAPI固有のオプション
            timeout: 30000,
            // ユーザーエージェントを動的に変更してセッション分離
            userAgent: `ExpoBot/${processId}/${xApiCallCount}/${timestamp}`
        });
        
        // タイムスタンプを含めて重複コンテンツエラーを回避
        const now = new Date();
        const timeString = now.toLocaleString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            month: '2-digit',
            day: '2-digit', 
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).replace(/(\d{2})\/(\d{2}) (\d{2}:\d{2}:\d{2})/, '[$2-$1 $3]');
        
        const tweetText = `[${timeString}] 🟢空きあり - ${displayName}`;
        
        // デバッグログ用の情報を記録
        const debugTimestamp = new Date().toISOString();
        console.log(`[X API Debug ${debugTimestamp}] 投稿試行 #${xApiCallCount}: "${tweetText}"`);
        console.log(`[X API Debug ${debugTimestamp}] ProcessID: ${processId}, UniqueID: ${uniqueSuffix}, Microsec: ${microseconds}`);
        
        const { data: createdTweet } = await client.v2.tweet(tweetText);
        
        console.log(`[X API Debug ${debugTimestamp}] 投稿成功 #${xApiCallCount}: ID ${createdTweet.id}`);
        
        return { 
            success: true, 
            platform: 'X', 
            tweetId: createdTweet.id, 
            debugInfo: { 
                timestamp: debugTimestamp, 
                text: tweetText, 
                uniqueId: uniqueSuffix, 
                callCount: xApiCallCount,
                processId: processId
            } 
        };
    } catch (error) {
        const timestamp = new Date().toISOString();
        console.error(`[X API Debug ${timestamp}] 投稿失敗 #${xApiCallCount}: ${error.message}`);
        console.error(`[X API Debug ${timestamp}] HTTPコード: ${error.code || 'N/A'}`);
        console.error(`[X API Debug ${timestamp}] レスポンス:`, error.data || 'なし');
        console.error(`[X API Debug ${timestamp}] コール統計: 総計${xApiCallCount}回, プロセス${process.pid}`);
        
        // 403エラーの場合は特別な処理
        if (error.code === 403) {
            console.error(`[X API CRITICAL ${timestamp}] 403 Forbidden エラー - OAuth1状態問題の可能性`);
            console.error(`[X API CRITICAL ${timestamp}] プロセス再起動を推奨`);
            
            // プロセス状態をリセット（次回の試行のため）
            if (xApiCallCount > 1) {
                console.error(`[X API CRITICAL ${timestamp}] 状態をリセットしています`);
                xApiCallCount = 0;
            }
        }
        
        return { 
            success: false, 
            platform: 'X', 
            error: error.message, 
            debugInfo: { 
                timestamp, 
                httpCode: error.code, 
                responseData: error.data,
                callCount: xApiCallCount,
                processId: process.pid,
                is403Error: error.code === 403
            } 
        };
    }
}

async function sendDiscordMessage(config, displayName, timeDetails) {
    if (!config.enabled || !config.botToken) {
        return { success: false, reason: 'disabled or not configured' };
    }
    
    return new Promise((resolve) => {
        const payload = {
            content: `空き状況変化 - ${displayName}\n時間: ${timeDetails}`
        };
        
        const data = JSON.stringify(payload);
        
        const options = {
            hostname: 'discord.com',
            port: 443,
            path: `/api/v10/channels/${config.channelId}/messages`,
            method: 'POST',
            headers: {
                'Authorization': `Bot ${config.botToken}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'User-Agent': 'ExpoBot (https://github.com/expo-bot, 1.0.0)'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                    resolve({ success: true, platform: 'Discord' });
                } else {
                    resolve({ success: false, platform: 'Discord', error: `HTTP ${res.statusCode}: ${responseData}` });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ success: false, platform: 'Discord', error: error.message });
        });

        req.write(data);
        req.end();
    });
}

// 並列処理で全通知を送信
async function sendAllNotifications(configs, displayName, timeDetails) {
    const notificationPromises = [
        sendSlackMessage(configs.slack, displayName, timeDetails),
        sendLineMessage(configs.line, displayName, timeDetails),
        sendXMessage(configs.x, displayName, timeDetails),
        sendDiscordMessage(configs.discord, displayName, timeDetails)
    ];
    
    // Promise.allSettled で全ての通知を並列実行（エラーがあっても他の通知は続行）
    const results = await Promise.allSettled(notificationPromises);
    
    const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
    ).length;
    
    const failures = results
        .filter(result => result.status === 'rejected' || !result.value.success)
        .map((result, index) => {
            const platforms = ['Slack', 'LINE', 'X', 'Discord'];
            if (result.status === 'rejected') {
                return { platform: platforms[index], error: result.reason?.message || result.reason };
            }
            return { ...result.value, platform: platforms[index] };
        });
    
    return {
        total: notificationPromises.length,
        success: successCount,
        failures: failures
    };
}

module.exports = {
    sendSlackMessage,
    sendLineMessage,
    sendXMessage,
    sendDiscordMessage,
    sendAllNotifications
};