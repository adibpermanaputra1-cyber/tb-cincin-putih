import fs from 'fs';
import path from 'path';
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

interface DatabaseSchema {
  users: User[];
  products: Product[];
  sales: SaleTransaction[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  purchases: PurchaseOrder[];
  receivables: CustomerReceivable[];
  payables: SupplierPayable[];
  expenses: Expense[];
  settings: StoreSettings;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'tokobangunan.json');

const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'TB. Cincin Putih',
  tagline: 'Penyedia Bahan Bangunan & Alat Konstruksi Terpercaya',
  ownerName: 'Pak Ahmad & Buk Maesaroh',
  address: 'Jl. Raya Bangunan Utama No. 88, TB. Cincin Putih',
  phone: '0812-3456-7890 / (021) 8901234',
  email: 'cincinputih.tb@gmail.com',
  npwp: '09.876.543.2-412.000',
  footerNote: 'Barang yang sudah dibeli dapat ditukar jika cacat maksimal 3 hari kerja dengan menyertakan nota resmi ini. Terima kasih telah berbelanja di TB. Cincin Putih!',
  bankAccount: 'BCA 8801-2345-678 a.n TB. Cincin Putih',
  qrisInstruction: 'Scan QRIS melalui aplikasi mobile banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, Dana, ShopeePay).',
  bankAccounts: [
    {
      id: 'bank_01',
      bankName: 'BCA',
      accountNumber: '8801-2345-678',
      holderName: 'TB. Cincin Putih / Ahmad Junaidi',
      isDefault: true,
    },
    {
      id: 'bank_02',
      bankName: 'Mandiri',
      accountNumber: '156-00-9876543-2',
      holderName: 'TB. Cincin Putih',
      isDefault: false,
    },
  ],
  qrisMerchantName: 'TB. CINCIN PUTIH',
  qrisNmid: 'ID1020030040050',
};

const INITIAL_USERS: User[] = [
  {
    id: 'usr_owner_01',
    name: 'Pak Ahmad & Buk Maesaroh (Owner)',
    email: 'owner@toko.com',
    role: 'OWNER',
    phone: '0812-3456-7890',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'usr_kasir_01',
    name: 'Risma (Kasir)',
    email: 'risma@toko.com',
    username: 'risma',
    role: 'KASIR',
    phone: '0857-1122-3344',
    createdAt: '2026-01-05T08:00:00.000Z',
  },
  {
    id: 'usr_kasir_02',
    name: 'Ririn (Kasir)',
    email: 'ririn@toko.com',
    username: 'ririn',
    role: 'KASIR',
    phone: '0858-2233-4455',
    createdAt: '2026-01-05T08:00:00.000Z',
  },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_01',
    code: 'SUP-SMN',
    name: 'PT Semen Indonesia Distributor Raya',
    contactPerson: 'Pak Hendra (Area Sales)',
    phone: '0811-2233-4455',
    address: 'Kawasan Industri Pulogadung Blok B3, Jakarta Timur',
    materialSpecialty: 'Semen Gresik, Padang & Mortar Instan',
    notes: 'Termin pembayaran 30 hari, pengiriman armada tronton/fuso',
    active: true,
  },
  {
    id: 'sup_02',
    code: 'SUP-BSI',
    name: 'Distributor Besi Baja Krakatau Abadi',
    contactPerson: 'Bu Fenny',
    phone: '0813-8877-6655',
    address: 'Jl. Logam Mas No. 12, Tangerang',
    materialSpecialty: 'Besi Beton SNI Ulir & Polos, Baja Ringan, Hollow',
    notes: 'Jaminan sertifikat uji tarik SNI',
    active: true,
  },
  {
    id: 'sup_03',
    code: 'SUP-CAT',
    name: 'PT Warna Agung Paint Indo (Dulux & Nippon)',
    contactPerson: 'Pak Rudi Hartono',
    phone: '0812-4455-6677',
    address: 'Jl. Daan Mogot Km 14, Jakarta Barat',
    materialSpecialty: 'Cat Tembok, Kayu, Besi & Water Proofing',
    notes: 'Diskon proyek volume besar 3%',
    active: true,
  },
  {
    id: 'sup_04',
    code: 'SUP-PIPA',
    name: 'PT Rucika Mitra Sentosa',
    contactPerson: 'Pak Danang',
    phone: '0878-9900-1122',
    address: 'Kawasan Delta Silicon, Cikarang',
    materialSpecialty: 'Pipa PVC AW/D, Fitting, Lem Pipa, Kran & Sanitari',
    notes: 'Pengiriman rutin setiap hari Selasa dan Jumat',
    active: true,
  },
  {
    id: 'sup_05',
    code: 'SUP-KAYU',
    name: 'UD Sumber Rimba Lestari (Kayu & Pasir)',
    contactPerson: 'Pak Darto',
    phone: '0852-3344-5566',
    address: 'Pangkalan Pasir & Kayu Kalimalang, Bekasi',
    materialSpecialty: 'Kayu Kaso Meranti, Balok, Triplek & Pasir Bangka',
    notes: 'Pasir dihitung per Colt Diesel / Truk Indeks 6 Kubik',
    active: true,
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_toko_1',
    sku: 'SMN-TGR-01',
    barcode: '899100100101',
    name: 'Semen Tiga Roda',
    category: 'Semen & Pasir',
    baseUnit: 'Sak',
    buyPrice: 85000,
    sellPrice: 95000,
    wholesalePrice: 93000,
    stock: 200,
    minStock: 20,
    rackLocation: 'Gudang Utama - Rak Semen',
    units: [
      { unitName: 'Sak', multiplier: 1, price: 95000, buyPrice: 85000 },
      { unitName: 'Truk (160 Sak)', multiplier: 160, price: 14880000, buyPrice: 13600000 },
    ],
    description: 'Semen Tiga Roda berkualitas untuk plester, cor, dan pasang bata.',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_2',
    sku: 'SMN-RJW-01',
    barcode: '899100100102',
    name: 'Semen Rajawali',
    category: 'Semen & Pasir',
    baseUnit: 'Sak',
    buyPrice: 74000,
    sellPrice: 82000,
    wholesalePrice: 80000,
    stock: 150,
    minStock: 20,
    rackLocation: 'Gudang Utama - Rak Semen',
    units: [
      { unitName: 'Sak', multiplier: 1, price: 82000, buyPrice: 74000 },
      { unitName: 'Pallet (50 Sak)', multiplier: 50, price: 4000000, buyPrice: 3700000 },
    ],
    description: 'Semen Rajawali kuat dan ekonomis.',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_3',
    sku: 'PAKU-1-KG',
    barcode: '899100100103',
    name: 'Paku 1"',
    category: 'Alat & Hardware',
    baseUnit: 'Kg',
    buyPrice: 24000,
    sellPrice: 30000,
    wholesalePrice: 28000,
    stock: 100,
    minStock: 10,
    rackLocation: 'Rak Paku A1',
    units: [
      { unitName: 'Kg', multiplier: 1, price: 30000, buyPrice: 24000 },
      { unitName: 'Ons', multiplier: 0.1, price: 5000, buyPrice: 2400 },
      { unitName: 'Dus (20 Kg)', multiplier: 20, price: 560000, buyPrice: 480000 },
    ],
    description: 'Paku 1 inch untuk kayu dan plafon (Harga Rp 30.000/kg & Rp 5.000/ons).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_4',
    sku: 'PAKU-15-5-KG',
    barcode: '899100100104',
    name: 'Paku 1 1/2" - 5"',
    category: 'Alat & Hardware',
    baseUnit: 'Kg',
    buyPrice: 20000,
    sellPrice: 25000,
    wholesalePrice: 24000,
    stock: 250,
    minStock: 20,
    rackLocation: 'Rak Paku A1',
    units: [
      { unitName: 'Kg', multiplier: 1, price: 25000, buyPrice: 20000 },
      { unitName: 'Ons', multiplier: 0.1, price: 4000, buyPrice: 2000 },
      { unitName: 'Dus (30 Kg)', multiplier: 30, price: 720000, buyPrice: 600000 },
    ],
    description: 'Paku kayu ukuran 1.5 inch sampai 5 inch (Harga Rp 25.000/kg & Rp 4.000/ons).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_5',
    sku: 'PAKU-SENG-PTH',
    barcode: '899100100105',
    name: 'Paku Seng Putih',
    category: 'Alat & Hardware',
    baseUnit: 'Kg',
    buyPrice: 28000,
    sellPrice: 35000,
    wholesalePrice: 33000,
    stock: 80,
    minStock: 10,
    rackLocation: 'Rak Paku A2',
    units: [
      { unitName: 'Kg', multiplier: 1, price: 35000, buyPrice: 28000 },
      { unitName: 'Ons', multiplier: 0.1, price: 5000, buyPrice: 2800 },
    ],
    description: 'Paku payung seng putih galvanis (Rp 35.000/kg & Rp 5.000/ons).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_6',
    sku: 'PAKU-SENG-WRN',
    barcode: '899100100106',
    name: 'Paku Seng Warna 2"-5"',
    category: 'Alat & Hardware',
    baseUnit: 'Kg',
    buyPrice: 36000,
    sellPrice: 45000,
    wholesalePrice: 42000,
    stock: 60,
    minStock: 10,
    rackLocation: 'Rak Paku A2',
    units: [
      { unitName: 'Kg', multiplier: 1, price: 45000, buyPrice: 36000 },
      { unitName: 'Ons', multiplier: 0.1, price: 9000, buyPrice: 3600 },
    ],
    description: 'Paku seng warna 2 inch sampai 5 inch (Rp 45.000/kg & Rp 9.000/ons).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_7',
    sku: 'PAKU-BRL-01',
    barcode: '899100100107',
    name: 'Paku Berlian',
    category: 'Alat & Hardware',
    baseUnit: 'Kg',
    buyPrice: 28000,
    sellPrice: 35000,
    wholesalePrice: 33000,
    stock: 75,
    minStock: 10,
    rackLocation: 'Rak Paku A3',
    units: [
      { unitName: 'Kg', multiplier: 1, price: 35000, buyPrice: 28000 },
      { unitName: 'Ons', multiplier: 0.1, price: 5000, buyPrice: 2800 },
    ],
    description: 'Paku beton merek Berlian kuat tidak mudah patah (Rp 35.000/kg).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_8',
    sku: 'TPLK-3MM-01',
    barcode: '899100100108',
    name: 'Triplek 3 mm',
    category: 'Kayu & Triplek',
    baseUnit: 'Lembar',
    buyPrice: 50000,
    sellPrice: 60000,
    wholesalePrice: 57000,
    stock: 120,
    minStock: 15,
    rackLocation: 'Gudang Triplek T1',
    units: [
      { unitName: 'Lembar', multiplier: 1, price: 60000, buyPrice: 50000 },
      { unitName: 'Ikat (10 Lembar)', multiplier: 10, price: 570000, buyPrice: 500000 },
    ],
    description: 'Triplek ketebalan 3 mm rata dan halus (Harga Eceran Rp 60.000, Partai Rp 57.000).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_9',
    sku: 'TPLK-6MM-01',
    barcode: '899100100109',
    name: 'Triplek 6 mm',
    category: 'Kayu & Triplek',
    baseUnit: 'Lembar',
    buyPrice: 95000,
    sellPrice: 110000,
    wholesalePrice: 105000,
    stock: 90,
    minStock: 15,
    rackLocation: 'Gudang Triplek T1',
    units: [
      { unitName: 'Lembar', multiplier: 1, price: 110000, buyPrice: 95000 },
      { unitName: 'Ikat (10 Lembar)', multiplier: 10, price: 1050000, buyPrice: 950000 },
    ],
    description: 'Triplek 6 mm kayu meranti (Harga Eceran Rp 110.000, Partai Rp 105.000).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_10',
    sku: 'TPLK-9MM-01',
    barcode: '899100100110',
    name: 'Triplek 9 mm',
    category: 'Kayu & Triplek',
    baseUnit: 'Lembar',
    buyPrice: 130000,
    sellPrice: 150000,
    wholesalePrice: 145000,
    stock: 80,
    minStock: 10,
    rackLocation: 'Gudang Triplek T2',
    units: [
      { unitName: 'Lembar', multiplier: 1, price: 150000, buyPrice: 130000 },
      { unitName: 'Ikat (10 Lembar)', multiplier: 10, price: 1450000, buyPrice: 1300000 },
    ],
    description: 'Triplek 9 mm tebal padat (Harga Eceran Rp 150.000, Partai Rp 145.000).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_11',
    sku: 'TPLK-12MM-01',
    barcode: '899100100111',
    name: 'Triplek 12 mm',
    category: 'Kayu & Triplek',
    baseUnit: 'Lembar',
    buyPrice: 185000,
    sellPrice: 210000,
    wholesalePrice: 200000,
    stock: 60,
    minStock: 10,
    rackLocation: 'Gudang Triplek T2',
    units: [
      { unitName: 'Lembar', multiplier: 1, price: 210000, buyPrice: 185000 },
      { unitName: 'Ikat (10 Lembar)', multiplier: 10, price: 2000000, buyPrice: 1850000 },
    ],
    description: 'Triplek 12 mm super kuat (Harga Eceran Rp 210.000, Partai Rp 200.000).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_12',
    sku: 'GRC-BRD-01',
    barcode: '899100100112',
    name: 'GRC Board',
    category: 'Atap & Plafon',
    baseUnit: 'Lembar',
    buyPrice: 65000,
    sellPrice: 75000,
    wholesalePrice: 72000,
    stock: 100,
    minStock: 15,
    rackLocation: 'Rak Plafon G1',
    units: [
      { unitName: 'Lembar', multiplier: 1, price: 75000, buyPrice: 65000 },
    ],
    description: 'Papan semen GRC Board tahan air dan rayap (Rp 75.000 / lembar).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_13',
    sku: 'GPS-BRD-01',
    barcode: '899100100113',
    name: 'Gypsum Board',
    category: 'Atap & Plafon',
    baseUnit: 'Lembar',
    buyPrice: 73000,
    sellPrice: 85000,
    wholesalePrice: 82000,
    stock: 80,
    minStock: 15,
    rackLocation: 'Rak Plafon G2',
    units: [
      { unitName: 'Lembar', multiplier: 1, price: 85000, buyPrice: 73000 },
    ],
    description: 'Papan Gypsum 9mm plafon rapi mulus (Rp 85.000 / lembar).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_14',
    sku: 'LSPL-GRC-01',
    barcode: '899100100114',
    name: 'Lisplang GRC',
    category: 'Atap & Plafon',
    baseUnit: 'Batang',
    buyPrice: 63000,
    sellPrice: 75000,
    wholesalePrice: 72000,
    stock: 70,
    minStock: 10,
    rackLocation: 'Rak Lisplang L1',
    units: [
      { unitName: 'Batang', multiplier: 1, price: 75000, buyPrice: 63000 },
    ],
    description: 'Lisplang GRC motif kayu / polos tepi atap (Rp 75.000 / batang).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_15',
    sku: 'KWT-BTN-56',
    barcode: '899100100115',
    name: 'Kawat Beton 5.6 kg',
    category: 'Besi & Baja',
    baseUnit: 'Rol',
    buyPrice: 110000,
    sellPrice: 130000,
    wholesalePrice: 125000,
    stock: 50,
    minStock: 10,
    rackLocation: 'Area Kawat K1',
    units: [
      { unitName: 'Rol (5.6 kg)', multiplier: 1, price: 130000, buyPrice: 110000 },
      { unitName: 'Kg', multiplier: 1 / 5.6, price: 25000, buyPrice: 20000 },
    ],
    description: 'Kawat beton gulungan 5.6 kg (Harga Rp 130.000/rol & Rp 25.000/kg).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_16',
    sku: 'KWT-SMP-10KG',
    barcode: '899100100116',
    name: 'Kawat Simpai 10 kg',
    category: 'Besi & Baja',
    baseUnit: 'Rol',
    buyPrice: 195000,
    sellPrice: 230000,
    wholesalePrice: 220000,
    stock: 40,
    minStock: 8,
    rackLocation: 'Area Kawat K2',
    units: [
      { unitName: 'Rol (10 kg)', multiplier: 1, price: 230000, buyPrice: 195000 },
      { unitName: 'Kg', multiplier: 0.1, price: 25000, buyPrice: 20000 },
    ],
    description: 'Kawat simpai 10 kg ikat beton kuat (Rp 230.000/rol).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_17',
    sku: 'KWT-SMP-12KG',
    barcode: '899100100117',
    name: 'Kawat Simpai 12 kg',
    category: 'Besi & Baja',
    baseUnit: 'Rol',
    buyPrice: 230000,
    sellPrice: 270000,
    wholesalePrice: 260000,
    stock: 35,
    minStock: 8,
    rackLocation: 'Area Kawat K2',
    units: [
      { unitName: 'Rol (12 kg)', multiplier: 1, price: 270000, buyPrice: 230000 },
      { unitName: 'Kg', multiplier: 1 / 12, price: 25000, buyPrice: 20000 },
    ],
    description: 'Kawat simpai 12 kg (Rp 270.000/rol).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_18',
    sku: 'SNG-ECO-MRH',
    barcode: '899100100118',
    name: 'Seng Merah ECO',
    category: 'Atap & Plafon',
    baseUnit: 'Lembar',
    buyPrice: 44000,
    sellPrice: 52000,
    wholesalePrice: 50000,
    stock: 150,
    minStock: 20,
    rackLocation: 'Gudang Seng S1',
    units: [
      { unitName: 'Lembar', multiplier: 1, price: 52000, buyPrice: 44000 },
    ],
    description: 'Seng gelombang warna Merah ECO (Rp 52.000 / lembar).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_19',
    sku: 'SNG-ECO-BRU',
    barcode: '899100100119',
    name: 'Seng Biru ECO',
    category: 'Atap & Plafon',
    baseUnit: 'Lembar',
    buyPrice: 44000,
    sellPrice: 52000,
    wholesalePrice: 50000,
    stock: 150,
    minStock: 20,
    rackLocation: 'Gudang Seng S1',
    units: [
      { unitName: 'Lembar', multiplier: 1, price: 52000, buyPrice: 44000 },
    ],
    description: 'Seng gelombang warna Biru ECO (Rp 52.000 / lembar).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_20',
    sku: 'SNG-KK-MRH',
    barcode: '899100100120',
    name: 'Seng Kingkong Merah',
    category: 'Atap & Plafon',
    baseUnit: 'Lembar',
    buyPrice: 47000,
    sellPrice: 55000,
    wholesalePrice: 53000,
    stock: 120,
    minStock: 20,
    rackLocation: 'Gudang Seng S2',
    units: [
      { unitName: 'Lembar', multiplier: 1, price: 55000, buyPrice: 47000 },
    ],
    description: 'Seng Kingkong tebal warna Merah (Rp 55.000 / lembar).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_21',
    sku: 'SNG-KK-BRU',
    barcode: '899100100121',
    name: 'Seng Kingkong Biru',
    category: 'Atap & Plafon',
    baseUnit: 'Lembar',
    buyPrice: 47000,
    sellPrice: 55000,
    wholesalePrice: 53000,
    stock: 120,
    minStock: 20,
    rackLocation: 'Gudang Seng S2',
    units: [
      { unitName: 'Lembar', multiplier: 1, price: 55000, buyPrice: 47000 },
    ],
    description: 'Seng Kingkong tebal warna Biru (Rp 55.000 / lembar).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_22',
    sku: 'SNG-KK-NVY',
    barcode: '899100100122',
    name: 'Seng Kingkong Navy',
    category: 'Atap & Plafon',
    baseUnit: 'Lembar',
    buyPrice: 47000,
    sellPrice: 55000,
    wholesalePrice: 53000,
    stock: 100,
    minStock: 20,
    rackLocation: 'Gudang Seng S2',
    units: [
      { unitName: 'Lembar', multiplier: 1, price: 55000, buyPrice: 47000 },
    ],
    description: 'Seng Kingkong tebal warna Navy (Rp 55.000 / lembar).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_23',
    sku: 'GRBK-ISCO-PLT',
    barcode: '899100100123',
    name: 'Gerobak ISCO Plat',
    category: 'Alat & Hardware',
    baseUnit: 'Unit',
    buyPrice: 360000,
    sellPrice: 420000,
    wholesalePrice: 400000,
    stock: 25,
    minStock: 5,
    rackLocation: 'Area Gerobak Depan',
    units: [
      { unitName: 'Unit', multiplier: 1, price: 420000, buyPrice: 360000 },
    ],
    description: 'Gerobak Sorong ISCO bak plat tebal tahan banting (Rp 420.000 / unit).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_toko_24',
    sku: 'GRBK-ISCO-PVC',
    barcode: '899100100124',
    name: 'Gerobak ISCO PVC 10kg Besi',
    category: 'Alat & Hardware',
    baseUnit: 'Unit',
    buyPrice: 470000,
    sellPrice: 550000,
    wholesalePrice: 520000,
    stock: 20,
    minStock: 5,
    rackLocation: 'Area Gerobak Depan',
    units: [
      { unitName: 'Unit', multiplier: 1, price: 550000, buyPrice: 470000 },
    ],
    description: 'Gerobak Sorong ISCO PVC bak plastik tebal rangka 10kg besi (Rp 550.000 / unit).',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_01',
    sku: 'SMN-GRS-50',
    barcode: '899123450001',
    name: 'Semen Gresik PPC 50 Kg',
    category: 'Semen & Pasir',
    baseUnit: 'Sak',
    buyPrice: 62000,
    sellPrice: 70000,
    wholesalePrice: 68000,
    stock: 250,
    minStock: 40,
    rackLocation: 'Gudang Utama - Pallet A1-A4',
    units: [
      { unitName: 'Sak', multiplier: 1, price: 70000, buyPrice: 62000 },
      { unitName: 'Truk (160 Sak)', multiplier: 160, price: 10800000, buyPrice: 9760000 },
    ],
    description: 'Semen Portland Pozzolan berkualitas tinggi untuk plesteran, cor, dan pasangan bata.',
    isActive: true,
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod_02',
    sku: 'SMN-PDG-40',
    barcode: '899123450002',
    name: 'Semen Padang PCC 40 Kg',
    category: 'Semen & Pasir',
    baseUnit: 'Sak',
    buyPrice: 51000,
    sellPrice: 59000,
    wholesalePrice: 57500,
    stock: 180,
    minStock: 30,
    rackLocation: 'Gudang Utama - Pallet A5-A8',
    units: [
      { unitName: 'Sak', multiplier: 1, price: 59000, buyPrice: 51000 },
      { unitName: 'Pallet (50 Sak)', multiplier: 50, price: 2900000, buyPrice: 2500000 },
    ],
    description: 'Semen berkualitas andalan tukang bangunan, lebih cepat kering dan kuat.',
    isActive: true,
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod_03',
    sku: 'BSI-ULR-10',
    barcode: '899123450003',
    name: 'Besi Beton Ulir 10mm SNI (Panjang 12 Meter)',
    category: 'Besi & Baja',
    baseUnit: 'Batang',
    buyPrice: 78000,
    sellPrice: 89000,
    wholesalePrice: 86000,
    stock: 140,
    minStock: 25,
    rackLocation: 'Area Rak Besi Panjang No. 1',
    units: [
      { unitName: 'Batang', multiplier: 1, price: 89000, buyPrice: 78000 },
      { unitName: 'Ikat (25 Batang)', multiplier: 25, price: 2175000, buyPrice: 1925000 },
    ],
    description: 'Besi beton ulir standar SNI asli toleransi 0.2mm, kuat tarik tinggi untuk balok cor.',
    isActive: true,
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod_04',
    sku: 'BSI-PLS-8',
    barcode: '899123450004',
    name: 'Besi Beton Polos 8mm SNI (Panjang 12 Meter)',
    category: 'Besi & Baja',
    baseUnit: 'Batang',
    buyPrice: 48000,
    sellPrice: 56000,
    wholesalePrice: 54000,
    stock: 220,
    minStock: 35,
    rackLocation: 'Area Rak Besi Panjang No. 2',
    units: [
      { unitName: 'Batang', multiplier: 1, price: 56000, buyPrice: 48000 },
      { unitName: 'Ikat (30 Batang)', multiplier: 30, price: 1650000, buyPrice: 1420000 },
    ],
    description: 'Besi cincin beugel tiang cor dan pengikat sloof SNI presisi.',
    isActive: true,
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod_05',
    sku: 'BJA-RN-075',
    barcode: '899123450005',
    name: 'Baja Ringan Kanal C75 x 0.75mm (Panjang 6m)',
    category: 'Besi & Baja',
    baseUnit: 'Batang',
    buyPrice: 85000,
    sellPrice: 99000,
    wholesalePrice: 95000,
    stock: 95,
    minStock: 20,
    rackLocation: 'Area Atap Baja Rak B1',
    units: [
      { unitName: 'Batang', multiplier: 1, price: 99000, buyPrice: 85000 },
      { unitName: 'Ikat (10 Batang)', multiplier: 10, price: 960000, buyPrice: 830000 },
    ],
    description: 'Rangka atap galvalume anti karat garansi kuat.',
    isActive: true,
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod_06',
    sku: 'CAT-DLX-20L',
    barcode: '899123450006',
    name: 'Cat Tembok Dulux Weathershield 20 Liter (Pail)',
    category: 'Cat & Kimia',
    baseUnit: 'Pail',
    buyPrice: 1450000,
    sellPrice: 1680000,
    wholesalePrice: 1640000,
    stock: 18,
    minStock: 5,
    rackLocation: 'Rak Cat Display C1',
    units: [
      { unitName: 'Pail (20L)', multiplier: 1, price: 1680000, buyPrice: 1450000 },
      { unitName: 'Galon (2.5L)', multiplier: 0.125, price: 235000, buyPrice: 195000 },
    ],
    description: 'Cat dinding eksterior premium tahan cuaca ekstrem panas dan hujan.',
    isActive: true,
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod_07',
    sku: 'CAT-AVN-1KG',
    barcode: '899123450007',
    name: 'Cat Kayu & Besi Avian Sintetis 1 Kg',
    category: 'Cat & Kimia',
    baseUnit: 'Kaleng',
    buyPrice: 62000,
    sellPrice: 74000,
    wholesalePrice: 71000,
    stock: 45,
    minStock: 10,
    rackLocation: 'Rak Cat Display C3',
    units: [
      { unitName: 'Kaleng (1kg)', multiplier: 1, price: 74000, buyPrice: 62000 },
      { unitName: 'Dus (12 Kaleng)', multiplier: 12, price: 860000, buyPrice: 730000 },
    ],
    description: 'Cat kilap super untuk kusen pintu, jendela, pagar besi anti karat.',
    isActive: true,
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod_08',
    sku: 'PPA-RCK-AW-34',
    barcode: '899123450008',
    name: 'Pipa PVC Rucika AW 3/4 Inch (4 Meter)',
    category: 'Pipa & Sanitari',
    baseUnit: 'Batang',
    buyPrice: 38000,
    sellPrice: 46000,
    wholesalePrice: 43500,
    stock: 80,
    minStock: 15,
    rackLocation: 'Gudang Pipa Samping',
    units: [
      { unitName: 'Batang', multiplier: 1, price: 46000, buyPrice: 38000 },
      { unitName: 'Ikat (10 Batang)', multiplier: 10, price: 445000, buyPrice: 370000 },
    ],
    description: 'Pipa air bersih tebal AW standar PDAM tahan tekanan tinggi.',
    isActive: true,
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod_09',
    sku: 'HBL-BTA-75',
    barcode: '899123450009',
    name: 'Bata Ringan Hebel AAC 7.5cm (Per Kubik)',
    category: 'Semen & Pasir',
    baseUnit: 'Kubik',
    buyPrice: 530000,
    sellPrice: 620000,
    wholesalePrice: 600000,
    stock: 24,
    minStock: 5,
    rackLocation: 'Halaman Luar Penumpukan Bata',
    units: [
      { unitName: 'Kubik (111 Pcs)', multiplier: 1, price: 620000, buyPrice: 530000 },
      { unitName: 'Pcs (Biji)', multiplier: 1 / 111, price: 6000, buyPrice: 4800 },
      { unitName: 'Truk (12.6 m³)', multiplier: 12.6, price: 7600000, buyPrice: 6500000 },
    ],
    description: 'Bata ringan presisi kuat hemat semen dan pengerjaan cepat.',
    isActive: true,
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod_10',
    sku: 'KYU-KSO-46',
    barcode: '899123450010',
    name: 'Kayu Kaso Meranti Campur 4x6 (Panjang 4 Meter)',
    category: 'Kayu & Triplek',
    baseUnit: 'Batang',
    buyPrice: 17500,
    sellPrice: 23000,
    wholesalePrice: 21500,
    stock: 320,
    minStock: 50,
    rackLocation: 'Gudang Kayu Sebelah',
    units: [
      { unitName: 'Batang', multiplier: 1, price: 23000, buyPrice: 17500 },
      { unitName: 'Ikat (6 Batang)', multiplier: 6, price: 135000, buyPrice: 102000 },
      { unitName: 'Kubik (104 Batang)', multiplier: 104, price: 2300000, buyPrice: 1780000 },
    ],
    description: 'Kayu kaso lurus untuk stegger cor dak dan rangka plafon.',
    isActive: true,
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod_11',
    sku: 'TPL-MRT-9MM',
    barcode: '899123450011',
    name: 'Triplek Meranti 9mm (122 x 244 cm)',
    category: 'Kayu & Triplek',
    baseUnit: 'Lembar',
    buyPrice: 92000,
    sellPrice: 110000,
    wholesalePrice: 105000,
    stock: 65,
    minStock: 12,
    rackLocation: 'Rak Triplek T1',
    units: [
      { unitName: 'Lembar', multiplier: 1, price: 110000, buyPrice: 92000 },
      { unitName: 'Ikat (10 Lembar)', multiplier: 10, price: 1070000, buyPrice: 900000 },
    ],
    description: 'Triplek padat rata untuk bekisting cor dan partisi dinding.',
    isActive: true,
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod_12',
    sku: 'PSR-BNK-CLT',
    barcode: '899123450012',
    name: 'Pasir Pasang Bangka Asli (1 Colt Diesel / ±4 m³)',
    category: 'Semen & Pasir',
    baseUnit: 'Colt',
    buyPrice: 980000,
    sellPrice: 1250000,
    wholesalePrice: 1200000,
    stock: 8,
    minStock: 2,
    rackLocation: 'Bak Pasir Depan',
    units: [
      { unitName: 'Colt (4 m³)', multiplier: 1, price: 1250000, buyPrice: 980000 },
      { unitName: 'Kijang/Pickup (1 m³)', multiplier: 0.25, price: 340000, buyPrice: 260000 },
      { unitName: 'Karung (25 Kg)', multiplier: 0.015, price: 22000, buyPrice: 15000 },
    ],
    description: 'Pasir Bangka cuci bebas lumpur, sangat bagus untuk plester halus dan cor beton kokoh.',
    isActive: true,
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod_13',
    sku: 'PKU-CMP-7CM',
    barcode: '899123450013',
    name: 'Paku Kayu Campur 7cm (Dus 30 Kg / Eceran Kg)',
    category: 'Alat & Hardware',
    baseUnit: 'Kg',
    buyPrice: 15000,
    sellPrice: 19000,
    wholesalePrice: 18000,
    stock: 120,
    minStock: 20,
    rackLocation: 'Rak Baut & Paku B2',
    units: [
      { unitName: 'Kg', multiplier: 1, price: 19000, buyPrice: 15000 },
      { unitName: 'Dus (30 Kg)', multiplier: 30, price: 540000, buyPrice: 435000 },
    ],
    description: 'Paku kayu baja tajam dan tidak mudah bengkok.',
    isActive: true,
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod_14',
    sku: 'KRM-RMN-40',
    barcode: '899123450014',
    name: 'Keramik Roman 40x40 Putih Polos Glossy (Dus)',
    category: 'Keramik & Lantai',
    baseUnit: 'Dus',
    buyPrice: 65000,
    sellPrice: 78000,
    wholesalePrice: 75000,
    stock: 55,
    minStock: 10,
    rackLocation: 'Area Keramik K1',
    units: [
      { unitName: 'Dus (1 m² / 6 Pcs)', multiplier: 1, price: 78000, buyPrice: 65000 },
      { unitName: 'Pallet (60 Dus)', multiplier: 60, price: 4560000, buyPrice: 3840000 },
    ],
    description: 'Keramik lantai kualitas Grade 1 kilap elegan dan presisi siku.',
    isActive: true,
    updatedAt: '2026-08-10T09:00:00.000Z',
  },
  {
    id: 'prod_15',
    sku: 'KWT-BND-1KG',
    barcode: '899123450015',
    name: 'Kawat Bendrat / Kawat Ikat Beton SNI (Per Kg / Rol)',
    category: 'Besi & Baja',
    baseUnit: 'Kg',
    buyPrice: 17000,
    sellPrice: 22000,
    wholesalePrice: 20000,
    stock: 150,
    minStock: 25,
    rackLocation: 'Rak Besi & Kawat B3',
    units: [
      { unitName: 'Kg', multiplier: 1, price: 22000, buyPrice: 17000 },
      { unitName: 'Rol (25 Kg)', multiplier: 25, price: 500000, buyPrice: 410000 },
    ],
    description: 'Kawat bendrat hitam lentur tidak mudah putus untuk mengikat besi beton & begel cakar ayam.',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_16',
    sku: 'KWT-DRI-30M',
    barcode: '899123450016',
    name: 'Kawat Duri Galvanis Pagar Anti Karat (Rol 30 Meter)',
    category: 'Besi & Baja',
    baseUnit: 'Rol',
    buyPrice: 85000,
    sellPrice: 105000,
    wholesalePrice: 98000,
    stock: 30,
    minStock: 5,
    rackLocation: 'Area Rak Besi Kawat B4',
    units: [
      { unitName: 'Rol (30m)', multiplier: 1, price: 105000, buyPrice: 85000 },
      { unitName: 'Ikat (5 Rol)', multiplier: 5, price: 490000, buyPrice: 415000 },
    ],
    description: 'Kawat duri pagar pengaman galvanis kuat anti karat.',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'prod_17',
    sku: 'KWT-RAM-PVC',
    barcode: '899123450017',
    name: 'Kawat Ram Hijau PVC Kotak 1/2 Inch (Per Meter / Rol)',
    category: 'Alat & Hardware',
    baseUnit: 'Meter',
    buyPrice: 12000,
    sellPrice: 16000,
    wholesalePrice: 15000,
    stock: 100,
    minStock: 20,
    rackLocation: 'Rak Kawat Ram A2',
    units: [
      { unitName: 'Meter', multiplier: 1, price: 16000, buyPrice: 12000 },
      { unitName: 'Rol (10 Meter)', multiplier: 10, price: 150000, buyPrice: 115000 },
    ],
    description: 'Kawat ram loket lapis pvc hijau anti karat untuk kandang dan ventilasi.',
    isActive: true,
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
];

const INITIAL_SALES: SaleTransaction[] = [
  {
    id: 'sal_001',
    invoiceNo: 'INV-202608-001',
    date: '2026-08-13T09:30:00.000Z',
    cashierId: 'usr_kasir_01',
    cashierName: 'Budi Santoso',
    customerName: 'Pak Haji Sukardi (Proyek Perumahan Griya)',
    customerPhone: '0812-3344-5566',
    customerAddress: 'Kavling Griya Asri Blok D2 No. 15',
    items: [
      {
        productId: 'prod_01',
        productName: 'Semen Gresik PPC 50 Kg',
        sku: 'SMN-GRS-50',
        unit: 'Sak',
        multiplier: 1,
        quantity: 20,
        baseQuantity: 20,
        unitPrice: 70000,
        buyPrice: 62000,
        subtotal: 1400000,
        discount: 20000,
        profit: (70000 - 62000) * 20 - 20000,
      },
      {
        productId: 'prod_03',
        productName: 'Besi Beton Ulir 10mm SNI',
        sku: 'BSI-ULR-10',
        unit: 'Batang',
        multiplier: 1,
        quantity: 15,
        baseQuantity: 15,
        unitPrice: 89000,
        buyPrice: 78000,
        subtotal: 1335000,
        discount: 0,
        profit: (89000 - 78000) * 15,
      },
    ],
    subtotal: 2735000,
    discountAmount: 20000,
    taxRate: 0,
    taxAmount: 0,
    deliveryFee: 50000,
    grandTotal: 2765000,
    totalHpp: 62000 * 20 + 78000 * 15,
    grossProfit: 2735000 - 20000 - (62000 * 20 + 78000 * 15),
    paymentMethod: 'TUNAI',
    paymentStatus: 'LUNAS',
    cashPaid: 2800000,
    changeDue: 35000,
    paidAmount: 2765000,
    remainingAmount: 0,
    notes: 'Kirim pakai armada Pickup Toko siang ini jam 13:00',
  },
  {
    id: 'sal_002',
    invoiceNo: 'INV-202608-002',
    date: '2026-08-13T11:15:00.000Z',
    cashierId: 'usr_owner_01',
    cashierName: 'Pak Ahmad Junaidi',
    customerName: 'Mandor Wawan (Kontraktor Ruko)',
    customerPhone: '0856-7788-9900',
    customerAddress: 'Proyek Ruko Sentra Timur Blok A',
    items: [
      {
        productId: 'prod_09',
        productName: 'Bata Ringan Hebel AAC 7.5cm',
        sku: 'HBL-BTA-75',
        unit: 'Kubik (111 Pcs)',
        multiplier: 1,
        quantity: 5,
        baseQuantity: 5,
        unitPrice: 620000,
        buyPrice: 530000,
        subtotal: 3100000,
        discount: 50000,
        profit: (620000 - 530000) * 5 - 50000,
      },
      {
        productId: 'prod_10',
        productName: 'Kayu Kaso Meranti Campur 4x6',
        sku: 'KYU-KSO-46',
        unit: 'Ikat (6 Batang)',
        multiplier: 6,
        quantity: 10,
        baseQuantity: 60,
        unitPrice: 135000,
        buyPrice: 102000,
        subtotal: 1350000,
        discount: 0,
        profit: (135000 - 102000) * 10,
      },
    ],
    subtotal: 4450000,
    discountAmount: 50000,
    taxRate: 0,
    taxAmount: 0,
    deliveryFee: 100000,
    grandTotal: 4500000,
    totalHpp: 530000 * 5 + 102000 * 10,
    grossProfit: 4400000 - (530000 * 5 + 102000 * 10),
    paymentMethod: 'KASBON',
    paymentStatus: 'SEBAGIAN',
    cashPaid: 2000000,
    changeDue: 0,
    paidAmount: 2000000,
    remainingAmount: 2500000,
    dueDate: '2026-08-25',
    notes: 'DP 2jt diterima, pelunasan sisa 2.5jt saat progres dinding selesai tanggal 25 Agustus',
  },
];

const INITIAL_RECEIVABLES: CustomerReceivable[] = [
  {
    id: 'rec_001',
    invoiceId: 'sal_002',
    invoiceNo: 'INV-202608-002',
    customerName: 'Mandor Wawan (Kontraktor Ruko)',
    customerPhone: '0856-7788-9900',
    customerAddress: 'Proyek Ruko Sentra Timur Blok A',
    transactionDate: '2026-08-13T11:15:00.000Z',
    dueDate: '2026-08-25',
    totalAmount: 4500000,
    paidAmount: 2000000,
    remainingAmount: 2500000,
    status: 'SEBAGIAN',
    payments: [
      {
        id: 'rec_pay_01',
        date: '2026-08-13T11:15:00.000Z',
        amount: 2000000,
        paymentMethod: 'TUNAI',
        notes: 'Uang Muka (DP) saat pembelian hebel & kaso',
        receivedBy: 'Pak Ahmad Junaidi',
      },
    ],
    notes: 'Mandor terpercaya, janji lunas tanggal 25',
  },
  {
    id: 'rec_002',
    invoiceId: 'sal_prev_01',
    invoiceNo: 'INV-202608-000',
    customerName: 'Bpk. Yudi Santoso (Renovasi Rumah)',
    customerPhone: '0817-6543-2109',
    customerAddress: 'Jl. Melati Raya No. 4, Cikarang',
    transactionDate: '2026-08-05T14:00:00.000Z',
    dueDate: '2026-08-20',
    totalAmount: 3200000,
    paidAmount: 1000000,
    remainingAmount: 2200000,
    status: 'SEBAGIAN',
    payments: [
      {
        id: 'rec_pay_02',
        date: '2026-08-05T14:00:00.000Z',
        amount: 1000000,
        paymentMethod: 'TRANSFER',
        notes: 'DP Transfer BCA',
        receivedBy: 'Budi Santoso',
      },
    ],
    notes: 'Ambil semen & cat dulux',
  },
];

const INITIAL_PURCHASES: PurchaseOrder[] = [
  {
    id: 'po_001',
    poNumber: 'PO-202608-001',
    supplierId: 'sup_01',
    supplierName: 'PT Semen Indonesia Distributor Raya',
    date: '2026-08-08T10:00:00.000Z',
    items: [
      {
        productId: 'prod_01',
        productName: 'Semen Gresik PPC 50 Kg',
        sku: 'SMN-GRS-50',
        unit: 'Sak',
        multiplier: 1,
        quantity: 150,
        baseQuantity: 150,
        buyPrice: 62000,
        subtotal: 9300000,
      },
    ],
    totalAmount: 9300000,
    paymentMethod: 'TEMPO',
    paymentStatus: 'SEBAGIAN',
    paidAmount: 4300000,
    remainingAmount: 5000000,
    dueDate: '2026-08-28',
    notes: 'Beli 150 sak semen gresik, tempo 20 hari',
    receivedBy: 'Pak Ahmad Junaidi',
  },
];

const INITIAL_PAYABLES: SupplierPayable[] = [
  {
    id: 'pay_001',
    poId: 'po_001',
    poNumber: 'PO-202608-001',
    supplierId: 'sup_01',
    supplierName: 'PT Semen Indonesia Distributor Raya',
    transactionDate: '2026-08-08T10:00:00.000Z',
    dueDate: '2026-08-28',
    totalAmount: 9300000,
    paidAmount: 4300000,
    remainingAmount: 5000000,
    status: 'SEBAGIAN',
    payments: [
      {
        id: 'pay_sub_01',
        date: '2026-08-08T10:00:00.000Z',
        amount: 4300000,
        paymentMethod: 'TRANSFER',
        notes: 'DP Transfer Bank Mandiri ke PT Semen Indonesia',
        paidBy: 'Pak Ahmad Junaidi',
      },
    ],
    notes: 'Sisa Rp 5.000.000 jatuh tempo 28 Agustus 2026',
  },
  {
    id: 'pay_002',
    poId: 'po_prev_02',
    poNumber: 'PO-202608-000',
    supplierId: 'sup_02',
    supplierName: 'Distributor Besi Baja Krakatau Abadi',
    transactionDate: '2026-08-02T13:00:00.000Z',
    dueDate: '2026-08-22',
    totalAmount: 12000000,
    paidAmount: 6000000,
    remainingAmount: 6000000,
    status: 'SEBAGIAN',
    payments: [
      {
        id: 'pay_sub_02',
        date: '2026-08-02T13:00:00.000Z',
        amount: 6000000,
        paymentMethod: 'TRANSFER',
        notes: 'Uang Muka 50% kiriman besi SNI',
        paidBy: 'Pak Ahmad Junaidi',
      },
    ],
    notes: 'Pengiriman 150 btg besi beton ulir & polos',
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_000',
    date: '2026-08-13T08:15:00.000Z',
    category: 'Kasbon & Pinjaman Karyawan',
    amount: 300000,
    recipient: 'Rismawati (Kasir)',
    paymentMethod: 'TUNAI',
    notes: '[KASBON KARYAWAN: Rismawati] Rencana: Potong Gaji Akhir Bulan. Keperluan: Biaya berobat keluarga mendesak',
    recordedBy: 'Pak Ahmad & Buk Maesaroh (Owner)',
  },
  {
    id: 'exp_001',
    date: '2026-08-12T16:30:00.000Z',
    category: 'BBM & Solar Truk / Pikap Armada',
    amount: 350000,
    recipient: 'SPBU Pertamina Cikarang (Supir Pak Joko)',
    paymentMethod: 'TUNAI',
    notes: 'Pengisian Solar Truk Colt Diesel TB. Cincin Putih untuk kirim hebel & semen',
    recordedBy: 'Rismawati (Kasir)',
  },
  {
    id: 'exp_002',
    date: '2026-08-11T12:00:00.000Z',
    category: 'Upah Kuli Bongkar / Muat Material',
    amount: 250000,
    recipient: 'Kuli Bongkar Muat (4 Orang)',
    paymentMethod: 'TUNAI',
    notes: 'Upah bongkar muatan tronton semen gresik 150 sak & hebel',
    recordedBy: 'Pak Ahmad & Buk Maesaroh (Owner)',
  },
  {
    id: 'exp_003',
    date: '2026-08-05T09:00:00.000Z',
    category: 'Listrik, Air & Internet Toko',
    amount: 650000,
    recipient: 'PLN & Indihome Toko',
    paymentMethod: 'TRANSFER',
    notes: 'Tagihan listrik 3500VA dan internet POS kasir bulan Agustus',
    recordedBy: 'Pak Ahmad & Buk Maesaroh (Owner)',
  },
];

const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov_001',
    date: '2026-08-08T10:00:00.000Z',
    productId: 'prod_01',
    productName: 'Semen Gresik PPC 50 Kg',
    sku: 'SMN-GRS-50',
    type: 'PEMBELIAN',
    quantityChange: 150,
    previousStock: 120,
    resultingStock: 270,
    unitName: 'Sak',
    referenceNo: 'PO-202608-001',
    notes: 'Penerimaan barang dari PT Semen Indonesia',
    createdBy: 'Pak Ahmad Junaidi',
  },
  {
    id: 'mov_002',
    date: '2026-08-13T09:30:00.000Z',
    productId: 'prod_01',
    productName: 'Semen Gresik PPC 50 Kg',
    sku: 'SMN-GRS-50',
    type: 'PENJUALAN',
    quantityChange: -20,
    previousStock: 270,
    resultingStock: 250,
    unitName: 'Sak',
    referenceNo: 'INV-202608-001',
    notes: 'Penjualan ke Pak Haji Sukardi',
    createdBy: 'Budi Santoso',
  },
  {
    id: 'mov_003',
    date: '2026-08-13T09:30:00.000Z',
    productId: 'prod_03',
    productName: 'Besi Beton Ulir 10mm SNI',
    sku: 'BSI-ULR-10',
    type: 'PENJUALAN',
    quantityChange: -15,
    previousStock: 155,
    resultingStock: 140,
    unitName: 'Batang',
    referenceNo: 'INV-202608-001',
    notes: 'Penjualan ke Pak Haji Sukardi',
    createdBy: 'Budi Santoso',
  },
];

class DatabaseEngine {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading DB file, using fallback initial data:', err);
    }

    const initial: DatabaseSchema = {
      users: INITIAL_USERS,
      products: INITIAL_PRODUCTS,
      sales: INITIAL_SALES,
      stockMovements: INITIAL_STOCK_MOVEMENTS,
      suppliers: INITIAL_SUPPLIERS,
      purchases: INITIAL_PURCHASES,
      receivables: INITIAL_RECEIVABLES,
      payables: INITIAL_PAYABLES,
      expenses: INITIAL_EXPENSES,
      settings: INITIAL_SETTINGS,
    };

    this.saveDataDirect(initial);
    return initial;
  }

  private saveDataDirect(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to save DB:', err);
    }
  }

  public save() {
    this.saveDataDirect(this.data);
  }

  public resetDemo() {
    this.data = {
      users: INITIAL_USERS,
      products: INITIAL_PRODUCTS,
      sales: INITIAL_SALES,
      stockMovements: INITIAL_STOCK_MOVEMENTS,
      suppliers: INITIAL_SUPPLIERS,
      purchases: INITIAL_PURCHASES,
      receivables: INITIAL_RECEIVABLES,
      payables: INITIAL_PAYABLES,
      expenses: INITIAL_EXPENSES,
      settings: INITIAL_SETTINGS,
    };
    this.save();
    return this.data;
  }

  public clearAllFinancialData(): DatabaseSchema {
    this.data.sales = [];
    this.data.purchases = [];
    this.data.receivables = [];
    this.data.payables = [];
    this.data.expenses = [];
    this.data.stockMovements = [];
    this.save();
    return this.data;
  }

  public resetTransactions(resetStockToZero: boolean = false): DatabaseSchema {
    // 1. Reset all financial records, sales transactions, purchases, debts, and movements to 0
    this.data.sales = [];
    this.data.purchases = [];
    this.data.receivables = [];
    this.data.payables = [];
    this.data.expenses = [];
    this.data.stockMovements = [];

    // 2. Preserve ALL products, categories, units, and prices intact.
    // If resetStockToZero is true, set the current physical stock to 0 so the user can enter real incoming stock from purchases
    if (resetStockToZero) {
      this.data.products = this.data.products.map(p => ({
        ...p,
        stock: 0,
        updatedAt: new Date().toISOString(),
      }));
    }

    this.save();
    return this.data;
  }

  public getFullBackup(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.data));
  }

  public restoreBackup(backupData: any): DatabaseSchema {
    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Format data backup tidak valid');
    }
    
    // Ensure all required arrays/objects exist with fallback to current or initial
    const restored: DatabaseSchema = {
      users: Array.isArray(backupData.users) ? backupData.users : this.data.users,
      products: Array.isArray(backupData.products) ? backupData.products : this.data.products,
      sales: Array.isArray(backupData.sales) ? backupData.sales : this.data.sales,
      stockMovements: Array.isArray(backupData.stockMovements) ? backupData.stockMovements : this.data.stockMovements,
      suppliers: Array.isArray(backupData.suppliers) ? backupData.suppliers : this.data.suppliers,
      purchases: Array.isArray(backupData.purchases) ? backupData.purchases : this.data.purchases,
      receivables: Array.isArray(backupData.receivables) ? backupData.receivables : this.data.receivables,
      payables: Array.isArray(backupData.payables) ? backupData.payables : this.data.payables,
      expenses: Array.isArray(backupData.expenses) ? backupData.expenses : this.data.expenses,
      settings: backupData.settings && typeof backupData.settings === 'object' ? backupData.settings : this.data.settings,
    };

    this.data = restored;
    this.save();
    return this.data;
  }

  // --- USERS ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const initLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.save();
    return this.data.users.length < initLen;
  }

  // --- SETTINGS ---
  public getSettings(): StoreSettings {
    const s = this.data.settings || INITIAL_SETTINGS;
    if (!s.bankAccounts || s.bankAccounts.length === 0) {
      s.bankAccounts = [
        {
          id: 'bank_01',
          bankName: 'BCA',
          accountNumber: '8801-2345-678',
          holderName: 'TB. Cincin Putih / Ahmad Junaidi',
          isDefault: true,
        },
      ];
    }
    return s;
  }

  public updateSettings(settings: Partial<StoreSettings>): StoreSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    if (settings.receiptFooter !== undefined) {
      updated.footerNote = settings.receiptFooter;
      updated.receiptFooter = settings.receiptFooter;
    } else if (settings.footerNote !== undefined) {
      updated.footerNote = settings.footerNote;
      updated.receiptFooter = settings.footerNote;
    }
    this.data.settings = updated;
    this.save();
    return this.data.settings;
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public createProduct(product: Omit<Product, 'id' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    this.data.products.unshift(newProduct);

    // Initial stock movement record if stock > 0
    if (newProduct.stock > 0) {
      this.addStockMovement({
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: 'PENYESUAIAN_PLUS',
        quantityChange: newProduct.stock,
        previousStock: 0,
        resultingStock: newProduct.stock,
        unitName: newProduct.baseUnit,
        notes: 'Stok Awal Produk Baru Terdaftar',
        createdBy: 'Sistem Master Data',
      });
    }

    this.save();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const oldProduct = this.data.products[idx];

    // If stock adjusted directly via edit
    if (updates.stock !== undefined && updates.stock !== oldProduct.stock) {
      const diff = updates.stock - oldProduct.stock;
      this.addStockMovement({
        productId: oldProduct.id,
        productName: updates.name || oldProduct.name,
        sku: updates.sku || oldProduct.sku,
        type: diff > 0 ? 'PENYESUAIAN_PLUS' : 'PENYESUAIAN_MINUS',
        quantityChange: diff,
        previousStock: oldProduct.stock,
        resultingStock: updates.stock,
        unitName: updates.baseUnit || oldProduct.baseUnit,
        notes: 'Penyesuaian Manual Stok Master Barang',
        createdBy: 'Master Data',
      });
    }

    this.data.products[idx] = {
      ...oldProduct,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.products[idx];
  }

  public deleteProduct(id: string): boolean {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.products.splice(idx, 1);
    this.save();
    return true;
  }

  public adjustStock(
    productId: string,
    quantityChange: number,
    type: 'PENYESUAIAN_PLUS' | 'PENYESUAIAN_MINUS' | 'BARANG_RUSAK' | 'RETUR',
    notes: string,
    createdBy: string
  ): Product | null {
    const product = this.getProductById(productId);
    if (!product) return null;

    const previousStock = product.stock;
    const resultingStock = Math.max(0, previousStock + quantityChange);
    product.stock = resultingStock;
    product.updatedAt = new Date().toISOString();

    this.addStockMovement({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type,
      quantityChange,
      previousStock,
      resultingStock,
      unitName: product.baseUnit,
      notes,
      createdBy,
    });

    this.save();
    return product;
  }

  // --- STOCK MOVEMENTS ---
  public getStockMovements(): StockMovement[] {
    return this.data.stockMovements;
  }

  public addStockMovement(movement: Omit<StockMovement, 'id' | 'date'>): StockMovement {
    const newMovement: StockMovement = {
      ...movement,
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString(),
    };
    this.data.stockMovements.unshift(newMovement);
    this.save();
    return newMovement;
  }

  // --- SALES / POS ---
  public getSales(): SaleTransaction[] {
    return this.data.sales;
  }

  public createSale(saleData: Omit<SaleTransaction, 'id' | 'invoiceNo' | 'date'>): SaleTransaction {
    const now = new Date();
    const count = this.data.sales.length + 1;
    const invSuffix = count.toString().padStart(4, '0');
    const yyyymm = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const invoiceNo = `INV-${yyyymm}-${invSuffix}`;

    const newSale: SaleTransaction = {
      ...saleData,
      id: `sal_${Date.now()}`,
      invoiceNo,
      date: now.toISOString(),
    };

    // Deduct stocks and log stock movements
    for (const item of newSale.items) {
      const product = this.getProductById(item.productId);
      if (product) {
        const qtyToDeduct = item.baseQuantity || item.quantity * (item.multiplier || 1);
        const prevStock = product.stock;
        product.stock = Math.max(0, prevStock - qtyToDeduct);
        product.updatedAt = now.toISOString();

        this.addStockMovement({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          type: 'PENJUALAN',
          quantityChange: -qtyToDeduct,
          previousStock: prevStock,
          resultingStock: product.stock,
          unitName: product.baseUnit,
          referenceNo: invoiceNo,
          notes: `Penjualan Kasir POS #${invoiceNo} (${newSale.customerName})`,
          createdBy: newSale.cashierName,
        });
      }
    }

    // If payment is KASBON or has remaining balance, create a CustomerReceivable
    if (newSale.paymentMethod === 'KASBON' || newSale.remainingAmount > 0) {
      const rec: CustomerReceivable = {
        id: `rec_${Date.now()}`,
        invoiceId: newSale.id,
        invoiceNo: newSale.invoiceNo,
        customerName: newSale.customerName,
        customerPhone: newSale.customerPhone,
        customerAddress: newSale.customerAddress,
        transactionDate: newSale.date,
        dueDate: newSale.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        totalAmount: newSale.grandTotal,
        paidAmount: newSale.paidAmount,
        remainingAmount: newSale.remainingAmount,
        status: newSale.paidAmount >= newSale.grandTotal ? 'LUNAS' : newSale.paidAmount > 0 ? 'SEBAGIAN' : 'BELUM_LUNAS',
        payments: newSale.paidAmount > 0 ? [
          {
            id: `rec_pay_${Date.now()}`,
            date: newSale.date,
            amount: newSale.paidAmount,
            paymentMethod: 'TUNAI',
            notes: 'Uang Muka / Pembayaran Awal Transaksi',
            receivedBy: newSale.cashierName,
          }
        ] : [],
        notes: newSale.notes,
      };
      this.data.receivables.unshift(rec);
    }

    this.data.sales.unshift(newSale);
    this.save();
    return newSale;
  }

  // --- RECEIVABLES (BUKU PIUTANG / KASBON) ---
  public getReceivables(): CustomerReceivable[] {
    return this.data.receivables;
  }

  public payReceivable(
    receivableId: string,
    amount: number,
    paymentMethod: 'TUNAI' | 'TRANSFER' | 'QRIS',
    receivedBy: string,
    notes?: string
  ): CustomerReceivable | null {
    const rec = this.data.receivables.find(r => r.id === receivableId);
    if (!rec) return null;

    const actualAmount = Math.min(amount, rec.remainingAmount);
    rec.paidAmount += actualAmount;
    rec.remainingAmount = Math.max(0, rec.totalAmount - rec.paidAmount);
    rec.status = rec.remainingAmount <= 0 ? 'LUNAS' : 'SEBAGIAN';

    rec.payments.push({
      id: `rec_pay_${Date.now()}`,
      date: new Date().toISOString(),
      amount: actualAmount,
      paymentMethod,
      notes: notes || 'Pelunasan / Cicilan Kasbon',
      receivedBy,
    });

    // Update corresponding sale transaction if exists
    const sale = this.data.sales.find(s => s.id === rec.invoiceId || s.invoiceNo === rec.invoiceNo);
    if (sale) {
      sale.paidAmount = rec.paidAmount;
      sale.remainingAmount = rec.remainingAmount;
      sale.paymentStatus = rec.status;
    }

    this.save();
    return rec;
  }

  // --- SUPPLIERS ---
  public getSuppliers(): Supplier[] {
    return this.data.suppliers;
  }

  public createSupplier(supplier: Omit<Supplier, 'id'>): Supplier {
    const newSup: Supplier = {
      ...supplier,
      id: `sup_${Date.now()}`,
    };
    this.data.suppliers.push(newSup);
    this.save();
    return newSup;
  }

  public updateSupplier(id: string, updates: Partial<Supplier>): Supplier | null {
    const idx = this.data.suppliers.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.suppliers[idx] = { ...this.data.suppliers[idx], ...updates };
    this.save();
    return this.data.suppliers[idx];
  }

  public deleteSupplier(id: string): boolean {
    const idx = this.data.suppliers.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.data.suppliers.splice(idx, 1);
    this.save();
    return true;
  }

  // --- PURCHASES & PAYABLES (STOK MASUK & BUKU UTANG USAHA) ---
  public getPurchases(): PurchaseOrder[] {
    return this.data.purchases;
  }

  public createPurchase(purchaseData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'date'>): PurchaseOrder {
    const now = new Date();
    const count = this.data.purchases.length + 1;
    const poSuffix = count.toString().padStart(4, '0');
    const yyyymm = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const poNumber = `PO-${yyyymm}-${poSuffix}`;

    const newPO: PurchaseOrder = {
      ...purchaseData,
      id: `po_${Date.now()}`,
      poNumber,
      date: now.toISOString(),
    };

    // Add stocks to products
    for (const item of newPO.items) {
      const product = this.getProductById(item.productId);
      if (product) {
        const qtyToAdd = item.baseQuantity || item.quantity * (item.multiplier || 1);
        const prevStock = product.stock;
        product.stock = prevStock + qtyToAdd;
        // Optionally update buy price if new buy price provided
        if (item.buyPrice && item.buyPrice > 0) {
          product.buyPrice = item.buyPrice;
        }
        product.updatedAt = now.toISOString();

        this.addStockMovement({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          type: 'PEMBELIAN',
          quantityChange: qtyToAdd,
          previousStock: prevStock,
          resultingStock: product.stock,
          unitName: product.baseUnit,
          referenceNo: poNumber,
          notes: `Pembelian Supplier #${poNumber} (${newPO.supplierName})`,
          createdBy: newPO.receivedBy,
        });
      }
    }

    // If remainingAmount > 0 or paymentMethod is TEMPO, create a SupplierPayable
    if (newPO.paymentMethod === 'TEMPO' || newPO.remainingAmount > 0) {
      const payable: SupplierPayable = {
        id: `pay_${Date.now()}`,
        poId: newPO.id,
        poNumber: newPO.poNumber,
        supplierId: newPO.supplierId,
        supplierName: newPO.supplierName,
        transactionDate: newPO.date,
        dueDate: newPO.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        totalAmount: newPO.totalAmount,
        paidAmount: newPO.paidAmount,
        remainingAmount: newPO.remainingAmount,
        status: newPO.paidAmount >= newPO.totalAmount ? 'LUNAS' : newPO.paidAmount > 0 ? 'SEBAGIAN' : 'BELUM_LUNAS',
        payments: newPO.paidAmount > 0 ? [
          {
            id: `pay_sub_${Date.now()}`,
            date: newPO.date,
            amount: newPO.paidAmount,
            paymentMethod: newPO.paymentMethod === 'TEMPO' ? 'TRANSFER' : (newPO.paymentMethod as any),
            notes: 'Pembayaran DP / Awal Pembelian',
            paidBy: newPO.receivedBy,
          }
        ] : [],
        notes: newPO.notes,
      };
      this.data.payables.unshift(payable);
    }

    this.data.purchases.unshift(newPO);
    this.save();
    return newPO;
  }

  public getPayables(): SupplierPayable[] {
    return this.data.payables;
  }

  public payPayable(
    payableId: string,
    amount: number,
    paymentMethod: 'TUNAI' | 'TRANSFER',
    paidBy: string,
    notes?: string
  ): SupplierPayable | null {
    const pay = this.data.payables.find(p => p.id === payableId);
    if (!pay) return null;

    const actualAmount = Math.min(amount, pay.remainingAmount);
    pay.paidAmount += actualAmount;
    pay.remainingAmount = Math.max(0, pay.totalAmount - pay.paidAmount);
    pay.status = pay.remainingAmount <= 0 ? 'LUNAS' : 'SEBAGIAN';

    pay.payments.push({
      id: `pay_sub_${Date.now()}`,
      date: new Date().toISOString(),
      amount: actualAmount,
      paymentMethod,
      notes: notes || 'Pembayaran Utang Supplier',
      paidBy,
    });

    // Update corresponding purchase if exists
    const po = this.data.purchases.find(p => p.id === pay.poId || p.poNumber === pay.poNumber);
    if (po) {
      po.paidAmount = pay.paidAmount;
      po.remainingAmount = pay.remainingAmount;
      po.paymentStatus = pay.status;
    }

    this.save();
    return pay;
  }

  // --- EXPENSES (BEBAN OPERASIONAL) ---
  public getExpenses(): Expense[] {
    return this.data.expenses;
  }

  public createExpense(expense: Omit<Expense, 'id'>): Expense {
    const newExp: Expense = {
      ...expense,
      id: `exp_${Date.now()}`,
    };
    this.data.expenses.unshift(newExp);
    this.save();
    return newExp;
  }

  public deleteExpense(id: string): boolean {
    const idx = this.data.expenses.findIndex(e => e.id === id);
    if (idx === -1) return false;
    this.data.expenses.splice(idx, 1);
    this.save();
    return true;
  }

  // --- FINANCIAL & DASHBOARD REPORTS ---
  public getDashboardSummary(): DashboardSummary {
    const todayStr = new Date().toISOString().split('T')[0];

    const todaySalesList = this.data.sales.filter(s => s.date.startsWith(todayStr));
    const todaySales = todaySalesList.reduce((sum, s) => sum + s.grandTotal, 0);
    const todayProfit = todaySalesList.reduce((sum, s) => sum + (s.grossProfit || 0), 0);

    const totalReceivables = this.data.receivables.reduce((sum, r) => sum + r.remainingAmount, 0);
    const totalPayables = this.data.payables.reduce((sum, p) => sum + p.remainingAmount, 0);

    const totalStockValue = this.data.products.reduce((sum, p) => sum + p.stock * p.buyPrice, 0);
    const lowStockCount = this.data.products.filter(p => p.stock <= p.minStock).length;

    // Monthly summary
    const currentMonth = new Date().toISOString().substring(0, 7); // e.g. "2026-08"
    const monthSalesList = this.data.sales.filter(s => s.date.startsWith(currentMonth));
    const monthlyRevenue = monthSalesList.reduce((sum, s) => sum + s.grandTotal, 0);
    const monthlyGrossProfit = monthSalesList.reduce((sum, s) => sum + (s.grossProfit || 0), 0);

    const monthExpensesList = this.data.expenses.filter(e => e.date.startsWith(currentMonth));
    const monthlyExpenses = monthExpensesList.reduce((sum, e) => sum + e.amount, 0);
    const monthlyNetProfit = monthlyGrossProfit - monthlyExpenses;

    // Product sales count
    const productStats: Record<string, { name: string; category: string; quantity: number; revenue: number }> = {};
    for (const sale of this.data.sales) {
      for (const item of sale.items) {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            name: item.productName,
            category: 'Material',
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[item.productId].quantity += item.quantity;
        productStats[item.productId].revenue += item.subtotal;
      }
    }
    const topSellingProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Sales Trend (last 7 days)
    const salesTrend: { date: string; sales: number; profit: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const daySales = this.data.sales.filter(s => s.date.startsWith(dStr));
      const dayRev = daySales.reduce((acc, s) => acc + s.grandTotal, 0);
      const dayProf = daySales.reduce((acc, s) => acc + (s.grossProfit || 0), 0);
      salesTrend.push({
        date: dStr.substring(5), // "08-13"
        sales: dayRev,
        profit: dayProf,
      });
    }

    // Category Sales breakdown
    const catMap: Record<string, number> = {};
    for (const sale of this.data.sales) {
      for (const item of sale.items) {
        const prod = this.getProductById(item.productId);
        const cat = prod?.category || 'Lainnya';
        catMap[cat] = (catMap[cat] || 0) + item.subtotal;
      }
    }
    const categorySales = Object.entries(catMap).map(([category, amount]) => ({ category, amount }));

    return {
      todaySales,
      todayProfit,
      todayTransactionsCount: todaySalesList.length,
      totalReceivables,
      totalPayables,
      totalStockValue,
      totalInventoryValue: totalStockValue,
      totalProducts: this.data.products.length,
      lowStockCount,
      monthSales: monthlyRevenue,
      monthlyRevenue,
      monthlyExpenses,
      monthNetProfit: monthlyNetProfit,
      monthlyNetProfit,
      recentSales: this.data.sales.slice(0, 5),
      topSellingProducts,
      salesTrend,
      categorySales,
    };
  }

  public getProfitLossReport(startDate?: string, endDate?: string): ProfitLossReport {
    let sales = this.data.sales;
    let expenses = this.data.expenses;

    if (startDate) {
      sales = sales.filter(s => s.date >= startDate);
      expenses = expenses.filter(e => e.date >= startDate);
    }
    if (endDate) {
      const endISO = `${endDate}T23:59:59.999Z`;
      sales = sales.filter(s => s.date <= endISO);
      expenses = expenses.filter(e => e.date <= endISO);
    }

    const grossSales = sales.reduce((sum, s) => sum + s.subtotal + (s.deliveryFee || 0), 0);
    const salesDiscounts = sales.reduce((sum, s) => sum + (s.discountAmount || 0), 0);
    const netSales = grossSales - salesDiscounts;
    const costOfGoodsSold = sales.reduce((sum, s) => sum + (s.totalHpp || 0), 0);
    const grossProfit = netSales - costOfGoodsSold;

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const catMap: Record<string, number> = {};
    for (const exp of expenses) {
      catMap[exp.category] = (catMap[exp.category] || 0) + exp.amount;
    }
    const expensesByCategory = Object.entries(catMap).map(([category, amount]) => ({ category, amount }));

    const netOperatingIncome = grossProfit - totalExpenses;
    const netMarginPercentage = netSales > 0 ? (netOperatingIncome / netSales) * 100 : 0;

    return {
      period: startDate && endDate ? `${startDate} s/d ${endDate}` : 'Semua Periode',
      startDate: startDate || 'Awal',
      endDate: endDate || 'Sekarang',
      grossSales,
      salesDiscounts,
      netSales,
      costOfGoodsSold,
      grossProfit,
      totalExpenses,
      expensesByCategory,
      netOperatingIncome,
      netMarginPercentage: Number(netMarginPercentage.toFixed(2)),
    };
  }

  public getCashFlowReport(startDate?: string, endDate?: string): CashFlowReport {
    let sales = this.data.sales;
    let receivables = this.data.receivables;
    let purchases = this.data.purchases;
    let payables = this.data.payables;
    let expenses = this.data.expenses;

    if (startDate) {
      sales = sales.filter(s => s.date >= startDate);
      expenses = expenses.filter(e => e.date >= startDate);
    }
    if (endDate) {
      const endISO = `${endDate}T23:59:59.999Z`;
      sales = sales.filter(s => s.date <= endISO);
      expenses = expenses.filter(e => e.date <= endISO);
    }

    // Cash from direct sales (TUNAI, TRANSFER, QRIS at transaction time)
    const cashSales = sales.reduce((sum, s) => {
      if (s.paymentMethod === 'TUNAI' || s.paymentMethod === 'TRANSFER' || s.paymentMethod === 'QRIS') {
        return sum + s.grandTotal;
      } else {
        // If kasbon, only count DP/paidAmount at sale time
        return sum + (s.paidAmount || 0);
      }
    }, 0);

    // Receivable collections payments
    let receivableCollections = 0;
    for (const r of receivables) {
      for (const p of r.payments) {
        if (p.notes?.includes('Awal')) continue; // Already counted in cashSales
        if (startDate && p.date < startDate) continue;
        if (endDate && p.date > `${endDate}T23:59:59.999Z`) continue;
        receivableCollections += p.amount;
      }
    }

    const totalCashIn = cashSales + receivableCollections;

    // Cash for purchases
    const cashPurchases = purchases.reduce((sum, p) => {
      if (p.paymentMethod === 'TUNAI' || p.paymentMethod === 'TRANSFER') {
        return sum + p.totalAmount;
      } else {
        return sum + (p.paidAmount || 0);
      }
    }, 0);

    // Payable payments to suppliers
    let payablePayments = 0;
    for (const pay of payables) {
      for (const p of pay.payments) {
        if (p.notes?.includes('Awal') || p.notes?.includes('DP')) continue;
        if (startDate && p.date < startDate) continue;
        if (endDate && p.date > `${endDate}T23:59:59.999Z`) continue;
        payablePayments += p.amount;
      }
    }

    const operatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCashOut = cashPurchases + payablePayments + operatingExpenses;
    const netCashFlow = totalCashIn - totalCashOut;

    return {
      period: startDate && endDate ? `${startDate} s/d ${endDate}` : 'Semua Periode',
      startDate: startDate || 'Awal',
      endDate: endDate || 'Sekarang',
      cashIn: {
        cashSales,
        receivableCollections,
        totalCashIn,
      },
      cashOut: {
        cashPurchases,
        payablePayments,
        operatingExpenses,
        totalCashOut,
      },
      netCashFlow,
      estimatedCashBalance: netCashFlow + 25000000, // Initial store operational reserve
    };
  }
}

export const db = new DatabaseEngine();
