export type Role = 'OWNER' | 'KASIR';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: Role;
  phone?: string;
  avatar?: string;
  active?: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  receivablesBalance?: number;
}

export interface UnitConversion {
  unitName: string; // e.g. "Sak", "Kg", "Batang", "Ikat", "Dus", "Lembar", "Pail", "Kaleng", "Truk"
  multiplier: number; // 1 unitName = multiplier baseUnits (e.g., 1 Sak = 50 Kg, 1 Dus = 1 m², 1 Truk = 6 Kubik)
  price: number; // Harga jual per satuan ini
  buyPrice: number; // Harga beli per satuan ini
  barcode?: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  category: string; // 'Semen & Pasir', 'Besi & Baja', 'Kayu & Triplek', 'Cat & Kimia', 'Pipa & Sanitari', 'Keramik & Lantai', 'Atap & Plafon', 'Alat & Hardware', 'Listrik'
  baseUnit: string; // e.g. "Kg", "Batang", "Pcs", "Lembar", "Liter", "Kaleng"
  buyPrice: number; // Modal / HPP per baseUnit
  sellPrice: number; // Harga jual umum per baseUnit
  wholesalePrice?: number; // Harga grosir / proyek per baseUnit
  stock: number; // Jumlah stok dalam baseUnit
  minStock: number; // Batas peringatan stok tipis
  rackLocation?: string; // e.g. "Gudang A - Rak 03", "Area Pasir Luar"
  units: UnitConversion[]; // Satuan alternatif / turunan
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  category: string;
  selectedUnit: string;
  multiplier: number;
  unitPrice: number;
  baseBuyPrice: number;
  quantity: number;
  discount: number; // Discount per item in Rupiah
  subtotal: number;
}

export type PaymentMethod = 'TUNAI' | 'TRANSFER' | 'QRIS' | 'KASBON';
export type PaymentStatus = 'LUNAS' | 'BELUM_LUNAS' | 'SEBAGIAN';

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  multiplier: number;
  quantity: number;
  baseQuantity: number; // quantity * multiplier
  unitPrice: number;
  buyPrice: number; // HPP per unit at transaction time
  subtotal: number;
  discount: number;
  profit: number; // (unitPrice - buyPrice) * quantity - discount
}

export interface SaleTransaction {
  id: string;
  invoiceNo: string; // e.g. "INV-202608-0001"
  date: string;
  cashierId: string;
  cashierName: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxRate: number; // e.g. 0 or 11
  taxAmount: number;
  deliveryFee: number; // Biaya kirim armada
  grandTotal: number;
  totalHpp: number; // Total modal HPP barang
  grossProfit: number; // grandTotal (excl delivery/tax) - totalHpp
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  cashPaid: number; // Uang yang diserahkan pelanggan
  changeDue: number; // Kembalian
  paidAmount: number; // Uang yang sudah masuk (DP / Lunas)
  remainingAmount: number; // Sisa piutang jika Kasbon
  dueDate?: string; // Tanggal jatuh tempo jika Kasbon
  notes?: string;
  bankName?: string;
}

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'PENJUALAN' | 'PEMBELIAN' | 'PENYESUAIAN_PLUS' | 'PENYESUAIAN_MINUS' | 'BARANG_RUSAK' | 'RETUR';
  quantityChange: number; // + or - base units
  previousStock: number;
  resultingStock: number;
  unitName: string;
  referenceNo?: string; // No Invoice / No PO
  notes: string;
  createdBy: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  phone: string;
  address?: string;
  materialSpecialty: string; // e.g. "Semen & Mortar", "Besi Baja SNI", "Cat & Thinner"
  notes?: string;
  active: boolean;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  multiplier: number;
  quantity: number;
  baseQuantity: number;
  buyPrice: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. "PO-202608-0001"
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  paymentMethod: 'TUNAI' | 'TRANSFER' | 'TEMPO';
  paymentStatus: 'LUNAS' | 'BELUM_LUNAS' | 'SEBAGIAN';
  paidAmount: number;
  remainingAmount: number;
  dueDate?: string;
  notes?: string;
  receivedBy: string;
}

export interface ReceivablePayment {
  id: string;
  date: string;
  amount: number;
  paymentMethod: 'TUNAI' | 'TRANSFER' | 'QRIS';
  notes?: string;
  receivedBy: string;
}

export interface CustomerReceivable {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  transactionDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'BELUM_LUNAS' | 'SEBAGIAN' | 'LUNAS' | 'JATUH_TEMPO';
  payments: ReceivablePayment[];
  notes?: string;
}

export interface PayablePayment {
  id: string;
  date: string;
  amount: number;
  paymentMethod: 'TUNAI' | 'TRANSFER';
  notes?: string;
  paidBy: string;
}

export interface SupplierPayable {
  id: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  transactionDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'BELUM_LUNAS' | 'SEBAGIAN' | 'LUNAS' | 'JATUH_TEMPO';
  payments: PayablePayment[];
  notes?: string;
}

export type ExpenseCategory =
  | 'Kasbon & Pinjaman Karyawan'
  | 'Gaji & Upah Karyawan'
  | 'Uang Makan & Konsumsi Karyawan'
  | 'Upah Kuli Bongkar / Muat Material'
  | 'Bensin & Solar Armada Truk'
  | 'BBM & Solar Truk / Pikap Armada'
  | 'Servis, Oli & Onderdil Truk'
  | 'Listrik, Air & Internet Toko'
  | 'Listrik, Air & Internet'
  | 'Sewa Tempat, Kios & Gudang'
  | 'Sewa Tempat & Gudang'
  | 'Konsumsi & Kuli Bongkar'
  | 'Perawatan & Maintenance'
  | 'Perawatan & Renovasi Toko/Gudang'
  | 'Perlengkapan Toko, Plastik & ATK Nota'
  | 'Pajak, Retribusi & Iuran Lingkungan'
  | 'Pajak & Retribusi'
  | 'Biaya Administrasi & Transfer Bank'
  | 'Operasional Lainnya';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  recipient?: string;
  paymentMethod: 'TUNAI' | 'TRANSFER';
  notes: string;
  recordedBy: string;
}

export interface BankAccountItem {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
  isDefault?: boolean;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  npwp?: string;
  footerNote: string;
  receiptFooter?: string;
  defaultTaxRate?: number;
  bankAccount: string;
  qrisInstruction: string;
  bankAccounts?: BankAccountItem[];
  qrisMerchantName?: string;
  qrisNmid?: string;
  qrisImageUrl?: string;
}

export interface StoreCapitalTransaction {
  id: string;
  type: 'TANAM_MODAL' | 'TARIK_MODAL';
  amount: number;
  date: string;
  notes: string;
  paymentMethod: 'TUNAI' | 'TRANSFER';
  recordedBy: string;
  runningBalance?: number;
  source?: string;
}

export interface StoreShift {
  id: string;
  shiftNumber?: number;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  status: 'OPEN' | 'CLOSED';
  startingCash: number;
  expectedCash?: number;
  actualCash?: number;
  difference?: number;
  cashSalesAmount?: number;
  nonCashSalesAmount?: number;
  totalSalesAmount?: number;
  totalTransactionsCount?: number;
  cashExpensesAmount?: number;
  openNotes?: string;
  closeNotes?: string;
  closedBy?: string;
}

export interface DashboardOverview {
  todaySales: number;
  monthSales: number;
  monthNetProfit: number;
  monthlyNetProfit?: number;
  totalReceivables: number;
  totalPayables: number;
  totalProducts: number;
  totalInventoryValue: number;
  storeBalance?: number;
  activeShift?: StoreShift | null;
  cashInDrawerNow?: number;
  activeCashierCount?: number;
  todayTransactionsCount?: number;
  todayExpenses?: number;
  lowStockCount?: number;
}


export type DashboardSummary = DashboardOverview & {
  todayProfit?: number;
  todayTransactionsCount?: number;
  totalStockValue?: number;
  lowStockCount?: number;
  monthlyRevenue?: number;
  monthlyExpenses?: number;
  recentSales?: SaleTransaction[];
  topSellingProducts?: { name: string; category: string; quantity: number; revenue: number }[];
  salesTrend?: { date: string; sales: number; profit: number }[];
  categorySales?: { category: string; amount: number }[];
};

export interface FinancialReport {
  profitAndLoss: {
    totalRevenue: number;
    cogs: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    expenseBreakdown: {
      salaries: number;
      fuelAndTransport: number;
      utilities: number;
      rent: number;
      consumption: number;
      others: number;
    };
  };
  cashFlow: {
    cashInflow: {
      cashSales: number;
      receivablesCollected: number;
      total: number;
    };
    cashOutflow: {
      cashPurchases: number;
      payablesPaid: number;
      operatingExpenses: number;
      total: number;
    };
    netCashFlow: number;
  };
}

export interface ProfitLossReport {
  period: string;
  startDate: string;
  endDate: string;
  grossSales: number;
  salesDiscounts: number;
  netSales: number;
  costOfGoodsSold: number; // Total HPP
  grossProfit: number;
  totalExpenses: number;
  expensesByCategory: { category: string; amount: number }[];
  netOperatingIncome: number;
  netMarginPercentage: number;
}

export interface CashFlowReport {
  period: string;
  startDate: string;
  endDate: string;
  cashIn: {
    cashSales: number;
    receivableCollections: number;
    totalCashIn: number;
  };
  cashOut: {
    cashPurchases: number;
    payablePayments: number;
    operatingExpenses: number;
    totalCashOut: number;
  };
  netCashFlow: number;
  estimatedCashBalance: number;
}
