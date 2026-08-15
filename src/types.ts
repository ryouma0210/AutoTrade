export type BrokerMode = 'demo' | 'live';
export type Position = { id: number; symbol: string; name: string; quantity: number; averagePrice: number; currentPrice: number; highWaterMark: number; updatedAt: string };
export type TradeRule = { symbol: string; enabled: boolean; takeProfitPct: number; stopLossPct: number; trailingEnabled: boolean; trailingTriggerPct: number; trailingStopPct: number };
export type Trade = { id: number; symbol: string; name: string; side: 'BUY' | 'SELL'; quantity: number; price: number; amount: number; profit: number | null; profitPct: number | null; reason: string | null; executedAt: string };
export type AssetSnapshot = { date: string; totalAsset: number; dailyProfit: number };
export type AppSettings = { globalTradingEnabled: boolean; autoSellEnabled: boolean; notificationsEnabled: boolean; maxDailyPurchase: number; maxDailyLoss: number; brokerMode: BrokerMode };
export type SellSignal = { action: 'HOLD' | 'SELL'; reason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP'; profitPct: number; nextHighWaterMark: number };
