import React, { useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// `react-pro-sidebar` is web-only; require it at runtime inside the web branch
import { DashboardScreen } from './src/features/dashboard/DashboardScreen';
import { ClosingsScreen } from './src/features/closings/ClosingsScreen';
import { ClosingDetailsScreen } from './src/features/closings/ClosingDetailsScreen';
import { SupplierReportsScreen } from './src/features/suppliers/SupplierReportsScreen';
import { PastBillsScreen } from './src/features/suppliers/PastBillsScreen';
import DateReportScreen from './src/features/reports/DateReportScreen';

const menuSections = [
  {
    title: 'Cash Counter',
    items: [
      { label: 'Summary', screen: 'dashboard' },
      { label: 'Past Closing', screen: 'closings' },
      { label: 'Date Report', screen: 'date-report' },
    ],
  },
  {
    title: 'Supplier Bills',
    items: [
      { label: 'Summary', screen: 'suppliers' },
      { label: 'Past Bills', screen: 'past-bills' },
    ],
  },
];

export default function App() {
  const [screen, setScreen] = useState('dashboard');
  const [selectedClosing, setSelectedClosing] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    'Cash Counter': true,
    'Supplier Bills': true,
  });
  const screenW = Dimensions.get('window').width;
  const drawerAnim = useRef(new Animated.Value(0)).current; // 0 closed, 1 open

  const activeTitle = useMemo(() => {
    const section = menuSections.find((group) => group.items.some((item) => item.screen === screen));
    const item = section?.items.find((entry) => entry.screen === screen);
    return item ? `${section.title} · ${item.label}` : 'Cash Counter';
  }, [screen]);

  const openScreen = (nextScreen) => {
    setScreen(nextScreen);
    closeDrawer();
  };

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const openClosing = (closing) => {
    setSelectedClosing(closing);
    setScreen('closing-details');
    closeDrawer();
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };
  const closeDrawer = () => {
    Animated.timing(drawerAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setDrawerOpen(false));
  };

  if (Platform.OS === 'web') {
    const { Sidebar, Menu, MenuItem, SubMenu } = require('react-pro-sidebar');
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" />

        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>{activeTitle}</Text>
          <TouchableOpacity onPress={openDrawer} style={styles.menuButton} hitSlop={10}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        </View>

        {drawerOpen && <TouchableOpacity style={styles.webBackdrop} activeOpacity={1} onPress={() => closeDrawer()} />}

        <Sidebar
          rtl
          toggled={drawerOpen}
          breakPoint="md"
          width="280px"
          backgroundColor="#0d1729"
          collapsed={false}
          rootStyles={styles.webSidebar}
        >
          <Menu>
            {menuSections.map((section) => (
              <SubMenu
                key={section.title}
                label={section.title}
                defaultOpen={expandedSections[section.title]}
                rootStyles={styles.webSubMenu}
                onClick={() => toggleSection(section.title)}
              >
                {section.items.map((item) => (
                  <MenuItem key={`${section.title}-${item.label}`} active={screen === item.screen} onClick={() => openScreen(item.screen)} style={{ color: '#e2e8f0' }}>{item.label}</MenuItem>
                ))}
              </SubMenu>
            ))}
          </Menu>
        </Sidebar>

        {screen === 'dashboard' && <DashboardScreen />}
        {screen === 'closings' && <ClosingsScreen onOpen={openClosing} />}
        {screen === 'suppliers' && <SupplierReportsScreen />}
        {screen === 'past-bills' && <PastBillsScreen />}
        {screen === 'date-report' && <DateReportScreen />}
        {screen === 'closing-details' && <ClosingDetailsScreen closing={selectedClosing} onBack={() => setScreen('closings')} />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>{activeTitle}</Text>
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton} hitSlop={10}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      {screen === 'dashboard' && <DashboardScreen />}
      {screen === 'closings' && <ClosingsScreen onOpen={openClosing} />}
      {screen === 'suppliers' && <SupplierReportsScreen />}
      {screen === 'past-bills' && <PastBillsScreen />}
      {screen === 'date-report' && <DateReportScreen />}
      {screen === 'closing-details' && <ClosingDetailsScreen closing={selectedClosing} onBack={() => setScreen('closings')} />}

      {/* Native animated right-to-left drawer */}
      {drawerOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[styles.animatedBackdrop, { opacity: drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }) }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => closeDrawer()} />
          </Animated.View>

          <Animated.View
            style={[
              styles.animatedPanel,
              {
                transform: [
                  {
                    translateX: drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [screenW, 0] }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Main Menu</Text>
              <TouchableOpacity onPress={() => closeDrawer()} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              {menuSections.map((section) => (
                <View key={section.title} style={styles.sectionBlock}>
                  <TouchableOpacity onPress={() => toggleSection(section.title)} style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>{section.title}</Text>
                    <Text style={styles.chevron}>{expandedSections[section.title] ? '−' : '+'}</Text>
                  </TouchableOpacity>

                  {expandedSections[section.title] && section.items.map((item) => (
                    <TouchableOpacity
                      key={`${section.title}-${item.label}`}
                      onPress={() => openScreen(item.screen)}
                      style={[styles.drawerItem, screen === item.screen && styles.drawerItemActive]}
                    >
                      <Text style={[styles.drawerItemText, screen === item.screen && styles.drawerItemTextActive]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07101f' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#0d1729',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  topBarTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '800' },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#111f35',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  menuIcon: { color: '#fff', fontSize: 24, fontWeight: '700' },
  webBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    zIndex: 1,
  },
  webSidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    height: '100%',
    borderLeftWidth: 1,
    borderLeftColor: '#1e293b',
    boxShadow: '0 0 18px rgba(2, 6, 23, 0.55)',
  },
  webSubMenu: {
    backgroundColor: '#0d1729',
    color: '#f8fafc',
  },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.55)' },
  animatedBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    zIndex: 10,
  },
  animatedPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#0d1729',
    borderLeftWidth: 1,
    borderLeftColor: '#1e293b',
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 18,
    zIndex: 20,
  },
  drawerPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#0d1729',
    borderLeftWidth: 1,
    borderLeftColor: '#1e293b',
    padding: 18,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  drawerTitle: { color: '#f8fafc', fontSize: 22, fontWeight: '900' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#111f35', alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sectionBlock: { marginBottom: 18 },
  sectionLabel: { color: '#34d399', fontSize: 12, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  chevron: { color: '#34d399', fontSize: 24, fontWeight: '700' },
  drawerItem: {
    backgroundColor: '#111f35',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  drawerItemActive: { backgroundColor: '#173a35', borderColor: '#22c55e' },
  drawerItemText: { color: '#dbe7f5', fontWeight: '700' },
  drawerItemTextActive: { color: '#d8fff4' },
});
