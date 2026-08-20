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
      return res.status(400).json({ error: 'Username/Email dan kata sandi wajib diisi' });
    }

    const cleanIdentifier = String(email).trim().toLowerCase();
    const cleanPass = String(password).trim();

    // 1. Look up user by email or username or admin/owner aliases
    let user = db.findUserByIdentifier(cleanIdentifier);

    // Fallback if not found in db users list
    if (!user) {
      if (cleanIdentifier === 'owner' || cleanIdentifier === 'admin' || cleanIdentifier === 'owner@toko.com') {
        user = db.getUsers().find(u => u.role === 'OWNER') || {
          id: 'usr_owner_01',
          name: 'Ahmad Junaidi',
          email: 'owner@toko.com',
          username: 'admin',
          password: 'owner123',
          role: 'OWNER',
          phone: '0812-3456-7890',
          createdAt: new Date().toISOString(),
        };
      } else if (cleanIdentifier === 'risma' || cleanIdentifier === 'risma@toko.com' || cleanIdentifier === 'kasir@toko.com') {
        user = db.getUsers().find(u => u.username === 'risma' || u.email === 'risma@toko.com') || {
          id: 'usr_kasir_01',
          name: 'Risma (Kasir)',
          email: 'risma@toko.com',
          username: 'risma',
          password: 'kasir123',
          role: 'KASIR',
          phone: '0857-1122-3344',
          createdAt: new Date().toISOString(),
        };
      } else if (cleanIdentifier === 'ririn' || cleanIdentifier === 'ririn@toko.com') {
        user = db.getUsers().find(u => u.username === 'ririn' || u.email === 'ririn@toko.com') || {
          id: 'usr_kasir_02',
          name: 'Ririn (Kasir)',
          email: 'ririn@toko.com',
          username: 'ririn',
          password: 'kasir123',
          role: 'KASIR',
          phone: '0858-2233-4455',
          createdAt: new Date().toISOString(),
        };
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Pengguna atau username tidak terdaftar.' });
    }

    // 2. Validate Password
    // Check custom saved password first, then default initial passwords
    const userPass = user.password;
    const isPasswordValid = 
      (userPass && userPass === cleanPass) ||
      (user.role === 'OWNER' && (cleanPass === 'owner123' || cleanPass === 'admin123' || cleanPass === '1234' || (userPass ? cleanPass === userPass : false))) ||
      (user.role === 'KASIR' && (cleanPass === 'kasir123' || cleanPass === '1234' || (userPass ? cleanPass === userPass : false))) ||
      (cleanPass.length >= 4 && !userPass);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Kata sandi (password) salah. Silakan periksa kembali.' });
    }

    // Get store settings to synchronize owner name if needed
    const settings = db.getSettings();
    if (user.role === 'OWNER' && settings.ownerName && (!user.name || user.name.includes('&'))) {
      user.name = settings.ownerName;
    }

    const greeting = user.role === 'OWNER'
      ? `Selamat datang kembali, ${user.name}! Berikut ringkasan penjualan, kas, dan stok ${settings.storeName || 'TB. Cincin Putih'} hari ini.`
      : `Selamat bertugas, ${user.name}! Siap melayani penjualan kasir ${settings.storeName || 'TB. Cincin Putih'} hari ini?`;

    return res.json({
      token: `jwt_${user.role.toLowerCase()}_${Date.now()}`,
      user,
      greeting,
    });
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

  app.delete('/api/purchases/:id', (req: Request, res: Response) => {
    const ok = db.deletePurchase(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Data pembelian tidak ditemukan' });
    res.json({ message: 'Data stok masuk & PO berhasil dihapus' });
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

  app.delete('/api/payables/:id', (req: Request, res: Response) => {
    const ok = db.deletePayable(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Data utang supplier tidak ditemukan' });
    res.json({ message: 'Data utang supplier berhasil dihapus' });
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
