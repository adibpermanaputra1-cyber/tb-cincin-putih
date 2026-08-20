// Complete Client-Side LocalStorage Store with automatic initial seed fallback
// This ensures that when deployed to static hosts like Netlify / GitHub Pages / Vercel (where no Express backend runs),
// all POS, inventory, sales, purchases, kasbon, expenses, and settings operations work 100% smoothly without 404 errors.

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
} from '../types';

import {
  INITIAL_CLIENT_SETTINGS,
  INITIAL_CLIENT_USERS,
  INITIAL_CLIENT_PRODUCTS,
  INITIAL_CLIENT_SUPPLIERS,
  INITIAL_CLIENT_TRANSACTIONS,
  INITIAL_CLIENT_RECEIVABLES,
  INITIAL_CLIENT_EXPENSES,
  INITIAL_CLIENT_PAYABLES,
  INITIAL_CLIENT_PURCHASES,
  INITIAL_CLIENT_STOCK_MOVEMENTS,
} from './mockSeed';

const STORAGE_KEYS = {
  USERS: 'tb_users_store',
  PRODUCTS: 'tb_products_store',
  SALES: 'tb_sales_store',
  STOCK_MOVEMENTS: 'tb_stock_movements_store',
  SUPPLIERS: 'tb_suppliers_store',
  PURCHASES: 'tb_purchases_store',
  RECEIVABLES: 'tb_receivables_store',
  PAYABLES: 'tb_payables_store',
  EXPENSES: 'tb_expenses_store',
  SETTINGS: 'tb_settings_store',
};

function getStorage<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as T;
  } catch {
    return initial;
  }
}

function setStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving to localStorage [${key}]:`, err);
  }
}

export const localStore = {
  // --- AUTH ---
  login: (email: string, pass: string): { token: string; user: User; greeting: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (cleanEmail === 'owner@toko.com' && (cleanPass === 'owner123' || cleanPass === 'admin123' || cleanPass === '1234')) {
      const user = INITIAL_CLIENT_USERS[0];
      return {
        token: `jwt_owner_${Date.now()}`,
        user,
        greeting: 'Selamat datang kembali, Pak Ahmad & Buk Maesaroh! Berikut ringkasan penjualan, kas, dan stok TB. Cincin Putih hari ini.',
      };
    }

    if ((cleanEmail === 'risma@toko.com' || cleanEmail === 'kasir@toko.com') && (cleanPass === 'kasir123' || cleanPass === 'risma123' || cleanPass === '1234')) {
      const user = INITIAL_CLIENT_USERS[1];
      return {
        token: `jwt_risma_${Date.now()}`,
        user,
        greeting: 'Selamat bertugas, Risma! Siap melayani penjualan kasir TB. Cincin Putih hari ini?',
      };
    }

    if (cleanEmail === 'ririn@toko.com' && (cleanPass === 'kasir123' || cleanPass === 'ririn123' || cleanPass === '1234')) {
      const user = INITIAL_CLIENT_USERS[2];
      return {
        token: `jwt_ririn_${Date.now()}`,
        user,
        greeting: 'Selamat bertugas, Ririn! Siap melayani penjualan kasir TB. Cincin Putih hari ini?',
      };
    }

    const users = getStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_CLIENT_USERS);
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing && cleanPass.length >= 4) {
      return {
        token: `jwt_custom_${Date.now()}`,
        user: existing,
        greeting: existing.role === 'OWNER'
          ? `Selamat datang kembali, ${existing.name}!`
          : `Selamat bertugas, ${existing.name}!`,
      };
    }

    throw new Error('Email atau password salah. Silakan periksa kembali akun Anda.');
  },

  // --- PRODUCTS ---
  getProducts: (): Product[] => {
    return getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_CLIENT_PRODUCTS);
  },
  createProduct: (product: Omit<Product, 'id' | 'updatedAt'>): Product => {
    const prods = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_CLIENT_PRODUCTS);
    const newProd: Product = {
      ...product,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      updatedAt: new Date().toISOString(),
    };
    prods.unshift(newProd);
    setStorage(STORAGE_KEYS.PRODUCTS, prods);
    return newProd;
  },
  updateProduct: (id: string, updates: Partial<Product>): Product => {
    const prods = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_CLIENT_PRODUCTS);
    const idx = prods.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Produk tidak ditemukan');
    prods[idx] = { ...prods[idx], ...updates, updatedAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.PRODUCTS, prods);
    return prods[idx];
  },
  deleteProduct: (id: string): { message: string } => {
    let prods = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_CLIENT_PRODUCTS);
    prods = prods.filter((p) => p.id !== id);
    setStorage(STORAGE_KEYS.PRODUCTS, prods);
    return { message: 'Produk berhasil dihapus' };
  },
  adjustStock: (data: {
    productId: string;
    quantityChange: number;
    type: 'PENYESUAIAN_PLUS' | 'PENYESUAIAN_MINUS' | 'BARANG_RUSAK' | 'RETUR';
    notes: string;
    createdBy: string;
  }): Product => {
    const prods = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_CLIENT_PRODUCTS);
    const prod = prods.find((p) => p.id === data.productId);
    if (!prod) throw new Error('Produk tidak ditemukan');

    const initial = prod.stock;
    const finalSt = Math.max(0, prod.stock + data.quantityChange);
    prod.stock = finalSt;
    prod.updatedAt = new Date().toISOString();
    setStorage(STORAGE_KEYS.PRODUCTS, prods);

    const movements = getStorage<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_CLIENT_STOCK_MOVEMENTS);
    movements.unshift({
      id: `sm_${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      date: new Date().toISOString(),
      type: data.type,
      quantityChange: data.quantityChange,
      previousStock: initial,
      resultingStock: finalSt,
      unitName: prod.baseUnit,
      notes: data.notes,
      createdBy: data.createdBy,
    });
    setStorage(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

    return prod;
  },

  // --- STOCK MOVEMENTS ---
  getStockMovements: (): StockMovement[] => {
    return getStorage<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_CLIENT_STOCK_MOVEMENTS);
  },

  // --- SALES ---
  getSales: (): SaleTransaction[] => {
    return getStorage<SaleTransaction[]>(STORAGE_KEYS.SALES, INITIAL_CLIENT_TRANSACTIONS);
  },
  createSale: (saleData: Omit<SaleTransaction, 'id' | 'invoiceNo' | 'date'>): SaleTransaction => {
    const sales = getStorage<SaleTransaction[]>(STORAGE_KEYS.SALES, INITIAL_CLIENT_TRANSACTIONS);
    const dateStr = new Date().toISOString();
    const invoiceNo = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(sales.length + 1).padStart(4, '0')}`;

    const newSale: SaleTransaction = {
      ...saleData,
      id: `sale_${Date.now()}`,
      invoiceNo,
      date: dateStr,
    };
    sales.unshift(newSale);
    setStorage(STORAGE_KEYS.SALES, sales);

    // Deduct stock & create stock movements
    const prods = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_CLIENT_PRODUCTS);
    const movements = getStorage<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_CLIENT_STOCK_MOVEMENTS);

    newSale.items.forEach((item) => {
      const prod = prods.find((p) => p.id === item.productId);
      if (prod) {
        const initial = prod.stock;
        const deduct = item.baseQuantity || item.quantity * (item.multiplier || 1);
        prod.stock = Math.max(0, prod.stock - deduct);
        prod.updatedAt = dateStr;

        movements.unshift({
          id: `sm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          date: dateStr,
          type: 'PENJUALAN',
          quantityChange: -deduct,
          previousStock: initial,
          resultingStock: prod.stock,
          unitName: prod.baseUnit,
          referenceNo: invoiceNo,
          notes: `Penjualan Kasir POS (${newSale.customerName})`,
          createdBy: newSale.cashierName,
        });
      }
    });

    setStorage(STORAGE_KEYS.PRODUCTS, prods);
    setStorage(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

    // Handle Kasbon / Receivables
    if (newSale.paymentMethod === 'KASBON' && newSale.remainingAmount > 0) {
      const recs = getStorage<CustomerReceivable[]>(STORAGE_KEYS.RECEIVABLES, INITIAL_CLIENT_RECEIVABLES);
      recs.unshift({
        id: `rec_${Date.now()}`,
        invoiceId: newSale.id,
        invoiceNo: newSale.invoiceNo,
        customerName: newSale.customerName,
        customerPhone: newSale.customerPhone,
        customerAddress: newSale.customerAddress,
        transactionDate: dateStr,
        totalAmount: newSale.grandTotal,
        paidAmount: newSale.paidAmount || 0,
        remainingAmount: newSale.remainingAmount,
        dueDate: newSale.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: newSale.paidAmount > 0 ? 'SEBAGIAN' : 'BELUM_LUNAS',
        payments: newSale.paidAmount > 0 ? [
          {
            id: `pay_${Date.now()}`,
            amount: newSale.paidAmount,
            date: dateStr,
            paymentMethod: 'TUNAI',
            receivedBy: newSale.cashierName,
            notes: 'Uang Muka / DP Awal',
          },
        ] : [],
      });
      setStorage(STORAGE_KEYS.RECEIVABLES, recs);
    }

    return newSale;
  },

  // --- RECEIVABLES ---
  getReceivables: (): CustomerReceivable[] => {
    return getStorage<CustomerReceivable[]>(STORAGE_KEYS.RECEIVABLES, INITIAL_CLIENT_RECEIVABLES);
  },
  payReceivable: (
    id: string,
    data: { amount: number; paymentMethod: string; receivedBy: string; notes?: string }
  ): CustomerReceivable => {
    const recs = getStorage<CustomerReceivable[]>(STORAGE_KEYS.RECEIVABLES, INITIAL_CLIENT_RECEIVABLES);
    const rec = recs.find((r) => r.id === id);
    if (!rec) throw new Error('Data piutang tidak ditemukan');

    const paymentAmount = Math.min(data.amount, rec.remainingAmount);
    rec.paidAmount += paymentAmount;
    rec.remainingAmount = Math.max(0, rec.totalAmount - rec.paidAmount);
    rec.status = rec.remainingAmount === 0 ? 'LUNAS' : 'SEBAGIAN';

    const pMethod = (data.paymentMethod === 'TRANSFER' ? 'TRANSFER' : data.paymentMethod === 'QRIS' ? 'QRIS' : 'TUNAI') as 'TUNAI' | 'TRANSFER' | 'QRIS';

    rec.payments.unshift({
      id: `pay_${Date.now()}`,
      amount: paymentAmount,
      date: new Date().toISOString(),
      paymentMethod: pMethod,
      receivedBy: data.receivedBy,
      notes: data.notes,
    });

    setStorage(STORAGE_KEYS.RECEIVABLES, recs);
    return rec;
  },

  // --- SUPPLIERS ---
  getSuppliers: (): Supplier[] => {
    return getStorage<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_CLIENT_SUPPLIERS);
  },
  createSupplier: (supplier: Omit<Supplier, 'id'>): Supplier => {
    const sups = getStorage<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_CLIENT_SUPPLIERS);
    const newSup: Supplier = { ...supplier, id: `sup_${Date.now()}` };
    sups.unshift(newSup);
    setStorage(STORAGE_KEYS.SUPPLIERS, sups);
    return newSup;
  },
  updateSupplier: (id: string, updates: Partial<Supplier>): Supplier => {
    const sups = getStorage<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_CLIENT_SUPPLIERS);
    const idx = sups.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Supplier tidak ditemukan');
    sups[idx] = { ...sups[idx], ...updates };
    setStorage(STORAGE_KEYS.SUPPLIERS, sups);
    return sups[idx];
  },
  deleteSupplier: (id: string): { message: string } => {
    let sups = getStorage<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_CLIENT_SUPPLIERS);
    sups = sups.filter((s) => s.id !== id);
    setStorage(STORAGE_KEYS.SUPPLIERS, sups);
    return { message: 'Supplier berhasil dihapus' };
  },

  // --- PURCHASES ---
  getPurchases: (): PurchaseOrder[] => {
    return getStorage<PurchaseOrder[]>(STORAGE_KEYS.PURCHASES, INITIAL_CLIENT_PURCHASES);
  },
  createPurchase: (purchase: Omit<PurchaseOrder, 'id' | 'poNumber' | 'date'>): PurchaseOrder => {
    const purchs = getStorage<PurchaseOrder[]>(STORAGE_KEYS.PURCHASES, INITIAL_CLIENT_PURCHASES);
    const dateStr = new Date().toISOString();
    const poNumber = `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(purchs.length + 1).padStart(3, '0')}`;

    const newPO: PurchaseOrder = {
      ...purchase,
      id: `po_${Date.now()}`,
      poNumber,
      date: dateStr,
    };
    purchs.unshift(newPO);
    setStorage(STORAGE_KEYS.PURCHASES, purchs);

    // Increase product stock
    const prods = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_CLIENT_PRODUCTS);
    const movements = getStorage<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_CLIENT_STOCK_MOVEMENTS);

    newPO.items.forEach((item) => {
      const prod = prods.find((p) => p.id === item.productId);
      if (prod) {
        const initial = prod.stock;
        prod.stock += item.quantity;
        prod.updatedAt = dateStr;

        movements.unshift({
          id: `sm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          date: dateStr,
          type: 'PEMBELIAN',
          quantityChange: item.quantity,
          previousStock: initial,
          resultingStock: prod.stock,
          unitName: prod.baseUnit,
          referenceNo: poNumber,
          notes: `Penerimaan Barang Supplier (${newPO.supplierName})`,
          createdBy: newPO.receivedBy,
        });
      }
    });

    setStorage(STORAGE_KEYS.PRODUCTS, prods);
    setStorage(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

    // Handle Payables if Tempo
    if (newPO.paymentMethod === 'TEMPO') {
      const pays = getStorage<SupplierPayable[]>(STORAGE_KEYS.PAYABLES, INITIAL_CLIENT_PAYABLES);
      pays.unshift({
        id: `pay_sup_${Date.now()}`,
        poId: newPO.id,
        poNumber: newPO.poNumber,
        supplierId: newPO.supplierId,
        supplierName: newPO.supplierName,
        transactionDate: dateStr,
        totalAmount: newPO.totalAmount,
        paidAmount: 0,
        remainingAmount: newPO.totalAmount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'BELUM_LUNAS',
        payments: [],
      });
      setStorage(STORAGE_KEYS.PAYABLES, pays);
    }

    return newPO;
  },
  deletePurchase: (id: string): { message: string } => {
    let purchs = getStorage<PurchaseOrder[]>(STORAGE_KEYS.PURCHASES, INITIAL_CLIENT_PURCHASES);
    purchs = purchs.filter((p) => p.id !== id);
    setStorage(STORAGE_KEYS.PURCHASES, purchs);
    return { message: 'Purchase order berhasil dihapus' };
  },

  // --- PAYABLES ---
  getPayables: (): SupplierPayable[] => {
    return getStorage<SupplierPayable[]>(STORAGE_KEYS.PAYABLES, INITIAL_CLIENT_PAYABLES);
  },
  payPayable: (
    id: string,
    data: { amount: number; paymentMethod: string; paidBy: string; notes?: string }
  ): SupplierPayable => {
    const pays = getStorage<SupplierPayable[]>(STORAGE_KEYS.PAYABLES, INITIAL_CLIENT_PAYABLES);
    const pay = pays.find((p) => p.id === id);
    if (!pay) throw new Error('Data utang supplier tidak ditemukan');

    const paymentAmount = Math.min(data.amount, pay.remainingAmount);
    pay.paidAmount += paymentAmount;
    pay.remainingAmount = Math.max(0, pay.totalAmount - pay.paidAmount);
    pay.status = pay.remainingAmount === 0 ? 'LUNAS' : 'SEBAGIAN';

    const pMethod = (data.paymentMethod === 'TRANSFER' ? 'TRANSFER' : 'TUNAI') as 'TUNAI' | 'TRANSFER';

    pay.payments.unshift({
      id: `pay_s_${Date.now()}`,
      amount: paymentAmount,
      date: new Date().toISOString(),
      paymentMethod: pMethod,
      paidBy: data.paidBy,
      notes: data.notes,
    });

    setStorage(STORAGE_KEYS.PAYABLES, pays);
    return pay;
  },
  deletePayable: (id: string): { message: string } => {
    let pays = getStorage<SupplierPayable[]>(STORAGE_KEYS.PAYABLES, INITIAL_CLIENT_PAYABLES);
    pays = pays.filter((p) => p.id !== id);
    setStorage(STORAGE_KEYS.PAYABLES, pays);
    return { message: 'Data utang berhasil dihapus' };
  },

  // --- EXPENSES ---
  getExpenses: (): Expense[] => {
    return getStorage<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_CLIENT_EXPENSES);
  },
  createExpense: (expense: Omit<Expense, 'id'>): Expense => {
    const exps = getStorage<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_CLIENT_EXPENSES);
    const newExp: Expense = { ...expense, id: `exp_${Date.now()}` };
    exps.unshift(newExp);
    setStorage(STORAGE_KEYS.EXPENSES, exps);
    return newExp;
  },
  deleteExpense: (id: string): { message: string } => {
    let exps = getStorage<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_CLIENT_EXPENSES);
    exps = exps.filter((e) => e.id !== id);
    setStorage(STORAGE_KEYS.EXPENSES, exps);
    return { message: 'Beban operasional berhasil dihapus' };
  },

  // --- SETTINGS ---
  getSettings: (): StoreSettings => {
    return getStorage<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_CLIENT_SETTINGS);
  },
  updateSettings: (settings: Partial<StoreSettings>): StoreSettings => {
    const current = getStorage<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_CLIENT_SETTINGS);
    const updated = { ...current, ...settings };
    setStorage(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  // --- USERS ---
  getUsers: (): User[] => {
    return getStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_CLIENT_USERS);
  },
  createUser: (user: Omit<User, 'id' | 'createdAt'>): User => {
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_CLIENT_USERS);
    const newUser: User = { ...user, id: `usr_${Date.now()}`, createdAt: new Date().toISOString() };
    users.push(newUser);
    setStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },
  updateUser: (id: string, updates: Partial<User>): User => {
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_CLIENT_USERS);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User tidak ditemukan');
    users[idx] = { ...users[idx], ...updates };
    setStorage(STORAGE_KEYS.USERS, users);
    return users[idx];
  },
  deleteUser: (id: string): { message: string } => {
    let users = getStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_CLIENT_USERS);
    users = users.filter((u) => u.id !== id);
    setStorage(STORAGE_KEYS.USERS, users);
    return { message: 'User berhasil dinonaktifkan' };
  },

  // --- OVERVIEWS & REPORTS ---
  getDashboardOverview: () => {
    const sales = getStorage<SaleTransaction[]>(STORAGE_KEYS.SALES, INITIAL_CLIENT_TRANSACTIONS);
    const prods = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_CLIENT_PRODUCTS);
    const recs = getStorage<CustomerReceivable[]>(STORAGE_KEYS.RECEIVABLES, INITIAL_CLIENT_RECEIVABLES);
    const pays = getStorage<SupplierPayable[]>(STORAGE_KEYS.PAYABLES, INITIAL_CLIENT_PAYABLES);
    const exps = getStorage<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_CLIENT_EXPENSES);

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter((s) => s.date.startsWith(todayStr)).reduce((a, b) => a + b.grandTotal, 0);
    const monthSales = sales.reduce((a, b) => a + b.grandTotal, 0);
    const totalGrossProfit = sales.reduce((a, b) => a + (b.grossProfit || 0), 0);
    const totalExpenses = exps.reduce((a, b) => a + b.amount, 0);
    const monthNetProfit = totalGrossProfit - totalExpenses;

    const totalReceivables = recs.reduce((a, b) => a + b.remainingAmount, 0);
    const totalPayables = pays.reduce((a, b) => a + b.remainingAmount, 0);
    const totalProducts = prods.length;
    const totalInventoryValue = prods.reduce((a, b) => a + b.stock * b.buyPrice, 0);

    return {
      todaySales,
      monthSales,
      monthNetProfit,
      totalReceivables,
      totalPayables,
      totalProducts,
      totalInventoryValue,
      todayTransactionsCount: sales.filter((s) => s.date.startsWith(todayStr)).length,
      lowStockProducts: prods.filter((p) => p.stock <= p.minStock),
      recentSales: sales.slice(0, 5),
    };
  },

  // --- SYSTEM RESETS ---
  resetDemo: () => {
    setStorage(STORAGE_KEYS.USERS, INITIAL_CLIENT_USERS);
    setStorage(STORAGE_KEYS.PRODUCTS, INITIAL_CLIENT_PRODUCTS);
    setStorage(STORAGE_KEYS.SALES, INITIAL_CLIENT_TRANSACTIONS);
    setStorage(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_CLIENT_STOCK_MOVEMENTS);
    setStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_CLIENT_SUPPLIERS);
    setStorage(STORAGE_KEYS.PURCHASES, INITIAL_CLIENT_PURCHASES);
    setStorage(STORAGE_KEYS.RECEIVABLES, INITIAL_CLIENT_RECEIVABLES);
    setStorage(STORAGE_KEYS.PAYABLES, INITIAL_CLIENT_PAYABLES);
    setStorage(STORAGE_KEYS.EXPENSES, INITIAL_CLIENT_EXPENSES);
    setStorage(STORAGE_KEYS.SETTINGS, INITIAL_CLIENT_SETTINGS);
    return { message: 'Database demo berhasil di-reset ke kondisi awal', data: true };
  },

  resetTransactions: (resetStockToZero: boolean = false) => {
    setStorage(STORAGE_KEYS.SALES, []);
    setStorage(STORAGE_KEYS.STOCK_MOVEMENTS, []);
    setStorage(STORAGE_KEYS.PURCHASES, []);
    setStorage(STORAGE_KEYS.RECEIVABLES, []);
    setStorage(STORAGE_KEYS.PAYABLES, []);
    setStorage(STORAGE_KEYS.EXPENSES, []);

    if (resetStockToZero) {
      const prods = getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_CLIENT_PRODUCTS).map((p) => ({
        ...p,
        stock: 0,
        updatedAt: new Date().toISOString(),
      }));
      setStorage(STORAGE_KEYS.PRODUCTS, prods);
    }
    return { message: 'Semua transaksi berhasil dikosongkan', data: true };
  },
};
