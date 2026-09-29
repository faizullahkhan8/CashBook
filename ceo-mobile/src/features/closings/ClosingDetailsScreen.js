import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatCard } from '../../components/StatCard';
import { api } from '../../core/api';

export function ClosingDetailsScreen({ closing, onBack }) {
  const [details, setDetails] = useState(closing);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.closing(closing?.syncId || closing?.closingCode).then(setDetails).catch(() => {}).finally(() => setLoading(false)); }, [closing]);
  const raw = details?.raw || {};
  const card = details?.paymentBreakdown?.card || raw.card_sales || 0;
  const qr = details?.paymentBreakdown?.qr || raw.qr_sales || 0;
  const online = Number(raw.online_sales || 0) || Number(card) + Number(qr);
  const stats = [
    ['Opening Cash', raw.opening_float, '#a78bfa'], ['Cash Collection', raw.cash_sales, '#34d399'],
    ['Card Payment', card, '#60a5fa'], ['QR Payment', qr, '#22d3ee'], ['Online Collection', online, '#818cf8'],
    ['Short Items', details?.shortItemsAmount ?? raw.short_items_amount, '#fbbf24'], ['Net Cash', raw.expected_drawer_cash, '#fb7185'], ['Grand Total', raw.total_revenue, '#f8fafc'],
  ];
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <TouchableOpacity onPress={onBack}><Text style={styles.back}>‹  Past Closings</Text></TouchableOpacity>
    <Text style={styles.eyebrow}>CLOSING DETAILS</Text><Text style={styles.title}>Shift #{raw.shift_id || details?.shiftId || '—'}</Text>
    <Text style={styles.sub}>{formatDate(raw.closed_at || details?.closedAt)} · {raw.staff_name || 'Staff not recorded'}</Text>
    {loading ? <ActivityIndicator color="#34d399" style={{ marginVertical: 12 }} /> : null}
    <View style={styles.grid}>{stats.map(([label, value, color]) => <StatCard key={label} label={label} value={value} color={color} />)}</View>
    <View style={styles.reconcile}><Text style={styles.sectionTitle}>Cash Reconciliation</Text><Line label="Counted Cash" value={raw.counted_cash} /><Line label="Expected Cash" value={raw.expected_drawer_cash} /><Line label="Variance" value={raw.variance} accent /></View>
  </ScrollView>;
}
function Line({ label, value, accent }) { return <View style={styles.line}><Text style={styles.lineLabel}>{label}</Text><Text style={[styles.lineValue, accent && styles.accent]}>Rs {Number(value || 0).toLocaleString()}</Text></View>; }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString([], { dateStyle: 'full', timeStyle: 'short' }); }
const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 18, paddingBottom: 40 }, back: { color: '#34d399', fontSize: 15, fontWeight: '800', marginBottom: 24 }, eyebrow: { color: '#818cf8', fontSize: 11, fontWeight: '900', letterSpacing: 2 }, title: { color: '#f8fafc', fontSize: 28, fontWeight: '900', marginTop: 4 }, sub: { color: '#64748b', marginTop: 7, marginBottom: 20 }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, reconcile: { backgroundColor: '#101c30', borderWidth: 1, borderColor: '#1e293b', borderRadius: 18, padding: 17, marginTop: 8 }, sectionTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '900', marginBottom: 12 }, line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1e293b' }, lineLabel: { color: '#94a3b8' }, lineValue: { color: '#e2e8f0', fontWeight: '800' }, accent: { color: '#fbbf24' },
});
