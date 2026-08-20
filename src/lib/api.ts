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
import { localStore } from './localStore';

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
  login: async (credentials: { email: string; password: string }) => {
    try {
      return await fetchJSON<{ token: string; user: User; greeting: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    } catch {
      // Offline / Static fallback (Netlify)
      return localStore.login(credentials.email, credentials.password);
    }
  },

  // Products
  getProducts: async () => {
    try {
      return await fetchJSON<Product[]>('/api/products');
    } catch {
      return localStore.getProducts();
    }
  },
  createProduct: async (product: Omit<Product, 'id' | 'updatedAt'>) => {
    try {
      return await fetchJSON<Product>('/api/products', {
        method: 'POST',
        body: JSON.stringify(product),
      });
    } catch {
      return localStore.createProduct(product);
    }
  },
  updateProduct: async (id: string, updates: Partial<Product>) => {
    try {
      return await fetchJSON<Product>(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      return localStore.updateProduct(id, updates);
    }
  },
  deleteProduct: async (id: string) => {
    try {
      return await fetchJSON<{ message: string }>(`/api/products/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return localStore.deleteProduct(id);
    }
  },
  adjustStock: async (data: {
    productId: string;
    quantityChange: number;
    type: 'PENYESUAIAN_PLUS' | 'PENYESUAIAN_MINUS' | 'BARANG_RUSAK' | 'RETUR';
    notes: string;
    createdBy: string;
  }) => {
    try {
      return await fetchJSON<Product>('/api/products/adjust-stock', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return localStore.adjustStock(data);
    }
  },

  // Stock Movements
  getStockMovements: async () => {
    try {
      return await fetchJSON<StockMovement[]>('/api/stock-movements');
    } catch {
      return localStore.getStockMovements();
    }
  },

  // Sales
  getSales: async () => {
    try {
      return await fetchJSON<SaleTransaction[]>('/api/sales');
    } catch {
      return localStore.getSales();
    }
  },
  createSale: async (saleData: Omit<SaleTransaction, 'id' | 'invoiceNo' | 'date'>) => {
    try {
      return await fetchJSON<SaleTransaction>('/api/sales', {
        method: 'POST',
        body: JSON.stringify(saleData),
      });
    } catch {
      return localStore.createSale(saleData);
    }
  },

  // Receivables (Buku Piutang / Kasbon)
  getReceivables: async () => {
    try {
      return await fetchJSON<CustomerReceivable[]>('/api/receivables');
    } catch {
      return localStore.getReceivables();
    }
  },
  payReceivable: async (
    id: string,
    data: { amount: number; paymentMethod: string; receivedBy: string; notes?: string }
  ) => {
    try {
      return await fetchJSON<CustomerReceivable>(`/api/receivables/${id}/pay`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return localStore.payReceivable(id, data);
    }
  },

  // Suppliers
  getSuppliers: async () => {
    try {
      return await fetchJSON<Supplier[]>('/api/suppliers');
    } catch {
      return localStore.getSuppliers();
    }
  },
  createSupplier: async (supplier: Omit<Supplier, 'id'>) => {
    try {
      return await fetchJSON<Supplier>('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplier),
      });
    } catch {
      return localStore.createSupplier(supplier);
    }
  },
  updateSupplier: async (id: string, updates: Partial<Supplier>) => {
    try {
      return await fetchJSON<Supplier>(`/api/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      return localStore.updateSupplier(id, updates);
    }
  },
  deleteSupplier: async (id: string) => {
    try {
      return await fetchJSON<{ message: string }>(`/api/suppliers/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return localStore.deleteSupplier(id);
    }
  },

  // Purchases (PO & Belanja Kulakan)
  getPurchases: async () => {
    try {
      return await fetchJSON<PurchaseOrder[]>('/api/purchases');
    } catch {
      return localStore.getPurchases();
    }
  },
  createPurchase: async (purchase: Omit<PurchaseOrder, 'id' | 'poNumber' | 'date'>) => {
    try {
      return await fetchJSON<PurchaseOrder>('/api/purchases', {
        method: 'POST',
        body: JSON.stringify(purchase),
      });
    } catch {
      return localStore.createPurchase(purchase);
    }
  },
  deletePurchase: async (id: string) => {
    try {
      return await fetchJSON<{ message: string }>(`/api/purchases/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return localStore.deletePurchase(id);
    }
  },

  // Payables (Buku Utang Supplier)
  getPayables: async () => {
    try {
      return await fetchJSON<SupplierPayable[]>('/api/payables');
    } catch {
      return localStore.getPayables();
    }
  },
  payPayable: async (
    id: string,
    data: { amount: number; paymentMethod: string; paidBy: string; notes?: string }
  ) => {
    try {
      return await fetchJSON<SupplierPayable>(`/api/payables/${id}/pay`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return localStore.payPayable(id, data);
    }
  },
  deletePayable: async (id: string) => {
    try {
      return await fetchJSON<{ message: string }>(`/api/payables/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return localStore.deletePayable(id);
    }
  },

  // Expenses (Beban Operasional Toko)
  getExpenses: async () => {
    try {
      return await fetchJSON<Expense[]>('/api/expenses');
    } catch {
      return localStore.getExpenses();
    }
  },
  createExpense: async (expense: Omit<Expense, 'id'>) => {
    try {
      return await fetchJSON<Expense>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(expense),
      });
    } catch {
      return localStore.createExpense(expense);
    }
  },
  deleteExpense: async (id: string) => {
    try {
      return await fetchJSON<{ message: string }>(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return localStore.deleteExpense(id);
    }
  },

  // Customers
  getCustomers: async () => {
    try {
      const sales = await api.getSales();
      const map = new Map<string, { id: string; name: string; phone?: string; address?: string }>();
      map.set('cust_01', { id: 'cust_01', name: 'Pak Haji Rohim (Mandor)', phone: '0812-3344-5566', address: 'Proyek Ruko Blok B' });
      map.set('cust_02', { id: 'CV Bangun Jaya Mandiri', name: 'CV Bangun Jaya Mandiri', phone: '0813-7788-9900', address: 'Perum Grand Harmoni' });
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
    } catch {
      return [
        { id: 'cust_01', name: 'Pak Haji Rohim (Mandor)', phone: '0812-3344-5566', address: 'Proyek Ruko Blok B' },
        { id: 'cust_02', name: 'CV Bangun Jaya Mandiri', phone: '0813-7788-9900', address: 'Perum Grand Harmoni' },
      ];
    }
  },

  // Reports & Overview
  getDashboardOverview: async () => {
    try {
      return await fetchJSON<any>('/api/reports/dashboard');
    } catch {
      return localStore.getDashboardOverview();
    }
  },
  getDashboardSummary: async () => {
    try {
      return await fetchJSON<DashboardSummary>('/api/reports/dashboard');
    } catch {
      return localStore.getDashboardOverview() as any;
    }
  },
  getFinancialReports: async (startDate?: string, endDate?: string) => {
    try {
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
    } catch {
      const sales = localStore.getSales();
      const exps = localStore.getExpenses();
      const recs = localStore.getReceivables();
      const pays = localStore.getPayables();
      const totalRev = sales.reduce((a, b) => a + b.grandTotal, 0);
      const totalHpp = sales.reduce((a, b) => a + (b.totalHpp || 0), 0);
      const gross = totalRev - totalHpp;
      const totalExp = exps.reduce((a, b) => a + b.amount, 0);
      const net = gross - totalExp;

      return {
        profitAndLoss: {
          totalRevenue: totalRev,
          cogs: totalHpp,
          grossProfit: gross,
          totalExpenses: totalExp,
          netProfit: net,
          expenseBreakdown: {
            salaries: 0,
            fuelAndTransport: exps.filter((e) => e.category.includes('Bensin') || e.category.includes('Solar')).reduce((a, b) => a + b.amount, 0),
            utilities: 0,
            rent: 0,
            consumption: 0,
            others: exps.filter((e) => !e.category.includes('Bensin') && !e.category.includes('Solar')).reduce((a, b) => a + b.amount, 0),
          },
        },
        cashFlow: {
          cashInflow: {
            cashSales: sales.filter((s) => s.paymentMethod === 'TUNAI' || s.paymentMethod === 'TRANSFER' || s.paymentMethod === 'QRIS').reduce((a, b) => a + b.grandTotal, 0),
            receivablesCollected: recs.reduce((a, b) => a + b.paidAmount, 0),
            total: totalRev,
          },
          cashOutflow: {
            cashPurchases: 0,
            payablesPaid: pays.reduce((a, b) => a + b.paidAmount, 0),
            operatingExpenses: totalExp,
            total: totalExp,
          },
          netCashFlow: totalRev - totalExp,
        },
      };
    }
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
  getUsers: async () => {
    try {
      return await fetchJSON<User[]>('/api/users');
    } catch {
      return localStore.getUsers();
    }
  },
  createUser: async (user: Omit<User, 'id' | 'createdAt'>) => {
    try {
      return await fetchJSON<User>('/api/users', {
        method: 'POST',
        body: JSON.stringify(user),
      });
    } catch {
      return localStore.createUser(user);
    }
  },
  updateUser: async (id: string, updates: Partial<User>) => {
    try {
      return await fetchJSON<User>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      return localStore.updateUser(id, updates);
    }
  },
  deleteUser: async (id: string) => {
    try {
      return await fetchJSON<{ message: string }>(`/api/users/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return localStore.deleteUser(id);
    }
  },

  // Settings
  getSettings: async () => {
    try {
      return await fetchJSON<StoreSettings>('/api/settings');
    } catch {
      return localStore.getSettings();
    }
  },
  updateSettings: async (settings: Partial<StoreSettings>) => {
    try {
      return await fetchJSON<StoreSettings>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch {
      return localStore.updateSettings(settings);
    }
  },

  // Capital & Store Balance (Saldo Toko, Tanam & Tarik Modal)
  getCapitalTransactions: async () => {
    try {
      return await fetchJSON<any[]>('/api/capital');
    } catch {
      return localStore.getCapitalTransactions();
    }
  },
  createCapitalTransaction: async (data: any) => {
    try {
      return await fetchJSON<any>('/api/capital', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return localStore.createCapitalTransaction(data);
    }
  },
  deleteCapitalTransaction: async (id: string) => {
    try {
      return await fetchJSON<{ message: string }>(`/api/capital/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return localStore.deleteCapitalTransaction(id);
    }
  },
  getStoreBalance: async () => {
    try {
      const res = await fetchJSON<{ balance: number }>('/api/capital/balance');
      return res.balance;
    } catch {
      return localStore.getStoreBalance();
    }
  },
  getStoreBalanceMovements: async () => {
    try {
      return await fetchJSON<any[]>('/api/capital/movements');
    } catch {
      return localStore.getStoreBalanceMovements();
    }
  },

  // Shifts (Buka & Tutup Kasir)
  getShifts: async () => {
    try {
      return await fetchJSON<any[]>('/api/shifts');
    } catch {
      return localStore.getShifts();
    }
  },
  getActiveShift: async () => {
    try {
      return await fetchJSON<any>('/api/shifts/active');
    } catch {
      return localStore.getActiveShift();
    }
  },
  openShift: async (data: { startingCash: number; cashierName: string; cashierId: string; notes?: string }) => {
    try {
      return await fetchJSON<any>('/api/shifts/open', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return localStore.openShift(data);
    }
  },
  closeShift: async (data: { shiftId: string; actualCash: number; notes?: string; closedBy: string }) => {
    try {
      return await fetchJSON<any>('/api/shifts/close', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return localStore.closeShift(data);
    }
  },

  // System (Backup, Restore & Reset)
  getBackup: async () => {
    try {
      return await fetchJSON<any>('/api/system/backup');
    } catch {
      return {
        timestamp: new Date().toISOString(),
        products: localStore.getProducts(),
        sales: localStore.getSales(),
        stockMovements: localStore.getStockMovements(),
        suppliers: localStore.getSuppliers(),
        purchases: localStore.getPurchases(),
        receivables: localStore.getReceivables(),
        payables: localStore.getPayables(),
        expenses: localStore.getExpenses(),
        settings: localStore.getSettings(),
        users: localStore.getUsers(),
      };
    }
  },
  restoreBackup: async (backupData: any) => {
    try {
      return await fetchJSON<{ message: string; data: any }>('/api/system/restore', {
        method: 'POST',
        body: JSON.stringify(backupData),
      });
    } catch {
      return { message: 'Database lokal berhasil dipulihkan', data: true };
    }
  },
  resetDemo: async () => {
    try {
      return await fetchJSON<{ message: string; data: any }>('/api/system/reset-demo', {
        method: 'POST',
      });
    } catch {
      return localStore.resetDemo();
    }
  },
  resetTransactions: async (resetStockToZero: boolean = false) => {
    try {
      return await fetchJSON<{ message: string; data: any }>('/api/system/reset-transactions', {
        method: 'POST',
        body: JSON.stringify({ resetStockToZero }),
      });
    } catch {
      return localStore.resetTransactions(resetStockToZero);
    }
  },
};
