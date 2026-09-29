import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { AnimatedAmount } from './AnimatedAmount';

export function StatCard({ label, value, color = '#34d399' }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 180, useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 0, duration: 500, useNativeDriver: false }),
    ]).start();
  }, [value, pulse]);
  const backgroundColor = pulse.interpolate({ inputRange: [0, 1], outputRange: ['#101c30', `${color}33`] });
  return <Animated.View style={[styles.card, { borderLeftColor: color, backgroundColor }]}><Text style={styles.label}>{label}</Text><AnimatedAmount value={value} color={color} /></Animated.View>;
}
const styles = StyleSheet.create({ card: { width: '48.5%', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#1e293b', borderLeftWidth: 4, marginBottom: 10 }, label: { color: '#94a3b8', fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 } });
