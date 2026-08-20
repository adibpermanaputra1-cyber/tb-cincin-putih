import {
  User,
  Product,
  SaleTransaction,
  StockMovement,
  Supplier,
  PurchaseOrder,
  CustomerReceivable,
  SupplierPayable,
  Expense,
  StoreSettings,
  DashboardSummary,
  ProfitLossReport,
  CashFlowReport,
} from '../types';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/$/, '');

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    try {
      const errData = await res.json();
      if (errData.error) errMsg = errData.error;
    } catch {}
    throw new Error(errMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    fetchJSON<{ token: string; user: User; greeting: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Products
  getProducts: () => fetchJSON<Product[]>('/api/products'),
  createProduct: (product: Omit<Product, 'id' | 'updatedAt'>) =>
    fetchJSON<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),
  updateProduct: (id: string, updates: Partial<Product>) =>
    fetchJSON<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteProduct: (id: string) =>
    fetchJSON<{ message: string }>(`/api/products/${id}`, {
      method: 'DELETE',
    }),
  adjustStock: (data: {
    productId: string;
    quantityChange: number;
    type: 'PENYESUAIAN_PLUS' | 'PENYESUAIAN_MINUS' | 'BARANG_RUSAK' | 'RETUR';
    notes: string;
    createdBy: string;
  }) =>
    fetchJSON<Product>('/api/products/adjust-stock', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Stock Movements
  getStockMovements: () => fetchJSON<StockMovement[]>('/api/stock-movements'),

  // Sales
  getSales: () => fetchJSON<SaleTransaction[]>('/api/sales'),
  createSale: (saleData: Omit<SaleTransaction, 'id' | 'invoiceNo' | 'date'>) =>
    fetchJSON<SaleTransaction>('/api/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    }),

  // Receivables (Buku Piutang / Kasbon)
  getReceivables: () => fetchJSON<CustomerReceivable[]>('/api/receivables'),
  payReceivable: (
    id: string,
    data: { amount: number; paymentMethod: string; receivedBy: string; notes?: string }
  ) =>
    fetchJSON<CustomerReceivable>(`/api/receivables/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Suppliers
  getSuppliers: () => fetchJSON<Supplier[]>('/api/suppliers'),
  createSupplier: (supplier: Omit<Supplier, 'id'>) =>
    fetchJSON<Supplier>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    }),
  updateSupplier: (id: string, updates: Partial<Supplier>) =>
    fetchJSON<Supplier>(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteSupplier: (id: string) =>
    fetchJSON<{ message: string }>(`/api/suppliers/${id}`, {
      method: 'DELETE',
    }),

  // Purchases (Stok Masuk)
  getPurchases: () => fetchJSON<PurchaseOrder[]>('/api/purchases'),
  createPurchase: (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'date'>) =>
    fetchJSON<PurchaseOrder>('/api/purchases', {
      method: 'POST',
      body: JSON.stringify(poData),
    }),
  deletePurchase: (id: string) =>
    fetchJSON<{ message: string }>(`/api/purchases/${id}`, {
      method: 'DELETE',
    }),

  // Payables (Buku Utang Supplier)
  getPayables: () => fetchJSON<SupplierPayable[]>('/api/payables'),
  deletePayable: (id: string) =>
    fetchJSON<{ message: string }>(`/api/payables/${id}`, {
      method: 'DELETE',
    }),
  payPayable: (
    id: string,
    data: { amount: number; paymentMethod: string; paidBy: string; notes?: string }
  ) =>
    fetchJSON<SupplierPayable>(`/api/payables/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Expenses
  getExpenses: () => fetchJSON<Expense[]>('/api/expenses'),
  createExpense: (expense: Omit<Expense, 'id'>) =>
    fetchJSON<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    }),
  deleteExpense: (id: string) =>
    fetchJSON<{ message: string }>(`/api/expenses/${id}`, {
      method: 'DELETE',
    }),

  // Customers
  getCustomers: () =>
    fetchJSON<SaleTransaction[]>('/api/sales').then((sales) => {
      const map = new Map<string, { id: string; name: string; phone?: string; address?: string }>();
      // Pre-populate some contractor regulars
      map.set('cust_01', { id: 'cust_01', name: 'Pak Haji Rohim (Mandor)', phone: '0812-3344-5566', address: 'Proyek Ruko Blok B' });
      map.set('cust_02', { id: 'cust_02', name: 'CV Bangun Jaya Mandiri', phone: '0813-7788-9900', address: 'Perum Grand Harmoni' });
      map.set('cust_03', { id: 'cust_03', name: 'Pak Joko (Tukang)', phone: '0856-4433-2211', address: 'Jl. Merak No. 12' });
      sales.forEach((s) => {
        if (s.customerName && s.customerName !== 'Umum / Walk-in') {
          map.set(s.customerName, {
            id: `c_${s.customerName.replace(/\s+/g, '_')}`,
            name: s.customerName,
            phone: s.customerPhone,
            address: s.customerAddress,
          });
        }
      });
      return Array.from(map.values());
    }),

  // Reports
  getDashboardOverview: () => fetchJSON<any>('/api/reports/dashboard'),
  getDashboardSummary: () => fetchJSON<DashboardSummary>('/api/reports/dashboard'),
  getFinancialReports: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const [pnl, cf] = await Promise.all([
      fetchJSON<ProfitLossReport>(`/api/reports/profit-loss?${params.toString()}`),
      fetchJSON<CashFlowReport>(`/api/reports/cash-flow?${params.toString()}`),
    ]);
    return {
      profitAndLoss: {
        totalRevenue: pnl.grossSales || 0,
        cogs: pnl.costOfGoodsSold || 0,
        grossProfit: pnl.grossProfit || 0,
        totalExpenses: pnl.totalExpenses || 0,
        netProfit: pnl.netOperatingIncome || 0,
        expenseBreakdown: {
          salaries: pnl.expensesByCategory?.find((e) => e.category.includes('Gaji'))?.amount || 0,
          fuelAndTransport: pnl.expensesByCategory?.find((e) => e.category.includes('Bensin') || e.category.includes('Solar'))?.amount || 0,
          utilities: pnl.expensesByCategory?.find((e) => e.category.includes('Listrik'))?.amount || 0,
          rent: pnl.expensesByCategory?.find((e) => e.category.includes('Sewa'))?.amount || 0,
          consumption: pnl.expensesByCategory?.find((e) => e.category.includes('Konsumsi'))?.amount || 0,
          others: pnl.expensesByCategory?.find((e) => e.category.includes('Lainnya') || e.category.includes('Perawatan'))?.amount || 0,
        },
      },
      cashFlow: {
        cashInflow: {
          cashSales: cf.cashIn?.cashSales || 0,
          receivablesCollected: cf.cashIn?.receivableCollections || 0,
          total: cf.cashIn?.totalCashIn || 0,
        },
        cashOutflow: {
          cashPurchases: cf.cashOut?.cashPurchases || 0,
          payablesPaid: cf.cashOut?.payablePayments || 0,
          operatingExpenses: cf.cashOut?.operatingExpenses || 0,
          total: cf.cashOut?.totalCashOut || 0,
        },
        netCashFlow: cf.netCashFlow || 0,
      },
    };
  },
  getProfitLossReport: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return fetchJSON<ProfitLossReport>(`/api/reports/profit-loss?${params.toString()}`);
  },
  getCashFlowReport: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return fetchJSON<CashFlowReport>(`/api/reports/cash-flow?${params.toString()}`);
  },

  // Users
  getUsers: () => fetchJSON<User[]>('/api/users'),
  createUser: (user: Omit<User, 'id' | 'createdAt'>) =>
    fetchJSON<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),
  updateUser: (id: string, updates: Partial<User>) =>
    fetchJSON<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteUser: (id: string) =>
    fetchJSON<{ message: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    }),

  // Settings
  getSettings: () => fetchJSON<StoreSettings>('/api/settings'),
  updateSettings: (settings: Partial<StoreSettings>) =>
    fetchJSON<StoreSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // System (Backup, Restore & Reset)
  getBackup: () => fetchJSON<any>('/api/system/backup'),
  restoreBackup: (backupData: any) =>
    fetchJSON<{ message: string; data: any }>('/api/system/restore', {
      method: 'POST',
      body: JSON.stringify(backupData),
    }),
  resetDemo: () =>
    fetchJSON<{ message: string; data: any }>('/api/system/reset-demo', {
      method: 'POST',
    }),
  resetTransactions: (resetStockToZero: boolean = false) =>
    fetchJSON<{ message: string; data: any }>('/api/system/reset-transactions', {
      method: 'POST',
      body: JSON.stringify({ resetStockToZero }),
    }),
};
