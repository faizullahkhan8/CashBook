function normalizeDashboard(summary = {}) {
  const openingCash = Number(summary.openingFloat ?? summary.openingCash ?? 0);
  const totalCash = Number(summary.cashInflow ?? summary.totalCash ?? 0);
  const totalCard = Number(summary.cardCollections ?? summary.totalCard ?? 0);
  const totalQr = Number(summary.qrCollections ?? summary.totalQr ?? 0);
  const totalOnline = totalCard + totalQr;
  const totalShortItems = Number(
    summary.totalShortItemsDeduction
      ?? ((summary.totalSpentOnShortItems || 0) + (summary.totalPendingShortItemsAmount || 0))
  );
  const netCash = openingCash + totalCash - totalShortItems;
  const grandTotal = netCash + totalOnline;

  return {
    openingCash,
    totalCash,
    totalCard,
    totalQr,
    totalOnline,
    totalShortItems,
    netCash,
    grandTotal,
    cashCount: Number(summary.cashCount || 0),
    cardCount: Number(summary.cardCount || 0),
    qrCount: Number(summary.qrCount || 0),
    totalCount: Number(summary.totalCount || 0),
    pendingShortItemsCount: Number(summary.pendingShortItemsCount || 0),
  };
}

module.exports = { normalizeDashboard };
