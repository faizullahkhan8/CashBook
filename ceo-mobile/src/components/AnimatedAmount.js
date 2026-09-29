import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text } from 'react-native';

export function AnimatedAmount({ value, color = '#f8fafc' }) {
  const previous = useRef(Number(value || 0));
  const animated = useRef(new Animated.Value(previous.current)).current;
  const [display, setDisplay] = useState(previous.current);

  useEffect(() => {
    const listener = animated.addListener(({ value: next }) => setDisplay(next));
    Animated.spring(animated, { toValue: Number(value || 0), useNativeDriver: false, damping: 18, stiffness: 90 }).start();
    previous.current = Number(value || 0);
    return () => animated.removeListener(listener);
  }, [value, animated]);

  return <Text style={{ color, fontSize: 22, fontWeight: '900' }}>PKR {display.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>;
}
