export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://cashbook-e9h7.onrender.com',
  pharmacyId: process.env.EXPO_PUBLIC_PHARMACY_ID || 'zada-pharmacy',
  branchId: process.env.EXPO_PUBLIC_BRANCH_ID || 'main',
  features: { authentication: false, liveDashboard: true, closingHistory: true },
};

export const scopedQuery = `pharmacyId=${encodeURIComponent(config.pharmacyId)}&branchId=${encodeURIComponent(config.branchId)}`;
