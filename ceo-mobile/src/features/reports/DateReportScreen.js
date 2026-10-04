import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export function DateReportScreen() {
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [data, setData] = React.useState([]);

  // Placeholder: real app should fetch from server or shared store
  const loadSample = () => {
    const sample = [
      { posting_date: '2026-10-03', supplier_name: 'ABC Traders', total: 1200 },
      { posting_date: '2026-10-03', supplier_name: 'XYZ Supplies', total: 2300 },
      { posting_date: '2026-10-02', supplier_name: 'LMN Co', total: 500 },
    ];
    setData(sample);
  };

  const groups = data.reduce((acc, it) => {
    const key = it.posting_date || 'Unknown';
    if (!acc[key]) acc[key] = { date: key, items: [], total: 0 };
    acc[key].items.push(it);
    acc[key].total += Number(it.total || it.total_bill_amount || it.total);
    return acc;
  }, {});

  const sorted = Object.values(groups).sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Date-wise Report</Text>

      <View style={styles.controls}>
        <View style={styles.field}>
          <Text style={styles.label}>From</Text>
          <TextInput style={styles.input} value={from} placeholder="YYYY-MM-DD" onChangeText={setFrom} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>To</Text>
          <TextInput style={styles.input} value={to} placeholder="YYYY-MM-DD" onChangeText={setTo} />
        </View>

        <TouchableOpacity style={styles.button} onPress={loadSample}>
          <Text style={styles.buttonText}>Load</Text>
        </TouchableOpacity>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No report data. Use Load to demo or wire fetch logic.</Text>
        </View>
      ) : (
        sorted.map((g) => (
          <View key={g.date} style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupDate}>{g.date}</Text>
              <Text style={styles.groupTotal}>Total Rs {money(g.total)}</Text>
            </View>

            {g.items.map((it, i) => (
              <View key={`${g.date}-${i}`} style={styles.row}>
                <Text style={styles.rowLeft}>{it.supplier_name || '—'}</Text>
                <Text style={styles.rowRight}>Rs {money(it.total)}</Text>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07101f' },
  container: { padding: 18 },
  title: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  field: { flex: 1 },
  label: { color: '#9ca3af', fontSize: 12, marginBottom: 6 },
  input: { backgroundColor: '#0d1729', color: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' },
  button: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#173a35', borderRadius: 10, marginLeft: 8 },
  buttonText: { color: '#d8fff4', fontWeight: '800' },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#9ca3af' },
  group: { marginBottom: 18, backgroundColor: '#0b1220', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b' },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  groupDate: { color: '#34d399', fontWeight: '900' },
  groupTotal: { color: '#e2e8f0', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#0f1721' },
  rowLeft: { color: '#e2e8f0' },
  rowRight: { color: '#e2e8f0', fontWeight: '700' },
});

export default DateReportScreen;
