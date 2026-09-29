import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatCard } from '../../components/StatCard';
import { api } from '../../core/api';
import { createLiveSocket } from '../../core/socket';

const emptySummary = {
  openingCash: 0, totalCash: 0, totalCard: 0, totalQr: 0,
  totalOnline: 0, totalShortItems: 0, netCash: 0, grandTotal: 0,
};

export function DashboardScreen() {
  const [snapshot, setSnapshot] = useState({ summary: emptySummary });
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setSnapshot((await api.dashboard()) || { summary: emptySummary });
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    load();
    const socket = createLiveSocket();
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('v1.dashboard.updated', (next) => setSnapshot(next));
    return () => socket.disconnect();
  }, [load]);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const summary = { ...emptySummary, ...(snapshot.summary || snapshot.metrics || {}) };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#34d399" />}>
      <View style={styles.headerRow}>
        <View><Text style={styles.eyebrow}>ZADA PHARMACY</Text><Text style={styles.title}>CEO Live Summary</Text></View>
        <View style={[styles.liveBadge, !connected && styles.offlineBadge]}><View style={[styles.dot, !connected && styles.offlineDot]} /><Text style={styles.liveText}>{connected ? 'LIVE' : 'SYNCING'}</Text></View>
      </View>
      <Text style={styles.subtitle}>{staffName(snapshot)} · Updated {formatTime(snapshot.sourceUpdatedAt || snapshot.updatedAt)}</Text>
      {error ? <Text style={styles.error}>Server unavailable: {error}</Text> : null}
      <View style={styles.grid}>
        <StatCard label="Opening Cash" value={summary.openingCash} color="#a78bfa" />
        <StatCard label="Cash Collection" value={summary.totalCash} color="#34d399" />
        <StatCard label="Card Payment" value={summary.totalCard} color="#60a5fa" />
        <StatCard label="QR Payment" value={summary.totalQr} color="#22d3ee" />
        <StatCard label="Online Collection" value={summary.totalOnline} color="#818cf8" />
        <StatCard label="Short Items" value={summary.totalShortItems} color="#fbbf24" />
        <StatCard label="Net Cash" value={summary.netCash} color="#fb7185" />
        <StatCard label="Grand Total" value={summary.grandTotal} color="#f8fafc" />
      </View>
      <View style={styles.note}><Text style={styles.noteTitle}>Read-only CEO view</Text><Text style={styles.noteText}>New counter entries update these totals automatically.</Text></View>
    </ScrollView>
  );
}

function formatTime(value) {
  if (!value) return 'not synced yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function staffName(snapshot) {
  if (snapshot.shift?.staff_name) return snapshot.shift.staff_name;
  return [snapshot.employee1, snapshot.employee2].filter(Boolean).join(' & ') || 'Current shift';
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 18, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  eyebrow: { color: '#34d399', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  title: { color: '#f8fafc', fontSize: 27, lineHeight: 34, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#64748b', marginTop: 8, marginBottom: 20 },
  liveBadge: { backgroundColor: '#064e3b', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  offlineBadge: { backgroundColor: '#3f2c16' }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34d399' }, offlineDot: { backgroundColor: '#fbbf24' },
  liveText: { color: '#f8fafc', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  error: { color: '#fecaca', backgroundColor: '#451a1a', padding: 12, borderRadius: 12, marginBottom: 14 },
  note: { marginTop: 8, padding: 16, borderRadius: 16, backgroundColor: '#0d1729', borderWidth: 1, borderColor: '#1e293b' },
  noteTitle: { color: '#e2e8f0', fontWeight: '800' }, noteText: { color: '#64748b', marginTop: 5, lineHeight: 19 },
});
