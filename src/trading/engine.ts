import type { Position, SellSignal, TradeRule } from '../types';
export function calculateProfit(position: Pick<Position, 'averagePrice' | 'currentPrice' | 'quantity'>) {
  const profit = (position.currentPrice - position.averagePrice) * position.quantity;
  const profitPct = position.averagePrice === 0 ? 0 : ((position.currentPrice - position.averagePrice) / position.averagePrice) * 100;
  return { profit, profitPct };
}
export function evaluateSell(position: Position, rule: TradeRule): SellSignal {
  const { profitPct } = calculateProfit(position);
  const nextHighWaterMark = Math.max(position.highWaterMark, position.currentPrice);
  if (!rule.enabled) return { action: 'HOLD', profitPct, nextHighWaterMark };
  if (profitPct <= -Math.abs(rule.stopLossPct)) return { action: 'SELL', reason: 'STOP_LOSS', profitPct, nextHighWaterMark };
  if (rule.trailingEnabled && profitPct >= rule.trailingTriggerPct) {
    const drawdownPct = ((nextHighWaterMark - position.currentPrice) / nextHighWaterMark) * 100;
    if (drawdownPct >= rule.trailingStopPct) return { action: 'SELL', reason: 'TRAILING_STOP', profitPct, nextHighWaterMark };
    return { action: 'HOLD', profitPct, nextHighWaterMark };
  }
  if (profitPct >= rule.takeProfitPct) return { action: 'SELL', reason: 'TAKE_PROFIT', profitPct, nextHighWaterMark };
  return { action: 'HOLD', profitPct, nextHighWaterMark };
}
