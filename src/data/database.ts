import * as SQLite from 'expo-sqlite';
import type { AppSettings, AssetSnapshot, Position, Trade, TradeRule } from '../types';

type PositionRow = { id: number; symbol: string; name: string; quantity: number; average_price: number; current_price: number; high_water_mark: number; updated_at: string };
type RuleRow = { symbol: string; enabled: number; take_profit_pct: number; stop_loss_pct: number; trailing_enabled: number; trailing_trigger_pct: number; trailing_stop_pct: number };
type TradeRow = { id: number; symbol: string; name: string; side: 'BUY' | 'SELL'; quantity: number; price: number; amount: number; profit: number | null; profit_pct: number | null; reason: string | null; executed_at: string };
type SnapshotRow = { date: string; total_asset: number; daily_profit: number };

let dbPromise: ReturnType<typeof SQLite.openDatabaseAsync> | null = null;
const getDb = () => (dbPromise ??= SQLite.openDatabaseAsync('auto-trade.db'));
const isProduction = process.env.EXPO_PUBLIC_APP_ENV === 'production';

export async function initializeDatabase() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS positions (id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT UNIQUE NOT NULL, name TEXT NOT NULL, quantity REAL NOT NULL, average_price REAL NOT NULL, current_price REAL NOT NULL, high_water_mark REAL NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS trade_rules (symbol TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1, take_profit_pct REAL NOT NULL DEFAULT 5, stop_loss_pct REAL NOT NULL DEFAULT 3, trailing_enabled INTEGER NOT NULL DEFAULT 0, trailing_trigger_pct REAL NOT NULL DEFAULT 4, trailing_stop_pct REAL NOT NULL DEFAULT 2);
    CREATE TABLE IF NOT EXISTS trades (id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT NOT NULL, name TEXT NOT NULL, side TEXT NOT NULL CHECK(side IN ('BUY','SELL')), quantity REAL NOT NULL, price REAL NOT NULL, amount REAL NOT NULL, profit REAL, profit_pct REAL, reason TEXT, executed_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS asset_snapshots (date TEXT PRIMARY KEY, total_asset REAL NOT NULL, daily_profit REAL NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS favorites (symbol TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL);
  `);
  const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM positions');
  if (!isProduction && (count?.count ?? 0) === 0) await seedDemoData();
}

async function seedDemoData() {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    const positions = [
      ['7203', 'トヨタ自動車', 100, 2812, 2945, 2972],
      ['6758', 'ソニーグループ', 50, 3180, 3115, 3260],
      ['8306', '三菱UFJ', 200, 1842, 1918, 1924],
    ] as const;
    for (const p of positions) {
      await db.runAsync('INSERT INTO positions(symbol,name,quantity,average_price,current_price,high_water_mark,updated_at) VALUES(?,?,?,?,?,?,?)', ...p, now);
      await db.runAsync('INSERT INTO trade_rules(symbol,enabled,take_profit_pct,stop_loss_pct,trailing_enabled,trailing_trigger_pct,trailing_stop_pct) VALUES(?,1,5,3,0,4,2)', p[0]);
      await db.runAsync("INSERT INTO trades(symbol,name,side,quantity,price,amount,executed_at) VALUES(?,?,'BUY',?,?,?,?)", p[0], p[1], p[2], p[3], p[2] * p[3], now);
    }
    const values = [1550000, 1558000, 1549000, 1572000, 1581000, 1594000, 1602250];
    for (let i = 0; i < values.length; i++) {
      const date = new Date(Date.now() - (values.length - 1 - i) * 86400000).toISOString().slice(0, 10);
      await db.runAsync('INSERT OR IGNORE INTO asset_snapshots(date,total_asset,daily_profit) VALUES(?,?,?)', date, values[i], i ? values[i] - values[i - 1] : 0);
    }
  });
}

const mapPosition = (r: PositionRow): Position => ({ id: r.id, symbol: r.symbol, name: r.name, quantity: r.quantity, averagePrice: r.average_price, currentPrice: r.current_price, highWaterMark: r.high_water_mark, updatedAt: r.updated_at });
const mapRule = (r: RuleRow): TradeRule => ({ symbol: r.symbol, enabled: !!r.enabled, takeProfitPct: r.take_profit_pct, stopLossPct: r.stop_loss_pct, trailingEnabled: !!r.trailing_enabled, trailingTriggerPct: r.trailing_trigger_pct, trailingStopPct: r.trailing_stop_pct });

export async function getPositions() { const db = await getDb(); return (await db.getAllAsync<PositionRow>('SELECT * FROM positions ORDER BY symbol')).map(mapPosition); }
export async function getRules() { const db = await getDb(); return (await db.getAllAsync<RuleRow>('SELECT * FROM trade_rules')).map(mapRule); }
export async function getTrades() { const db = await getDb(); const rows = await db.getAllAsync<TradeRow>('SELECT * FROM trades ORDER BY executed_at DESC'); return rows.map(r => ({ id: r.id, symbol: r.symbol, name: r.name, side: r.side, quantity: r.quantity, price: r.price, amount: r.amount, profit: r.profit, profitPct: r.profit_pct, reason: r.reason, executedAt: r.executed_at } satisfies Trade)); }
export async function getSnapshots() { const db = await getDb(); return (await db.getAllAsync<SnapshotRow>('SELECT * FROM asset_snapshots ORDER BY date')).map(r => ({ date: r.date, totalAsset: r.total_asset, dailyProfit: r.daily_profit } satisfies AssetSnapshot)); }

export async function saveRule(rule: TradeRule) {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO trade_rules(symbol,enabled,take_profit_pct,stop_loss_pct,trailing_enabled,trailing_trigger_pct,trailing_stop_pct) VALUES(?,?,?,?,?,?,?)', rule.symbol, Number(rule.enabled), rule.takeProfitPct, rule.stopLossPct, Number(rule.trailingEnabled), rule.trailingTriggerPct, rule.trailingStopPct);
}
export async function updatePositionQuote(symbol: string, price: number, high: number) { const db = await getDb(); await db.runAsync('UPDATE positions SET current_price=?, high_water_mark=?, updated_at=? WHERE symbol=?', price, high, new Date().toISOString(), symbol); }
export async function recordSell(position: Position, reason: string) {
  const db = await getDb(); const profit = (position.currentPrice - position.averagePrice) * position.quantity; const profitPct = ((position.currentPrice - position.averagePrice) / position.averagePrice) * 100;
  await db.withTransactionAsync(async () => {
    await db.runAsync("INSERT INTO trades(symbol,name,side,quantity,price,amount,profit,profit_pct,reason,executed_at) VALUES(?,?,'SELL',?,?,?,?,?,?,?)", position.symbol, position.name, position.quantity, position.currentPrice, position.quantity * position.currentPrice, profit, profitPct, reason, new Date().toISOString());
    await db.runAsync('DELETE FROM positions WHERE symbol=?', position.symbol);
  });
}
export async function loadSettings(): Promise<AppSettings> {
  const db = await getDb(); const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key,value FROM settings'); const values = Object.fromEntries(rows.map(r => [r.key, JSON.parse(r.value)]));
  return { globalTradingEnabled: values.globalTradingEnabled ?? false, autoSellEnabled: values.autoSellEnabled ?? true, notificationsEnabled: values.notificationsEnabled ?? true, maxDailyPurchase: values.maxDailyPurchase ?? 300000, maxDailyLoss: values.maxDailyLoss ?? 50000, brokerMode: values.brokerMode ?? 'demo' };
}
export async function saveSettings(settings: AppSettings) { const db = await getDb(); await db.withTransactionAsync(async () => { for (const [key, value] of Object.entries(settings)) await db.runAsync('INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)', key, JSON.stringify(value)); }); }
