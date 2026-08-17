import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- AUTH ENDPOINTS ---
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPass = String(password).trim();

    // Default password checks for the requested accounts
    if (cleanEmail === 'owner@toko.com' && (cleanPass === 'owner123' || cleanPass === 'admin123')) {
      const user = db.findUserByEmail('owner@toko.com') || {
        id: 'usr_owner_01',
        name: 'Pak Ahmad & Buk Maesaroh (Owner)',
        email: 'owner@toko.com',
        role: 'OWNER' as const,
        phone: '0812-3456-7890',
        createdAt: new Date().toISOString(),
      };
      return res.json({
        token: `mock_jwt_owner_${Date.now()}`,
        user,
        greeting: 'Selamat datang kembali, Pak Ahmad & Buk Maesaroh! Berikut ringkasan penjualan, kas, dan stok TB. Cincin Putih hari ini.',
      });
    }

    if ((cleanEmail === 'risma@toko.com' || cleanEmail === 'kasir@toko.com') && (cleanPass === 'kasir123' || cleanPass === 'risma123')) {
      const user = db.findUserByEmail('risma@toko.com') || db.findUserByEmail('kasir@toko.com') || {
        id: 'usr_kasir_01',
        name: 'Risma (Kasir)',
        email: 'risma@toko.com',
        role: 'KASIR' as const,
        phone: '0857-1122-3344',
        createdAt: new Date().toISOString(),
      };
      return res.json({
        token: `mock_jwt_risma_${Date.now()}`,
        user,
        greeting: 'Selamat bertugas, Risma! Siap melayani penjualan kasir TB. Cincin Putih hari ini?',
      });
    }

    if (cleanEmail === 'ririn@toko.com' && (cleanPass === 'kasir123' || cleanPass === 'ririn123')) {
      const user = db.findUserByEmail('ririn@toko.com') || {
        id: 'usr_kasir_02',
        name: 'Ririn (Kasir)',
        email: 'ririn@toko.com',
        role: 'KASIR' as const,
        phone: '0858-2233-4455',
        createdAt: new Date().toISOString(),
      };
      return res.json({
        token: `mock_jwt_ririn_${Date.now()}`,
        user,
        greeting: 'Selamat bertugas, Ririn! Siap melayani penjualan kasir TB. Cincin Putih hari ini?',
      });
    }

    // Check other registered users
    const existing = db.findUserByEmail(cleanEmail);
    if (existing && cleanPass.length >= 4) {
      return res.json({
        token: `mock_jwt_custom_${Date.now()}`,
        user: existing,
        greeting: existing.role === 'OWNER'
          ? `Selamat datang kembali, ${existing.name}! Berikut ringkasan keuangan toko Anda.`
          : `Selamat bertugas, ${existing.name}! Siap melayani pelanggan toko hari ini?`,
      });
    }

    return res.status(401).json({ error: 'Email atau password salah. Silakan periksa kembali akun Anda.' });
  });

  // --- PRODUCTS ---
  app.get('/api/products', (req: Request, res: Response) => {
    res.json(db.getProducts());
  });

  app.post('/api/products', (req: Request, res: Response) => {
    try {
      const product = db.createProduct(req.body);
      res.status(201).json(product);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Gagal menambahkan produk' });
    }
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    const updated = db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    res.json(updated);
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const success = db.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    res.json({ message: 'Produk berhasil dihapus' });
  });

  app.post('/api/products/adjust-stock', (req: Request, res: Response) => {
    const { productId, quantityChange, type, notes, createdBy } = req.body;
    if (!productId || quantityChange === undefined) {
      return res.status(400).json({ error: 'Data penyesuaian stok tidak lengkap' });
    }
    const updated = db.adjustStock(productId, Number(quantityChange), type || 'PENYESUAIAN_PLUS', notes || '', createdBy || 'Petugas');
    if (!updated) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    res.json(updated);
  });

  // --- STOCK MOVEMENTS ---
  app.get('/api/stock-movements', (req: Request, res: Response) => {
    res.json(db.getStockMovements());
  });

  // --- SALES / POS ---
  app.get('/api/sales', (req: Request, res: Response) => {
    res.json(db.getSales());
  });

  app.post('/api/sales', (req: Request, res: Response) => {
    try {
      const sale = db.createSale(req.body);
      res.status(201).json(sale);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Gagal memproses transaksi penjualan' });
    }
  });

  // --- SUPPLIERS ---
  app.get('/api/suppliers', (req: Request, res: Response) => {
    res.json(db.getSuppliers());
  });

  app.post('/api/suppliers', (req: Request, res: Response) => {
    const sup = db.createSupplier(req.body);
    res.status(201).json(sup);
  });

  app.put('/api/suppliers/:id', (req: Request, res: Response) => {
    const updated = db.updateSupplier(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Supplier tidak ditemukan' });
    res.json(updated);
  });

  app.delete('/api/suppliers/:id', (req: Request, res: Response) => {
    const ok = db.deleteSupplier(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Supplier tidak ditemukan' });
    res.json({ message: 'Supplier berhasil dihapus' });
  });

  // --- PURCHASES (STOK MASUK) ---
  app.get('/api/purchases', (req: Request, res: Response) => {
    res.json(db.getPurchases());
  });

  app.post('/api/purchases', (req: Request, res: Response) => {
    try {
      const po = db.createPurchase(req.body);
      res.status(201).json(po);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Gagal memproses pembelian supplier' });
    }
  });

  // --- RECEIVABLES (BUKU PIUTANG / KASBON) ---
  app.get('/api/receivables', (req: Request, res: Response) => {
    res.json(db.getReceivables());
  });

  app.post('/api/receivables/:id/pay', (req: Request, res: Response) => {
    const { amount, paymentMethod, receivedBy, notes } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Jumlah pembayaran harus lebih dari 0' });
    }
    const updated = db.payReceivable(req.params.id, Number(amount), paymentMethod || 'TUNAI', receivedBy || 'Kasir', notes);
    if (!updated) return res.status(404).json({ error: 'Data piutang tidak ditemukan' });
    res.json(updated);
  });

  // --- PAYABLES (BUKU UTANG SUPPLIER) ---
  app.get('/api/payables', (req: Request, res: Response) => {
    res.json(db.getPayables());
  });

  app.post('/api/payables/:id/pay', (req: Request, res: Response) => {
    const { amount, paymentMethod, paidBy, notes } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Jumlah pembayaran harus lebih dari 0' });
    }
    const updated = db.payPayable(req.params.id, Number(amount), paymentMethod || 'TRANSFER', paidBy || 'Owner', notes);
    if (!updated) return res.status(404).json({ error: 'Data utang tidak ditemukan' });
    res.json(updated);
  });

  // --- EXPENSES (BEBAN OPERASIONAL) ---
  app.get('/api/expenses', (req: Request, res: Response) => {
    res.json(db.getExpenses());
  });

  app.post('/api/expenses', (req: Request, res: Response) => {
    const exp = db.createExpense(req.body);
    res.status(201).json(exp);
  });

  app.delete('/api/expenses/:id', (req: Request, res: Response) => {
    const ok = db.deleteExpense(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Pengeluaran tidak ditemukan' });
    res.json({ message: 'Pengeluaran berhasil dihapus' });
  });

  // --- REPORTS ---
  app.get('/api/reports/dashboard', (req: Request, res: Response) => {
    res.json(db.getDashboardSummary());
  });

  app.get('/api/reports/profit-loss', (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    res.json(db.getProfitLossReport(startDate, endDate));
  });

  app.get('/api/reports/cash-flow', (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    res.json(db.getCashFlowReport(startDate, endDate));
  });

  // --- USERS MANAGEMENT ---
  app.get('/api/users', (req: Request, res: Response) => {
    res.json(db.getUsers());
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const user = db.createUser(req.body);
    res.status(201).json(user);
  });

  app.put('/api/users/:id', (req: Request, res: Response) => {
    const updated = db.updateUser(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(updated);
  });

  app.delete('/api/users/:id', (req: Request, res: Response) => {
    const ok = db.deleteUser(req.params.id);
    if (!ok) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ message: 'User berhasil dihapus' });
  });

  // --- STORE SETTINGS ---
  app.get('/api/settings', (req: Request, res: Response) => {
    res.json(db.getSettings());
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  });

  // --- SYSTEM (BACKUP, RESTORE & RESET) ---
  app.get('/api/system/backup', (req: Request, res: Response) => {
    const backup = db.getFullBackup();
    res.json(backup);
  });

  app.post('/api/system/restore', (req: Request, res: Response) => {
    try {
      const restored = db.restoreBackup(req.body);
      res.json({ message: 'Data cadangan toko berhasil dipulihkan!', data: restored });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Gagal memulihkan data backup' });
    }
  });

  app.post('/api/system/reset-demo', (req: Request, res: Response) => {
    const fresh = db.resetDemo();
    res.json({ message: 'Database demo berhasil di-reset ke kondisi awal', data: fresh });
  });

  app.post('/api/system/reset-transactions', (req: Request, res: Response) => {
    const resetStockToZero = Boolean(req.body?.resetStockToZero);
    const fresh = db.resetTransactions(resetStockToZero);
    res.json({
      message: resetStockToZero
        ? 'Transaksi & keuangan berhasil di-reset ke Rp 0, serta stok barang dikosongkan ke 0 (katalog produk tetap utuh).'
        : 'Transaksi & keuangan berhasil di-reset ke Rp 0 (katalog produk dan jumlah stok saat ini tetap dipertahankan).',
      data: fresh,
    });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Toko Bangunan Ahmad Junaidi running on http://localhost:${PORT}`);
  });
}

startServer();
