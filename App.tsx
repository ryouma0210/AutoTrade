import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AssetsScreen } from './src/screens/AssetsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PositionDetail } from './src/screens/PositionDetail';
import { PositionsScreen } from './src/screens/PositionsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AppStoreProvider, useAppStore } from './src/store/AppStore';
import { colors } from './src/theme';
type Tab = 'home' | 'positions' | 'history' | 'assets' | 'settings';
const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'ホーム', icon: 'home' }, { key: 'positions', label: '銘柄', icon: 'layers' }, { key: 'history', label: '履歴', icon: 'receipt' }, { key: 'assets', label: '資産', icon: 'bar-chart' }, { key: 'settings', label: '設定', icon: 'settings' },
];
function Shell() {
  const { loading } = useAppStore(); const [tab, setTab] = useState<Tab>('home'); const [selected, setSelected] = useState<string | null>(null);
  if (loading) return <View style={styles.loading}><View style={styles.mark}><Ionicons name="trending-up" size={34} color="white"/></View><Text style={styles.loadingTitle}>自動トレード</Text><ActivityIndicator color={colors.primary} style={{ marginTop: 18 }}/></View>;
  const content = tab === 'home' ? <HomeScreen onPosition={setSelected}/> : tab === 'positions' ? <PositionsScreen onPosition={setSelected}/> : tab === 'history' ? <HistoryScreen/> : tab === 'assets' ? <AssetsScreen/> : <SettingsScreen/>;
  return <SafeAreaView style={styles.safe} edges={['top']}><View style={styles.screen}>{content}</View><View style={styles.nav}>{tabs.map(item => { const active = item.key === tab; const outline = `${item.icon}-outline` as keyof typeof Ionicons.glyphMap; return <TouchableOpacity key={item.key} style={styles.navItem} onPress={() => setTab(item.key)}><Ionicons name={active ? item.icon : outline} size={22} color={active ? colors.primary : colors.muted}/><Text style={[styles.navLabel, active && styles.navActive]}>{item.label}</Text>{active && <View style={styles.dot}/>}</TouchableOpacity>})}</View><PositionDetail symbol={selected} onClose={() => setSelected(null)}/></SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><AppStoreProvider><StatusBar style="dark"/><Shell/></AppStoreProvider></SafeAreaProvider>; }
const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:colors.background},screen:{flex:1},nav:{height:76,backgroundColor:'white',borderTopWidth:1,borderTopColor:colors.border,flexDirection:'row',paddingHorizontal:6,paddingTop:9},navItem:{flex:1,alignItems:'center',gap:3},navLabel:{fontSize:10,color:colors.muted,fontWeight:'600'},navActive:{color:colors.primary,fontWeight:'800'},dot:{width:4,height:4,borderRadius:2,backgroundColor:colors.primary},loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background},mark:{width:68,height:68,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:colors.primary},loadingTitle:{fontSize:23,fontWeight:'800',color:colors.ink,marginTop:15} });
