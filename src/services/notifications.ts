import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });
export async function prepareNotifications() { if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('trades', { name: '売買通知', importance: Notifications.AndroidImportance.HIGH }); const current = await Notifications.getPermissionsAsync(); if (current.status !== 'granted') await Notifications.requestPermissionsAsync(); }
export async function notifySell(symbol: string, reason: string, profitPct: number) { await Notifications.scheduleNotificationAsync({ content: { title: `${symbol} を売却しました`, body: `${reason} / 損益率 ${profitPct.toFixed(2)}%` }, trigger: null }); }
