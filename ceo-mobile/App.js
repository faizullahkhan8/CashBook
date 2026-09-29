import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DashboardScreen } from './src/features/dashboard/DashboardScreen';
import { ClosingsScreen } from './src/features/closings/ClosingsScreen';
import { ClosingDetailsScreen } from './src/features/closings/ClosingDetailsScreen';

export default function App() {
  const [screen, setScreen] = useState('dashboard');
  const [selectedClosing, setSelectedClosing] = useState(null);

  const openClosing = (closing) => { setSelectedClosing(closing); setScreen('closing-details'); };
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      {screen === 'dashboard' && <DashboardScreen />}
      {screen === 'closings' && <ClosingsScreen onOpen={openClosing} />}
      {screen === 'closing-details' && <ClosingDetailsScreen closing={selectedClosing} onBack={() => setScreen('closings')} />}
      {screen !== 'closing-details' && (
        <View style={styles.tabs}>
          <Tab active={screen === 'dashboard'} label="Live Summary" onPress={() => setScreen('dashboard')} />
          <Tab active={screen === 'closings'} label="Past Closings" onPress={() => setScreen('closings')} />
        </View>
      )}
    </SafeAreaView>
  );
}

function Tab({ active, label, onPress }) {
  return <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.activeTab]}><Text style={[styles.tabText, active && styles.activeText]}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07101f' },
  tabs: { flexDirection: 'row', padding: 10, gap: 8, backgroundColor: '#0d1729', borderTopWidth: 1, borderTopColor: '#1e293b' },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  activeTab: { backgroundColor: '#27325b' },
  tabText: { color: '#64748b', fontWeight: '700' },
  activeText: { color: '#fff' },
});
