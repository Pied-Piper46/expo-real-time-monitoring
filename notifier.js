const axios = require('axios');
const https = require('https');
const { TwitterApi } = require('twitter-api-v2');

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
        const client = new TwitterApi({
            appKey: config.appKey,
            appSecret: config.appSecret,
            accessToken: config.accessToken,
            accessSecret: config.accessSecret
        });
        
        const tweetText = `空き検知 - ${displayName}`;
        const { data: createdTweet } = await client.v2.tweet(tweetText);
        
        return { success: true, platform: 'X', tweetId: createdTweet.id };
    } catch (error) {
        return { success: false, platform: 'X', error: error.message };
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