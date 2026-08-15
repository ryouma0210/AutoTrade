import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { getPositions, getRules, getSnapshots, getTrades, initializeDatabase, loadSettings, recordSell, saveRule, saveSettings, updatePositionQuote } from '../data/database';
import { DemoBrokerClient, HttpBrokerClient, credentialStore } from '../services/broker';
import { notifySell, prepareNotifications } from '../services/notifications';
import { evaluateSell } from '../trading/engine';
import type { AppSettings, AssetSnapshot, Position, Trade, TradeRule } from '../types';

type Store = { loading: boolean; refreshing: boolean; positions: Position[]; rules: TradeRule[]; trades: Trade[]; snapshots: AssetSnapshot[]; settings: AppSettings; refresh: () => Promise<void>; refreshQuotes: () => Promise<void>; updateRule: (rule: TradeRule) => Promise<void>; updateSettings: (next: AppSettings) => Promise<void> };
const defaults: AppSettings = { globalTradingEnabled: false, autoSellEnabled: true, notificationsEnabled: true, maxDailyPurchase: 300000, maxDailyLoss: 50000, brokerMode: 'demo' };
const AppStore = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]); const [rules, setRules] = useState<TradeRule[]>([]); const [trades, setTrades] = useState<Trade[]>([]); const [snapshots, setSnapshots] = useState<AssetSnapshot[]>([]); const [settings, setSettings] = useState(defaults);
  const refresh = useCallback(async () => { const [p, r, t, s, config] = await Promise.all([getPositions(), getRules(), getTrades(), getSnapshots(), loadSettings()]); setPositions(p); setRules(r); setTrades(t); setSnapshots(s); setSettings(config); }, []);
  useEffect(() => { initializeDatabase().then(refresh).then(() => prepareNotifications().catch(() => undefined)).catch(error => Alert.alert('初期化エラー', String(error))).finally(() => setLoading(false)); }, [refresh]);
  const refreshQuotes = useCallback(async () => {
    if (!positions.length) return; setRefreshing(true);
    try {
      const credentials = settings.brokerMode === 'live' ? await credentialStore.load() : null;
      if (settings.brokerMode === 'live' && !credentials) throw new Error('API設定がありません。設定画面から接続情報を保存してください。');
      const broker = credentials ? new HttpBrokerClient(credentials) : new DemoBrokerClient(positions);
      const quotes = await broker.getQuotes(positions.map(p => p.symbol));
      const updated = positions.map(p => ({ ...p, currentPrice: quotes[p.symbol] ?? p.currentPrice, highWaterMark: Math.max(p.highWaterMark, quotes[p.symbol] ?? p.currentPrice) }));
      for (const position of updated) await updatePositionQuote(position.symbol, position.currentPrice, position.highWaterMark);
      if (settings.globalTradingEnabled && settings.autoSellEnabled) {
        for (const position of updated) {
          const rule = rules.find(r => r.symbol === position.symbol); if (!rule) continue;
          const signal = evaluateSell(position, rule);
          if (signal.action === 'SELL' && signal.reason) { await broker.sell(position); await recordSell(position, signal.reason); if (settings.notificationsEnabled) await notifySell(position.symbol, signal.reason, signal.profitPct); }
        }
      }
      await refresh();
    } catch (error) { Alert.alert('更新できませんでした', error instanceof Error ? error.message : String(error)); }
    finally { setRefreshing(false); }
  }, [positions, refresh, rules, settings]);
  const updateRule = useCallback(async (rule: TradeRule) => { await saveRule(rule); setRules(current => current.map(r => r.symbol === rule.symbol ? rule : r)); }, []);
  const updateSettings = useCallback(async (next: AppSettings) => { await saveSettings(next); setSettings(next); }, []);
  const value = useMemo(() => ({ loading, refreshing, positions, rules, trades, snapshots, settings, refresh, refreshQuotes, updateRule, updateSettings }), [loading, refreshing, positions, rules, trades, snapshots, settings, refresh, refreshQuotes, updateRule, updateSettings]);
  return <AppStore.Provider value={value}>{children}</AppStore.Provider>;
}
export function useAppStore() { const store = useContext(AppStore); if (!store) throw new Error('AppStoreProvider is missing'); return store; }
