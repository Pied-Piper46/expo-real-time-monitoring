const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
    constructor(configPath = './config.json') {
        this.config = this.loadConfig(configPath);
        this.debug = this.config.debug || process.argv.includes('--debug');
        this.isRunning = false;
        this.previousStates = new Map(); // パビリオン+スロットの前回状態を記録
        
        if (this.debug) {
            console.log('デバッグモードで実行中');
            console.log('監視対象パビリオン:', this.config.monitoring.pavilions);
        }
    }

    loadConfig(configPath) {
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error(`設定ファイルの読み込みに失敗しました: ${configPath}`);
            console.error('config.sample.json を参考に config.json を作成してください');
            process.exit(1);
        }
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

    isBusinessHours() {
        const now = new Date();
        const hour = now.getHours();
        return hour >= 9 && hour < 21;
    }

    getMonitoringInterval() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        if (hour >= 9 && hour < 21) {
            // 営業時間内: 通常間隔
            return this.config.monitoring.interval * 1000;
        } else if (hour === 8 && minute >= 45) {
            // 8:45-8:59: 営業開始直前の高頻度監視
            return 30 * 1000;
        } else if (hour >= 8 && hour < 9) {
            // 8:00-8:44: 準備時間帯
            return 5 * 60 * 1000;
        } else {
            // 深夜・早朝: 低頻度監視
            return 30 * 60 * 1000;
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

    formatDateToYMD() {
        const date = new Date();
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}${m}${d}`;
    }

    generateReservationUrl(pavilionCode) {
        // 実際の予約URLを生成（ticketIdsが必要だが、サンプルとして基本URLを返す）
        const baseUrl = 'https://ticket.expo2025.or.jp/event_time/';
        const params = new URLSearchParams({
            event_id: pavilionCode,
            screen_id: '108',
            lottery: '5',
            entrance_date: this.formatDateToYMD()
        });
        return `${baseUrl}?${params.toString()}`;
    }

    logAvailability(pavilionCode, timeSlot, status) {
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

    async sendSlackNotification(pavilion, slot) {
        const displayName = this.getPavilionDisplayName(pavilion.c, pavilion.n);
        const statusText = this.getStatusText(slot.s);
        const timeText = this.formatTime(slot.t);
        const reservationUrl = this.generateReservationUrl(pavilion.c);

        const message = {
            channel: this.config.slack.channel,
            username: this.config.slack.username || 'Expo Monitor Bot',
            icon_emoji: this.config.slack.iconEmoji || ':robot_face:',
            attachments: [{
                color: slot.s === 0 ? 'good' : 'warning',
                title: `${statusText} - ${displayName}`,
                fields: [
                    {
                        title: '時間',
                        value: timeText,
                        short: true
                    },
                    {
                        title: 'パビリオンコード',
                        value: pavilion.c,
                        short: true
                    },
                    {
                        title: '予約URL',
                        value: `<${reservationUrl}|予約ページを開く>`,
                        short: false
                    }
                ],
                footer: 'Expo Monitor',
                ts: Math.floor(Date.now() / 1000)
            }]
        };

        try {
            await axios.post(this.config.slack.webhookUrl, message);
            if (this.debug) {
                console.log(`Slack通知送信: ${displayName} (${timeText}) - ${statusText}`);
            }
        } catch (error) {
            console.error('Slack通知送信エラー:', error.message);
            throw error;
        }
    }

    checkAvailability(pavilions) {
        const availableSlots = [];
        
        for (const pavilion of pavilions) {
            // 監視対象パビリオンかチェック
            if (!this.config.monitoring.pavilions.includes(pavilion.c)) {
                continue;
            }

            // パビリオン名が空の場合はスキップ
            if (!pavilion.n || pavilion.n === '') {
                continue;
            }

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
                
                // 通知判定（既存ロジック）
                if (this.config.monitoring.notifyOnStatus.includes(slot.s)) {
                    availableSlots.push({
                        pavilion: pavilion,
                        slot: slot
                    });
                }
            }
        }

        return availableSlots;
    }

    async processAvailableSlots(availableSlots) {
        for (const { pavilion, slot } of availableSlots) {
            try {
                await this.sendSlackNotification(pavilion, slot);
                // レート制限対策で少し待機
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`通知送信失敗 (${pavilion.c}):`, error.message);
            }
        }
    }

    async monitorOnce() {
        try {
            const pavilions = await this.fetchExpoData();
            
            // 空データの場合のログ出力
            if (!pavilions || pavilions.length === 0) {
                const businessHours = this.isBusinessHours();
                const timeStr = new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
                if (businessHours) {
                    console.log(`${timeStr}: 営業時間内ですが空データを受信しました`);
                } else if (this.debug) {
                    console.log(`${timeStr}: 営業時間外 - 空データを受信`);
                }
                return;
            }
            
            const availableSlots = this.checkAvailability(pavilions);

            if (availableSlots.length > 0) {
                const timeStr = new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
                console.log(`${timeStr}: ${availableSlots.length}件の空きを検出`);
                await this.processAvailableSlots(availableSlots);
            } else if (this.debug) {
                const timeStr = new Date().toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'});
                console.log(`${timeStr}: 空きなし`);
            }

        } catch (error) {
            console.error(`監視エラー: ${error.message}`);
        }
    }

    async start() {
        console.log('Expo Monitor 開始');
        console.log(`基本監視間隔: ${this.config.monitoring.interval}秒 (営業時間内)`);
        console.log(`監視対象: ${this.config.monitoring.pavilions.join(', ')}`);
        console.log('時間帯別監視間隔: 深夜30分 → 朝8時以降5分 → 8:45以降30秒 → 営業時間内2秒');
        
        this.isRunning = true;

        // 最初に一度実行
        await this.monitorOnce();

        // 動的間隔での定期実行
        const scheduleNext = () => {
            if (!this.isRunning) return;
            
            const currentInterval = this.getMonitoringInterval();
            const now = new Date();
            const timeStr = now.toTimeString().slice(0, 8);
            
            if (this.debug) {
                console.log(`${timeStr}: 次回実行まで ${currentInterval/1000}秒`);
            }
            
            this.timeoutId = setTimeout(async () => {
                if (this.isRunning) {
                    await this.monitorOnce();
                    scheduleNext();
                }
            }, currentInterval);
        };

        scheduleNext();

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
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
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