import * as SecureStore from 'expo-secure-store';
import type { Position } from '../types';

export type BrokerCredentials = { baseUrl: string; apiKey: string; apiSecret: string };
export interface BrokerClient { getQuotes(symbols: string[]): Promise<Record<string, number>>; sell(position: Position): Promise<{ orderId: string }> }

export const credentialStore = {
  async save(value: BrokerCredentials) { await SecureStore.setItemAsync('broker_credentials', JSON.stringify(value), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }); },
  async load(): Promise<BrokerCredentials | null> { const value = await SecureStore.getItemAsync('broker_credentials'); return value ? JSON.parse(value) : null; },
  async clear() { await SecureStore.deleteItemAsync('broker_credentials'); },
};

export class DemoBrokerClient implements BrokerClient {
  constructor(private readonly positions: Position[]) {}
  async getQuotes(symbols: string[]) { return Object.fromEntries(symbols.map(symbol => { const p = this.positions.find(item => item.symbol === symbol); const drift = 1 + (Math.random() - 0.48) * 0.012; return [symbol, Math.max(1, Math.round((p?.currentPrice ?? 1000) * drift * 10) / 10)]; })); }
  async sell(position: Position) { await new Promise(resolve => setTimeout(resolve, 250)); return { orderId: `DEMO-${position.symbol}-${Date.now()}` }; }
}

export class HttpBrokerClient implements BrokerClient {
  constructor(private readonly credentials: BrokerCredentials) {}
  private async request<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`${this.credentials.baseUrl.replace(/\/$/, '')}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.credentials.apiKey}`, 'X-API-Secret': this.credentials.apiSecret, ...init?.headers } }); if (!response.ok) throw new Error(`証券会社APIエラー (${response.status})`); return response.json() as Promise<T>; }
  async getQuotes(symbols: string[]) { return this.request<Record<string, number>>(`/quotes?symbols=${encodeURIComponent(symbols.join(','))}`); }
  async sell(position: Position) { return this.request<{ orderId: string }>('/orders', { method: 'POST', body: JSON.stringify({ symbol: position.symbol, side: 'SELL', quantity: position.quantity, orderType: 'MARKET' }) }); }
}
