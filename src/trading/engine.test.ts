import { describe, expect, it } from 'vitest';
import { evaluateSell } from './engine';
import type { Position, TradeRule } from '../types';
const position: Position = { id: 1, symbol: '7203', name: 'トヨタ自動車', quantity: 100, averagePrice: 3000, currentPrice: 3000, highWaterMark: 3000, updatedAt: '' };
const rule: TradeRule = { symbol: '7203', enabled: true, takeProfitPct: 5, stopLossPct: 3, trailingEnabled: false, trailingTriggerPct: 4, trailingStopPct: 2 };
describe('evaluateSell', () => {
  it('利確ラインで売却する', () => expect(evaluateSell({ ...position, currentPrice: 3150 }, rule).reason).toBe('TAKE_PROFIT'));
  it('損切りラインで売却する', () => expect(evaluateSell({ ...position, currentPrice: 2910 }, rule).reason).toBe('STOP_LOSS'));
  it('トレーリング高値から下落したら売却する', () => expect(evaluateSell({ ...position, currentPrice: 3180, highWaterMark: 3250 }, { ...rule, trailingEnabled: true }).reason).toBe('TRAILING_STOP'));
});
