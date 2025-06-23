# 当日予約効率化システム

## 現状
2025.06.23 第一段階目的　計画中

## 第一段階目的
https://expo.ebii.net/?mode=test サイトが提供するAPI（https://expo.ebii.net/api/data,https://expo.ebii.net/api/add）を使用して、特定（引数指定）のパビリオンに空きができたのを検知してSlackへ通知するシステムを構築。

## 第二段階目的
第一段階でできたシステムを使用し、条件を満たした時、自動的にその空きパビリオンを予約。

## 方法
サーバー（開発環境：ローカルサーバー）を立てて、APIを定期的に実行。条件を満たした時、Slackへ通知。

## API使用サービス一例
expoService.js
```
// src/services/expoService.js

const API_URL = 'https://expo.ebii.net/api/data';
const API_URL2 = 'https://expo.ebii.net/api/add';

export const DEFAULT_SETTINGS = {
    autoRefresh: true,
    showAvailableOnly: false,
    showWheelchairAccessible: true,
};

export async function fetchExpoData(add=false) {
    try {
        const response = await fetch(add ? API_URL2 : API_URL);
        if (!response.ok) {
            throw new Error('APIからのデータ取得に失敗しました');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('エラーが発生しました:', error);
        throw error;
    }
}

export function getStatusIconComponent(status) {
    const { StatusAvailableIcon, StatusFewLeftIcon, StatusFullIcon, StatusNoSlotsIcon } = require('../components/Icons'); // Lazy load to avoid circular deps if Icons import something from service

    switch (status.toString()) {
        case '0': return <StatusAvailableIcon />;
        case '1': return <StatusFewLeftIcon />;
        case '2': return <StatusFullIcon />;
        default: return <StatusNoSlotsIcon />;
    }
}

export function saveSettings(settings) {
    try {
        localStorage.setItem('expoSettings', JSON.stringify(settings));
    } catch (error) {
        console.error('設定の保存に失敗しました:', error);
    }
}

export function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('expoSettings');
        return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
    } catch (error) {
        console.error('設定の読み込みに失敗しました:', error);
        return DEFAULT_SETTINGS;
    }
}

export function filterData(data, settings) {
    if (!data) return [];

    return data.filter(pavilion => {
        if (pavilion.n == "") return false;

        if (settings.showAvailableOnly) {
            const hasAvailableSlots = pavilion.s && pavilion.s.some(slot => slot.s === 0 || slot.s === 1);
            if (!hasAvailableSlots) return false;
        }

        if (!settings.showWheelchairAccessible) {
            const name = pavilion.c in names ? names[pavilion.c][0] : pavilion.n;
            const isActuallyAccessibleOrHasRestrictions = name &&
                (name.includes('車いす') ||
                    name.includes('車椅子') ||
                    name.includes('障がい') ||
                    name.includes('障害') ||
                    name.includes('バリアフリー')
                );
            if (isActuallyAccessibleOrHasRestrictions) return false;
        }
        return true;
    });
}


export function getCurrentFormattedDate() {
    const today = new Date();
    return today.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }) + " 現在";
}

export const names = {
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
    'I90C': ['いのちの遊び場', 'ぺちゃくちゃ'],
    'I90F': ['いのちの遊び場ちゃくちゃ(車いす)', 'ぺちゃくちゃ(車いす)'],
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
    'J900': ['未来の都市', 'シアター入場付き'],
    'J903': ['未来の都市', ''],
    'JC00': ['空飛ぶクルマ', ''],
    'Q001': ['アオと夜の虹', ''],
    'Q004': ['アオと夜の虹車いす', '車いす'],
    'Q007': ['万博サウナ90分男性', '90分男性'],
    'Q010': ['万博サウナ90分女性', '90分女性'],
    'Q013': ['万博サウナ90分男女混合', '90分男女混合'],
    'H3H0': ['ウーマンズ', ''],
}
```

PavilionTable.js
```
import React, { useEffect, useState } from 'react';
import { getStatusIconComponent, names } from '../services/expoService';

function formatDateToYMD() {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
}

const str2date = (time) => {
    const hours = time.slice(0, 2);
    const minutes = time.slice(2, 4);
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return date;
}

const PavilionTable = ({ pavilions, setIsOpen, ticketIds, settings, errMsg }) => {
    const [timeSlots, setTimeSlots] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [opacity, setOpacity] = useState(1);

    const openWindow = (pavilionCode) => {
        if (window.history.length < 4) {
            alert("予約ボタンから設定していただけますと、直接予約画面に飛べるようになります。")
        } else {
            setOpacity(0.5);
            window.location.href = `https://ticket.expo2025.or.jp/event_time/?id=${ticketIds}&event_id=${pavilionCode}&screen_id=108&lottery=5&entrance_date=${formatDateToYMD()}`;
        }
    };

    useEffect(() => {        
        let minDate = new Date();
        minDate.setHours(7, 0, 0, 0);
        let maxDate = new Date();
        maxDate.setHours(23, 0, 0, 0);

        const interval = 15 * 60 * 1000;
        const times = [];
        const timesCount = [];
        const availableTimesCount = [];
        for (let t = minDate.getTime(); t <= maxDate.getTime(); t += interval) {
            times.push(new Date(t));
            timesCount.push(0);
            availableTimesCount.push(0);
        }

        const tableDataTmp = [];
        for (let i = 0; i < pavilions.length; i++) {
            if (pavilions[i].n == "") continue;

            const timeData = {};
            for (let j = 0; j < pavilions[i].s.length; j++) {
                const time = str2date(pavilions[i].s[j].t);
                for (let k = 0; k < times.length - 1; k++) {
                    if (times[k] <= time && time < times[k + 1]) {
                        timesCount[k]++;
                        const key = times[k].getTime();
                        if (!(key in timeData)) timeData[key] = 2;
                        if (pavilions[i].s[j].s < timeData[key]) timeData[key] = pavilions[i].s[j].s;
                        if (Number(pavilions[i].s[j].s) <= 1) availableTimesCount[k]++;
                        break;
                    }
                }
            }

            tableDataTmp.push({
                code: pavilions[i].c,
                name: pavilions[i].c in names ? names[pavilions[i].c][0].replaceAll(names[pavilions[i].c][1], "") : pavilions[i].n,
                category: pavilions[i].c in names ? names[pavilions[i].c][1] : '',
                url: pavilions[i].u,
                timeData: timeData
            })
        }

        const start = timesCount.findIndex(x => x !== 0);
        const end = timesCount.length - 1 - [...timesCount].reverse().findIndex(x => x !== 0);
        const newTimes = times.slice(start, end + 1);
        setTimeSlots(newTimes);

        const now = new Date();
        if (newTimes.length == 0 ||
            (now.getHours() < 9 && now.toTimeString().slice(0, 8) < newTimes[0].toTimeString().slice(0, 8)) ||
            (now.getHours() >= 21 && newTimes[newTimes.length - 1].toTimeString().slice(0, 8) < now.toTimeString().slice(0, 8))) {
            setTableData([]);
            setIsOpen(false);
        } else {
            if (settings.showAvailableOnly) {
                setTimeSlots(times.filter((_, i) => availableTimesCount[i] > 0));
            }
            setTableData(tableDataTmp);
            setIsOpen(true);
        }

    }, [pavilions]);

    return (
        <div className="table-container">
            {tableData && tableData.length > 0 ? (
                <table className="reservation-table" style={{ opacity: opacity }}>
                    <thead>
                        <tr>
                            <th>施設名</th>
                            {timeSlots.map(time => {
                                const hhmm = time.toTimeString().slice(0, 5);
                                return <th key={`header-${hhmm}`}>{`${hhmm}`}</th>
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((pavilion) => (
                            <tr key={pavilion.code}>
                                <td>
                                    {pavilion.url ? (
                                        <a href={pavilion.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-blue)' }}>
                                            {pavilion.name}
                                        </a>
                                    ) : (
                                        pavilion.name
                                    )}
                                    <span className="pavilion-category">{pavilion.category}</span>
                                </td>
                                {timeSlots.map(time => {
                                    const hhmm = time.toTimeString().slice(0, 5);
                                    const status = time.getTime() in pavilion.timeData ? pavilion.timeData[time.getTime()].toString() : '';

                                    const uniqueCellKey = `${pavilion.code}-${hhmm}`;

                                    return (
                                        <td key={uniqueCellKey}>
                                            <span
                                                className={`status-icon ${(status === '0' || status === '1') ? 'status-icon-hover' : ''}`}
                                                onClick={() => {
                                                    if (status === '0' || status === '1') {
                                                        openWindow(pavilion.code);
                                                    }
                                                }}
                                                role="button"
                                                tabIndex={(status === '0' || status === '1') ? 0 : -1}
                                                onKeyDown={(e) => {
                                                    if ((e.key === 'Enter' || e.key === ' ') && (status === '0' || status === '1')) {
                                                        openWindow(pavilion.code);
                                                    }
                                                }}
                                            >
                                                {getStatusIconComponent(status)}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="no-data-message" style={{
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'rgb(102, 102, 102)',
                    backgroundColor: 'rgb(245, 245, 245)',
                }}>
                    {(() => {
                        if (errMsg) return errMsg;
                        
                        const now = new Date();
                        const hour = now.getHours();
                        if (hour < 9 || hour >= 21) {
                            return "営業時間外です";
                        }
                        return "表示できるデータがありません";
                    })()}
                </div>
            )}
        </div>
    );
};

export default PavilionTable;
```

## Claude Code質問
1. プログラミング言語: Node.js/JavaScript
で実装予定ですが、他の言語をご希望でしょうか？
→問題ありません。

2. Slack通知方法:
- Webhook URL を使用する想定ですが、Bot
トークンなど他の方法をご希望ですか？
→Webhookで問題ありません。
- 通知内容に含めたい情報（パビリオン名、時間帯、予約URL等）はありますか？
→そちらの情報があれば十分です。

3. 監視条件:
- 空き状況は「空きあり（ステータス0）」と「残りわずか（ステータス1）」の両方を通知対象にしますか？
→はい、それでお願いします。
- 特定の時間帯のみ監視したい場合がありますか？
→いえ全時間帯でお願いします。

4. ポーリング間隔:
- API呼び出し間隔は何秒/分に設定しますか？（推奨: 30秒〜1分）
→1~2秒です。設定ファイルで設定できるようにしたいです。

5. 設定ファイル形式:
- JSON形式で以下のような構成を想定していますが、いかがでしょうか？
{
"slack": {
    "webhookUrl": "https://hooks.slack.com/...",
    "channel": "#expo-alerts"
},
"monitoring": {
    "interval": 60,
    "pavilions": ["H1H9", "I900", "HQH0"],
    "notifyOnStatus": [0, 1]
}
}
→はい、問題ありません。

6. 重複通知の制御:
- 同じパビリオンの同じ時間帯について、一度通知したら一定時間は再通知しない機能は必要ですか？
→いえ、特に必要ありません。