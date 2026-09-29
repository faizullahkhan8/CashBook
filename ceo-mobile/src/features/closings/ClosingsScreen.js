import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../core/api';
import { createLiveSocket } from '../../core/socket';

const money = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

export function ClosingsScreen({ onOpen }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setError(''); const result = await api.closings(); setItems(result.items || []); }
    catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    load();
    const socket = createLiveSocket();
    socket.on('v1.closing.created', () => load());
    socket.on('v1.closing.updated', () => load());
    socket.on('v1.closing.voided', () => load());
    return () => socket.disconnect();
  }, [load]);
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={styles.screen}>
      <View style={styles.header}><Text style={styles.eyebrow}>HISTORY</Text><Text style={styles.title}>Past Closings</Text><Text style={styles.sub}>Tap any closing for full details</Text></View>
      {loading ? <ActivityIndicator style={styles.loader} color="#34d399" /> : null}
      {error ? <Text style={styles.error}>Server unavailable: {error}</Text> : null}
      <FlatList data={items} keyExtractor={(item) => item._id || String(item.sourceId)} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#34d399" />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No closing has been synced yet.</Text> : null}
        renderItem={({ item }) => <ClosingRow item={item} onPress={() => onOpen(item)} />} />
    </View>
  );
}

function ClosingRow({ item, onPress }) {
  const raw = item.raw || {};
  return <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
    <View style={styles.row}><View><Text style={styles.shift}>Shift #{raw.shift_id || item.shiftId || '—'}</Text><Text style={styles.date}>{formatDate(raw.closed_at || item.closedAt)}</Text></View><Text style={styles.arrow}>›</Text></View>
    <View style={styles.metrics}><Metric label="Grand Total" value={money(raw.total_revenue)} /><Metric label="Short Items" value={money(item.shortItemsAmount ?? raw.short_items_amount)} /><Metric label="Variance" value={money(raw.variance)} warning={Number(raw.variance) !== 0} /></View>
  </TouchableOpacity>;
}
function Metric({ label, value, warning }) { return <View><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, warning && styles.warning]}>{value}</Text></View>; }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }
const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { paddingHorizontal: 18, paddingTop: 18 }, eyebrow: { color: '#34d399', fontSize: 11, fontWeight: '900', letterSpacing: 2 }, title: { color: '#f8fafc', fontSize: 27, fontWeight: '900', marginTop: 4 }, sub: { color: '#64748b', marginTop: 5 },
  list: { padding: 18, paddingBottom: 30 }, card: { backgroundColor: '#101c30', borderWidth: 1, borderColor: '#1e293b', borderRadius: 18, padding: 16, marginBottom: 12 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, shift: { color: '#e2e8f0', fontSize: 17, fontWeight: '900' }, date: { color: '#64748b', marginTop: 4 }, arrow: { color: '#34d399', fontSize: 30 }, metrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#1e293b' }, metricLabel: { color: '#64748b', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }, metricValue: { color: '#cbd5e1', fontWeight: '800', marginTop: 5 }, warning: { color: '#fbbf24' }, loader: { marginTop: 50 }, empty: { color: '#64748b', textAlign: 'center', marginTop: 70 }, error: { color: '#fecaca', backgroundColor: '#451a1a', margin: 18, padding: 12, borderRadius: 12 },
});
