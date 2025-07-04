require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const cron = require('node-cron');
const { sendAllNotifications } = require('./notifier');

// パビリオン名マッピング（SPECIFICATION.mdから抽出）
const PAVILION_NAMES = {
    'C0R0': ['UAE', ''],
    'C0R3': ['UAEバリアフリー', 'バリアフリー'],
    'C2N0': ['イタリア~15:00', '~15:00'],
    'C2N3': ['イタリア15:00~', '15:00~'],
    'C570': ['英国', ''],
    'C730': ['オーストラリア', ''],
    'C7R0': ['オランダ', ''],
    'C930': ['カナダ', ''],
    'C9J0': ['韓国', ''],
    'CCB0': ['クウェート', ''],
    'CFR0': ['赤十字', ''],
    'CFV0': ['国連', ''],
    'CM30': ['セルビア', ''],
    'CO70': ['タイ', ''],
    'CO73': ['タイ障がい者用', '障がい者用'],
    'D630': ['ポーランド', ''],
    'D633': ['ポーランドショパン', 'ショパン'],
    'H1H9': ['日本館', ''],
    'H1HC': ['日本館プラント見学', 'プラント見学'],
    'H1HF': ['日本館プラント見学車いす', 'プラント見学車いす'],
    'H5H0': ['ヘルスケアリボーン', 'リボーン'],
    'H5H3': ['ヘルスケアリボ+人生', 'リボ+人生'],
    'H5H9': ['ヘルスケアモンハン', 'モンハン'],
    'H5HC': ['ヘルスケアモンハン(車いす)', 'モンハン(車いす)'],
    'H7H0': ['関西', ''],
    'H7H3': ['関西飲食付ハイチェア', '飲食付ハイチェア'],
    'H7H6': ['関西飲食付ローチェア', '飲食付ローチェア'],
    'HAH0': ['NTT', ''],
    'HCH0': ['電力館', ''],
    'HCH3': ['電力館車いす', '車いす'],
    'HEH0': ['住友館', ''],
    'HEH3': ['住友館車いす', '車いす'],
    'HEH6': ['住友館植林体験', '植林体験'],
    'HGH0': ['ノモの国', ''],
    'HIH0': ['三菱未来館', ''],
    'HIH3': ['三菱未来館車いす', '車いす'],
    'HKH0': ['よしもと', ''],
    'HMH0': ['PASONA', ''],
    'HMH3': ['PASONA車いす', '車いす'],
    'HOH0': ['ブルーオーシャンドーム', ''],
    'HOH3': ['ブルーオーシャンドーム車いす', '車いす'],
    'HQH0': ['ガンダム', ''],
    'HSH0': ['TECH WORLD', ''],
    'HUH0': ['ガス・おばけ', ''],
    'HUH3': ['ガス・おばけ車いす・補助犬', '車いす・補助犬'],
    'HUH6': ['ガス・おばけスマートデバイス', 'スマートデバイス'],
    'HWH0': ['飯田×大阪公立大学', ''],
    'HWH3': ['飯田×大阪公立大学車いす', '車いす'],
    'I300': ['Better Co-Being', ''],
    'I600': ['いのちの未来', ''],
    'I603': ['いのちの未来車いす', '車いす'],
    'I606': ['いのちの未来インクルーシブ', 'インクルーシブ'],
    'I900': ['いのちの遊び場', ''],
    'I903': ['いのちの遊び場車いす', '車いす'],
    'I906': ['いのちの遊び場English', 'English'],
    'I909': ['いのちの遊び場English車いす', 'English車いす'],
    'I90C': ['いのちの遊び場ぺちゃくちゃ', 'ぺちゃくちゃ'],
    'I90F': ['いのちの遊び場ぺちゃくちゃ(車いす)', 'ぺちゃくちゃ(車いす)'],
    'IC00': ['null²', ''],
    'IC03': ['null²インスタレーション', 'インスタレーション'],
    'IF00': ['いのち動的平衡館', ''],
    'IF03': ['いのち動的平衡館触覚体験(視覚・聴覚に障害がある方)', '触覚体験(視覚・聴覚に障害がある方)'],
    'II00': ['いのちめぐる冒険超時空シアター', '超時空シアター'],
    'II03': ['いのちめぐる冒険超時空シアター(車いす)', '超時空シアター(車いす)'],
    'II06': ['いのちめぐる冒険ANIMA!', 'ANIMA!'],
    'IL00': ['EARTH MART', ''],
    'IO00': ['いのちのあかし', ''],
    'IO03': ['いのちのあかし車いす', '車いす'],
    'J900': ['未来の都市シアター入場付き', 'シアター入場付き'],
    'J903': ['未来の都市', ''],
    'JC00': ['空飛ぶクルマ', ''],
    'Q001': ['アオと夜の虹', ''],
    'Q004': ['アオと夜の虹車いす', '車いす'],
    'Q007': ['万博サウナ90分男性', '90分男性'],
    'Q010': ['万博サウナ90分女性', '90分女性'],
    'Q013': ['万博サウナ90分男女混合', '90分男女混合'],
    'H3H0': ['ウーマンズ', ''],
};

class ExpoMonitor {
    constructor() {
        this.config = this.loadEnvironmentConfig();
        this.debug = this.config.debug || process.argv.includes('--debug');
        this.isRunning = false;
        this.intervalId = null;
        this.previousStates = new Map(); // パビリオン+スロットの前回状態を記録
        
        if (this.debug) {
            console.log('デバッグモードで実行中');
            console.log('監視対象パビリオン:', this.config.monitoring.pavilions);
        }
    }


    loadEnvironmentConfig() {
        // 必須環境変数のチェック
        const requiredVars = [];
        
        // 通知が有効な場合の必須変数をチェック
        if (process.env.SLACK_ENABLED === 'true' && !process.env.SLACK_WEBHOOK_URL) {
            requiredVars.push('SLACK_WEBHOOK_URL');
        }
        if (process.env.LINE_ENABLED === 'true' && !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
            requiredVars.push('LINE_CHANNEL_ACCESS_TOKEN');
        }
        if (process.env.X_ENABLED === 'true') {
            if (!process.env.X_APP_KEY) requiredVars.push('X_APP_KEY');
            if (!process.env.X_APP_SECRET) requiredVars.push('X_APP_SECRET');
            if (!process.env.X_ACCESS_TOKEN) requiredVars.push('X_ACCESS_TOKEN');
            if (!process.env.X_ACCESS_SECRET) requiredVars.push('X_ACCESS_SECRET');
        }
        if (process.env.DISCORD_ENABLED === 'true') {
            if (!process.env.DISCORD_BOT_TOKEN) requiredVars.push('DISCORD_BOT_TOKEN');
            if (!process.env.DISCORD_CHANNEL_ID) requiredVars.push('DISCORD_CHANNEL_ID');
        }
        
        if (requiredVars.length > 0) {
            console.error('必須環境変数が設定されていません:', requiredVars.join(', '));
            console.error('.env ファイルを作成するか、環境変数を設定してください');
            process.exit(1);
        }

        return {
            slack: {
                webhookUrl: process.env.SLACK_WEBHOOK_URL,
                enabled: process.env.SLACK_ENABLED === 'true',
                channel: process.env.SLACK_CHANNEL,
                username: process.env.SLACK_USERNAME || 'Expo Monitor Bot',
                iconEmoji: process.env.SLACK_ICON_EMOJI || ':robot_face:'
            },
            line: {
                enabled: process.env.LINE_ENABLED === 'true',
                channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
            },
            x: {
                enabled: process.env.X_ENABLED === 'true',
                appKey: process.env.X_APP_KEY,
                appSecret: process.env.X_APP_SECRET,
                accessToken: process.env.X_ACCESS_TOKEN,
                accessSecret: process.env.X_ACCESS_SECRET
            },
            discord: {
                enabled: process.env.DISCORD_ENABLED === 'true',
                botToken: process.env.DISCORD_BOT_TOKEN,
                channelId: process.env.DISCORD_CHANNEL_ID
            },
            monitoring: {
                interval: parseInt(process.env.MONITORING_INTERVAL) || 2,
                pavilions: process.env.MONITORING_PAVILIONS ? 
                    process.env.MONITORING_PAVILIONS.split(',').map(p => p.trim()) : 
                    ['H1H9', 'I900', 'HQH0', 'HGH0', 'C9J0'],
                notifyOnStatus: process.env.MONITORING_NOTIFY_ON_STATUS ? 
                    process.env.MONITORING_NOTIFY_ON_STATUS.split(',').map(s => parseInt(s.trim())) : 
                    [0, 1],
                businessHours: {
                    start: process.env.MONITORING_START_TIME || '8:00',
                    end: process.env.MONITORING_END_TIME || '21:00',
                    timezone: process.env.MONITORING_TIMEZONE || 'Asia/Tokyo'
                }
            },
            logging: {
                enabled: process.env.LOGGING_ENABLED === 'true',
                file: process.env.LOGGING_FILE || './availability_log.jsonl'
            },
            api: {
                dataUrl: process.env.API_DATA_URL || 'https://expo.ebii.net/api/data',
                timeout: parseInt(process.env.API_TIMEOUT) || 10000
            },
            debug: process.env.DEBUG === 'true'
        };
    }


    async fetchExpoData() {
        try {
            const response = await axios.get(this.config.api.dataUrl, {
                timeout: this.config.api.timeout || 10000,
                headers: {
                    'User-Agent': 'ExpoMonitor/1.0'
                }
            });
            return response.data;
        } catch (error) {
            throw new Error(`API取得エラー: ${error.message}`);
        }
    }

    getPavilionDisplayName(pavilionCode, apiName) {
        if (PAVILION_NAMES[pavilionCode]) {
            const [shortName, category] = PAVILION_NAMES[pavilionCode];
            if (category) {
                return `${shortName} (${category})`;
            }
            return shortName;
        }
        return apiName || pavilionCode;
    }

    getStatusText(status) {
        switch (status) {
            case 0: return '🟢 空きあり';
            case 1: return '🟡 残りわずか';
            case 2: return '🔴 満席';
            default: return '⚪ スロットなし';
        }
    }

    formatTime(timeStr) {
        // "0900" -> "09:00"
        if (timeStr.length === 4) {
            return `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`;
        }
        return timeStr;
    }


    logAvailability(pavilionCode, timeSlot, status) {
        // ログ機能が無効の場合は何もしない
        if (!this.config.logging?.enabled) {
            return;
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            pavilion_code: pavilionCode,
            time_slot: this.formatTime(timeSlot),
            status: status
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        const logFile = this.config.logging?.file || './availability_log.jsonl';

        try {
            fs.appendFileSync(logFile, logLine);
            if (this.debug) {
                console.log(`ログ記録: ${pavilionCode} ${this.formatTime(timeSlot)} - ステータス${status}`);
            }
        } catch (error) {
            console.error('ログ記録エラー:', error.message);
        }
    }

    isCurrentlyBusinessHours(businessHours) {
        const now = new Date();
        const currentTime = now.toLocaleString('en-US', {timeZone: businessHours.timezone});
        const currentDate = new Date(currentTime);
        
        const [startHour, startMinute] = businessHours.start.split(':').map(Number);
        const [endHour, endMinute] = businessHours.end.split(':').map(Number);
        
        const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        
        // 日をまたがない場合（例: 8:00-21:00）
        if (startMinutes < endMinutes) {
            return currentMinutes >= startMinutes && currentMinutes < endMinutes;
        }
        // 日をまたぐ場合（例: 22:00-6:00）
        else {
            return currentMinutes >= startMinutes || currentMinutes < endMinutes;
        }
    }

    detectStatusChanges(pavilions) {
        const pavilionMap = new Map();
        
        for (const pavilion of pavilions) {
            // 監視対象パビリオンかチェック
            if (!this.config.monitoring.pavilions.includes(pavilion.c)) {
                continue;
            }

            // パビリオン名が空の場合はスキップ
            if (!pavilion.n || pavilion.n === '') {
                continue;
            }

            const changedSlots = [];

            // スロットをチェック
            for (const slot of pavilion.s || []) {
                const stateKey = `${pavilion.c}_${slot.t}`;
                const previousStatus = this.previousStates.get(stateKey);
                
                // 状態0（空きあり）になった場合のみログ記録
                if (slot.s === 0 && previousStatus !== 0) {
                    this.logAvailability(pavilion.c, slot.t, slot.s);
                }
                
                // 前回状態を更新
                this.previousStates.set(stateKey, slot.s);
                
                // 通知判定（状態変化があり、かつ通知対象ステータス）
                if (previousStatus !== slot.s && this.config.monitoring.notifyOnStatus.includes(slot.s)) {
                    changedSlots.push({
                        time: slot.t,
                        status: slot.s,
                        statusText: this.getStatusText(slot.s)
                    });
                }
            }

            // 変化があったスロットがある場合のみMapに追加
            if (changedSlots.length > 0) {
                pavilionMap.set(pavilion.c, {
                    pavilion: pavilion,
                    changedSlots: changedSlots
                });
            }
        }

        return pavilionMap;
    }

    async sendNotifications(pavilionMap) {
        for (const [pavilionCode, pavilionData] of pavilionMap) {
            try {
                const displayName = this.getPavilionDisplayName(pavilionData.pavilion.c, pavilionData.pavilion.n);
                const timeDetails = pavilionData.changedSlots.map(slot => 
                    `${this.formatTime(slot.time)}(${slot.statusText})`
                ).join(', ');
                
                // 並列で全通知を送信
                const result = await sendAllNotifications(
                    this.config,
                    displayName,
                    timeDetails
                );
                
                if (this.debug) {
                    console.log(`通知結果 (${pavilionCode}): ${result.success}/${result.total}件成功`);
                    if (result.failures.length > 0) {
                        console.log('失敗した通知:', result.failures);
                    }
                }
                
                // レート制限対策で少し待機
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`通知送信失敗 (${pavilionCode}):`, error.message);
            }
        }
    }

    async monitorAndNotify() {
        try {
            const pavilions = await this.fetchExpoData();
            
            // 空データの場合は何もしない
            if (!pavilions || pavilions.length === 0) {
                return;
            }
            
            const pavilionMap = this.detectStatusChanges(pavilions);

            if (pavilionMap.size > 0) {
                const timeStr = new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
                const totalChanges = Array.from(pavilionMap.values()).reduce((sum, data) => sum + data.changedSlots.length, 0);
                console.log(`${timeStr}: ${pavilionMap.size}パビリオンで${totalChanges}件の状態変化を検出`);
                await this.sendNotifications(pavilionMap);
            } else if (this.debug) {
                const timeStr = new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
                console.log(`${timeStr}: 状態変化なし`);
            }

        } catch (error) {
            console.error(`監視エラー: ${error.message}`);
        }
    }

    startMonitoring() {
        if (this.isRunning) return;
        
        console.log('営業時間開始 - 監視を開始します');
        this.isRunning = true;
        
        // 即座に一度実行
        this.monitorAndNotify();
        
        // 設定された間隔で定期実行
        this.intervalId = setInterval(() => {
            this.monitorAndNotify();
        }, this.config.monitoring.interval * 1000);
    }

    stopMonitoring() {
        if (!this.isRunning) return;
        
        console.log('営業時間終了 - 監視を停止します');
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async start() {
        console.log('Expo Monitor 開始');
        console.log(`監視間隔: ${this.config.monitoring.interval}秒`);
        console.log(`監視対象: ${this.config.monitoring.pavilions.join(', ')}`);
        
        // 営業時間の設定（設定ファイルから動的生成）
        const businessHours = this.config.monitoring.businessHours;
        const [startHour, startMinute] = businessHours.start.split(':').map(Number);
        const [endHour, endMinute] = businessHours.end.split(':').map(Number);
        
        const startCron = `${startMinute} ${startHour} * * *`;
        const endCron = `${endMinute} ${endHour} * * *`;
        
        console.log(`営業時間: ${businessHours.start}-${businessHours.end} (${businessHours.timezone})`);
        console.log(`cronパターン: 開始=${startCron}, 終了=${endCron}`);
        
        cron.schedule(startCron, () => {
            console.log(`cron: ${businessHours.start} 営業時間開始スケジュール実行`);
            this.startMonitoring();
        }, {
            timezone: businessHours.timezone
        });

        cron.schedule(endCron, () => {
            console.log(`cron: ${businessHours.end} 営業時間終了スケジュール実行`);
            this.stopMonitoring();
        }, {
            timezone: businessHours.timezone
        });

        // cron動作確認用（毎分実行）
        if (this.debug) {
            cron.schedule('* * * * *', () => {
                const now = new Date();
                const jstTime = now.toLocaleString('ja-JP', {timeZone: businessHours.timezone});
                console.log(`cron動作確認: ${jstTime} (監視中: ${this.isRunning})`);
            }, {
                timezone: businessHours.timezone
            });
        }

        // 起動時の営業時間チェック
        const now = new Date();
        const currentTime = now.toLocaleString('ja-JP', {timeZone: businessHours.timezone});
        
        if (this.isCurrentlyBusinessHours(businessHours)) {
            console.log(`現在時刻: ${currentTime} - 営業時間内のため監視を開始します`);
            this.startMonitoring();
        } else {
            console.log(`現在時刻: ${currentTime} - 営業時間外です。${businessHours.start}に自動開始します`);
        }

        // 終了処理の設定
        process.on('SIGINT', () => {
            this.stop();
        });

        process.on('SIGTERM', () => {
            this.stop();
        });
    }

    stop() {
        console.log('\nExpo Monitor 停止中...');
        this.stopMonitoring();
        process.exit(0);
    }
}

// メイン実行部分
if (require.main === module) {
    const monitor = new ExpoMonitor();
    monitor.start().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = ExpoMonitor;