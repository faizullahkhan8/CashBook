import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatCard } from '../../components/StatCard';
import { api } from '../../core/api';
import { createLiveSocket } from '../../core/socket';

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => `${today().slice(0, 8)}01`;
const empty = { totalBills: 0, grossAmount: 0, taxDeduction: 0, actualPayable: 0, totalPaid: 0, outstandingBalance: 0, pendingBills: 0, overdueBills: 0 };

export function SupplierReportsScreen() {
  const [from, setFrom] = useState(monthStart()); const [to, setTo] = useState(today());
  const [dateType, setDateType] = useState('posting'); const [report, setReport] = useState({ summary: empty, items: [] });
  const [days, setDays] = useState([]); const [openDate, setOpenDate] = useState(''); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState('');
  const query = useMemo(() => `from=${from}&to=${to}&dateType=${dateType}`, [from, to, dateType]);
  const load = useCallback(async () => { try { setError(''); const [r, d] = await Promise.all([api.supplierBills(query), api.supplierDaily(query)]); setReport(r || { summary: empty, items: [] }); setDays(d || []); } catch (e) { setError(e.message); } }, [query]);
  useEffect(() => { load(); const socket = createLiveSocket(); ['v1.supplier-bill.updated', 'v1.supplier-bill.deleted', 'v1.supplier-payment.updated', 'v1.supplier-payment.deleted'].forEach((event) => socket.on(event, load)); return () => socket.disconnect(); }, [load]);
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const s = { ...empty, ...(report.summary || {}) };
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#34d399" />}>
    <Text style={styles.eyebrow}>SUPPLIER RECONCILIATION</Text><Text style={styles.title}>Bills & Payments</Text>
    <View style={styles.segment}><Chip active={dateType === 'posting'} label="Posting Date" onPress={() => setDateType('posting')} /><Chip active={dateType === 'bill'} label="Bill Date" onPress={() => setDateType('bill')} /></View>
    <View style={styles.filters}><DateField label="From" value={from} onChangeText={setFrom} /><DateField label="To" value={to} onChangeText={setTo} /></View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.grid}>
      <StatCard label="Gross Bills" value={s.grossAmount} color="#a78bfa" /><StatCard label="Tax Deduction" value={s.taxDeduction} color="#fbbf24" />
      <StatCard label="Actual Payable" value={s.actualPayable} color="#60a5fa" /><StatCard label="Total Paid" value={s.totalPaid} color="#34d399" />
      <StatCard label="Outstanding" value={s.outstandingBalance} color="#fb7185" /><StatCard label="Total Bills" value={s.totalBills} color="#e2e8f0" />
      <StatCard label="Pending Bills" value={s.pendingBills} color="#f97316" /><StatCard label="Overdue Bills" value={s.overdueBills} color="#ef4444" />
    </View>
    <Text style={styles.section}>Date-wise Report</Text>
    {days.map((day) => <View key={day.date} style={styles.dayCard}><TouchableOpacity onPress={() => setOpenDate(openDate === day.date ? '' : day.date)} style={styles.dayHead}><View><Text style={styles.dayDate}>{day.date}</Text><Text style={styles.daySub}>{day.summary.totalBills} bills · Payments made Rs {money(day.summary.paymentsMade)}</Text></View><Text style={styles.chevron}>{openDate === day.date ? '−' : '+'}</Text></TouchableOpacity>
      <View style={styles.dayTotals}><Small label="Gross" value={day.summary.grossAmount} /><Small label="Actual" value={day.summary.actualPayable} /><Small label="Balance" value={day.summary.outstandingBalance} /></View>
      {openDate === day.date && day.items.map((bill) => <View key={bill.syncId} style={styles.bill}><View><Text style={styles.supplier}>{bill.supplierName}</Text><Text style={styles.billMeta}>Bill {bill.supplierBillNo || '—'} · Voucher {bill.voucherNo || '—'}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={styles.amount}>Rs {money(bill.actualAmount)}</Text><Text style={[styles.status, bill.remainingBalance > 0 && styles.pending]}>{bill.paymentStatus}</Text></View></View>)}
    </View>)}
  </ScrollView>;
}
function Chip({ active, label, onPress }) { return <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></TouchableOpacity>; }
function DateField({ label, ...props }) { return <View style={{ flex: 1 }}><Text style={styles.fieldLabel}>{label} (YYYY-MM-DD)</Text><TextInput {...props} style={styles.input} placeholderTextColor="#475569" /></View>; }
function Small({ label, value }) { return <View><Text style={styles.smallLabel}>{label}</Text><Text style={styles.smallValue}>Rs {money(value)}</Text></View>; }
const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const styles = StyleSheet.create({ screen: { flex: 1 }, content: { padding: 18, paddingBottom: 32 }, eyebrow: { color: '#34d399', fontWeight: '900', fontSize: 11, letterSpacing: 2 }, title: { color: '#f8fafc', fontSize: 27, fontWeight: '900', marginTop: 4 }, segment: { flexDirection: 'row', gap: 8, marginTop: 16 }, chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: '#101c30' }, chipActive: { backgroundColor: '#27325b' }, chipText: { color: '#64748b', fontWeight: '800' }, chipTextActive: { color: '#fff' }, filters: { flexDirection: 'row', gap: 10, marginVertical: 14 }, fieldLabel: { color: '#64748b', fontSize: 10, marginBottom: 5 }, input: { color: '#e2e8f0', backgroundColor: '#101c30', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 11 }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, section: { color: '#f8fafc', fontSize: 18, fontWeight: '900', marginVertical: 14 }, dayCard: { backgroundColor: '#101c30', borderWidth: 1, borderColor: '#1e293b', borderRadius: 17, padding: 15, marginBottom: 11 }, dayHead: { flexDirection: 'row', justifyContent: 'space-between' }, dayDate: { color: '#f8fafc', fontWeight: '900', fontSize: 16 }, daySub: { color: '#64748b', marginTop: 4 }, chevron: { color: '#34d399', fontSize: 24 }, dayTotals: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#1e293b', marginTop: 12, paddingTop: 12 }, smallLabel: { color: '#64748b', fontSize: 9, textTransform: 'uppercase' }, smallValue: { color: '#cbd5e1', fontWeight: '800', marginTop: 4 }, bill: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 12, marginTop: 12 }, supplier: { color: '#e2e8f0', fontWeight: '800', maxWidth: 210 }, billMeta: { color: '#64748b', fontSize: 11, marginTop: 4 }, amount: { color: '#e2e8f0', fontWeight: '900' }, status: { color: '#34d399', fontSize: 10, marginTop: 4 }, pending: { color: '#fbbf24' }, error: { color: '#fecaca', backgroundColor: '#451a1a', padding: 10, borderRadius: 10, marginBottom: 10 } });
