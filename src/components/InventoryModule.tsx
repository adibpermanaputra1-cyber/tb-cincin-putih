import React, { useState, useMemo } from 'react';
import { Product, StockMovement, User, Role, UnitConversion } from '../types';
import { formatRupiah, formatNumber, formatIndonesianDate } from '../lib/format';
import { api } from '../lib/api';
import {
  Boxes,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  History,
  CheckCircle2,
  Package,
  Layers,
  ArrowUpDown,
  Filter,
  X,
  Loader2,
} from 'lucide-react';

interface InventoryModuleProps {
  products: Product[];
  currentUser: User;
  onRefresh: () => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  products,
  currentUser,
  onRefresh,
}) => {
  const isOwner = currentUser.role === 'OWNER';
  const [activeSubTab, setActiveSubTab] = useState<'MASTER' | 'LEDGER'>('MASTER');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('SEMUA');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Stock Movement Ledger State
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [selectedProductFilter, setSelectedProductFilter] = useState('');

  // Modals State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [recentlySavedId, setRecentlySavedId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<
    'PENYESUAIAN_PLUS' | 'PENYESUAIAN_MINUS' | 'BARANG_RUSAK' | 'RETUR'
  >('PENYESUAIAN_PLUS');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Form State for Add / Edit Product
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Semen & Pasir');
  const [baseUnit, setBaseUnit] = useState('Sak');
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(10);
  const [rackLocation, setRackLocation] = useState('');
  const [description, setDescription] = useState('');
  const [units, setUnits] = useState<UnitConversion[]>([]);

  // Multi-unit temp input
  const [tempUnitName, setTempUnitName] = useState('');
  const [tempMultiplier, setTempMultiplier] = useState<number>(1);
  const [tempUnitPrice, setTempUnitPrice] = useState<number>(0);
  const [tempBuyPrice, setTempBuyPrice] = useState<number>(0);

  // Load Stock Movements when switching to ledger
  const loadLedger = async () => {
    setLedgerLoading(true);
    try {
      const data = await api.getStockMovements();
      setStockMovements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['SEMUA', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'SEMUA' || p.category === selectedCategory;
      const matchLow = onlyLowStock ? p.stock <= p.minStock : true;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.rackLocation && p.rackLocation.toLowerCase().includes(q));
      return matchCat && matchLow && matchSearch;
    });
  }, [products, selectedCategory, onlyLowStock, searchQuery]);

  const filteredLedger = useMemo(() => {
    return stockMovements.filter((m) => {
      if (selectedProductFilter && m.productId !== selectedProductFilter) return false;
      return true;
    });
  }, [stockMovements, selectedProductFilter]);

  // Open Add Product Modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormError(null);
    setSku(`MAT-${Date.now().toString().slice(-4)}`);
    setBarcode('');
    setName('');
    setCategory('Semen & Pasir');
    setBaseUnit('Sak');
    setBuyPrice(0);
    setSellPrice(0);
    setWholesalePrice(0);
    setStock(0);
    setMinStock(10);
    setRackLocation('Gudang Utama');
    setDescription('');
    setUnits([]);
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setFormError(null);
    setSku(p.sku);
    setBarcode(p.barcode || '');
    setName(p.name);
    setCategory(p.category);
    setBaseUnit(p.baseUnit);
    setBuyPrice(p.buyPrice);
    setSellPrice(p.sellPrice);
    setWholesalePrice(p.wholesalePrice || 0);
    setStock(p.stock);
    setMinStock(p.minStock);
    setRackLocation(p.rackLocation || '');
    setDescription(p.description || '');
    setUnits(p.units || []);
    setIsProductModalOpen(true);
  };

  // Add Multi-unit to form list
  const handleAddUnitConversion = () => {
    if (!tempUnitName.trim() || tempMultiplier <= 0 || tempUnitPrice <= 0) {
      setFormError('Harap lengkapi nama satuan turunan, angka pengali (>0), dan harga jualnya!');
      return;
    }
    setFormError(null);
    const newUnit: UnitConversion = {
      unitName: tempUnitName.trim(),
      multiplier: tempMultiplier,
      price: tempUnitPrice,
      buyPrice: tempBuyPrice || buyPrice * tempMultiplier,
    };
    setUnits([...units, newUnit]);
    setTempUnitName('');
    setTempMultiplier(1);
    setTempUnitPrice(0);
    setTempBuyPrice(0);
  };

  const handleRemoveUnitConversion = (idx: number) => {
    setUnits(units.filter((_, i) => i !== idx));
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = name.trim();
    const cleanSku = (sku.trim() || `MAT-${Date.now().toString().slice(-4)}`).toUpperCase();

    if (!cleanName) {
      setFormError('Nama material/barang wajib diisi!');
      return;
    }

    if (sellPrice <= 0) {
      setFormError('Harga jual retail wajib diisi (tidak boleh Rp 0)!');
      return;
    }

    setIsSavingProduct(true);

    try {
      const payload = {
        sku: cleanSku,
        barcode: barcode.trim() || undefined,
        name: cleanName,
        category: category || 'Semen & Pasir',
        baseUnit: baseUnit.trim() || 'Pcs',
        buyPrice: Number(buyPrice) || 0,
        sellPrice: Number(sellPrice) || 0,
        wholesalePrice: wholesalePrice ? Number(wholesalePrice) : undefined,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 5,
        rackLocation: rackLocation.trim() || undefined,
        units,
        description: description.trim() || undefined,
        isActive: true,
      };

      let savedProduct: Product;
      if (editingProduct) {
        savedProduct = await api.updateProduct(editingProduct.id, payload);
      } else {
        savedProduct = await api.createProduct(payload);
      }

      // Immediately persist to local cache first so UI never loses it
      try {
        const cached = localStorage.getItem('tb_cache_products');
        const list: Product[] = cached ? JSON.parse(cached) : [];
        const existingIdx = list.findIndex((x) => x.id === savedProduct.id);
        if (existingIdx !== -1) {
          list[existingIdx] = savedProduct;
        } else {
          list.unshift(savedProduct);
        }
        localStorage.setItem('tb_cache_products', JSON.stringify(list));
      } catch (err) {
        console.error('LocalStorage product save error:', err);
      }

      // Automatically reset category/search so the newly saved item is immediately visible
      setSelectedCategory('SEMUA');
      setSearchQuery('');
      setOnlyLowStock(false);
      setRecentlySavedId(savedProduct.id);
      setSuccessToast(`Material "${cleanName}" berhasil ${editingProduct ? 'diperbarui' : 'ditambahkan ke katalog'}!`);

      // Refresh master data across entire app
      onRefresh();
      setIsProductModalOpen(false);

      // Clear highlight after 6 seconds
      setTimeout(() => {
        setRecentlySavedId((prev) => (prev === savedProduct.id ? null : prev));
      }, 6000);
      setTimeout(() => {
        setSuccessToast((prev) => (prev?.includes(cleanName) ? null : prev));
      }, 5000);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data barang. Periksa koneksi atau format input.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Delete Product
  const handleConfirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    setIsDeletingProduct(true);
    try {
      await api.deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus produk');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Open Stock Adjustment Modal
  const handleOpenAdjust = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustQty(0);
    setAdjustType('PENYESUAIAN_PLUS');
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjustQty === 0) {
      alert('Masukkan jumlah perubahan stok (tidak boleh 0)!');
      return;
    }

    const realQtyChange =
      adjustType === 'PENYESUAIAN_MINUS' || adjustType === 'BARANG_RUSAK'
        ? -Math.abs(adjustQty)
        : Math.abs(adjustQty);

    try {
      await api.adjustStock({
        productId: adjustingProduct.id,
        quantityChange: realQtyChange,
        type: adjustType,
        notes: adjustNotes || 'Penyesuaian Fisik Gudang / Opname',
        createdBy: currentUser.name,
      });

      setIsAdjustModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menyesuaikan stok');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-400" />
            {isOwner ? 'Manajemen Inventaris & Stok Material' : 'Katalog & Cek Stok Material'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pantau ketersediaan semen, besi, pasir, cat, pipa dan kartu mutasi stok secara real-time.
          </p>
        </div>

        {/* Action Controls & Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {isOwner && (
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveSubTab('MASTER')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  activeSubTab === 'MASTER'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Katalog Produk
              </button>
              <button
                onClick={() => {
                  setActiveSubTab('LEDGER');
                  loadLedger();
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  activeSubTab === 'LEDGER'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Kartu Stok (Ledger)</span>
              </button>
            </div>
          )}

          {activeSubTab === 'MASTER' && (
            <button
              onClick={handleOpenAddProduct}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Material Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Banner Notification */}
      {successToast && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="text-base">✅</span>
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* MASTER DATA VIEW */}
      {activeSubTab === 'MASTER' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari SKU, Nama Barang, Lokasi Rak..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* Category Filter & Low Stock Toggle */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    Kategori: {cat}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border cursor-pointer ${
                  onlyLowStock
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Hanya Stok Menipis</span>
              </button>
            </div>
          </div>

          {/* Master Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">SKU / Kode</th>
                    <th className="p-3.5">Nama Material</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Satuan & Konversi</th>
                    {isOwner && <th className="p-3.5 text-right">Harga Beli (HPP)</th>}
                    <th className="p-3.5 text-right">Harga Jual Retail</th>
                    <th className="p-3.5 text-center">Stok Fisik</th>
                    <th className="p-3.5">Lokasi Rak</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        Tidak ada data material yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isLow = p.stock <= p.minStock;
                      const isOut = p.stock <= 0;
                      const isRecentlySaved = p.id === recentlySavedId;

                      return (
                        <tr
                          key={p.id}
                          className={`transition ${
                            isRecentlySaved
                              ? 'bg-emerald-950/40 border-l-4 border-l-emerald-400 ring-1 ring-emerald-500/30'
                              : 'hover:bg-slate-850/50'
                          }`}
                        >
                          <td className="p-3.5 font-mono font-bold text-slate-300">
                            <div className="flex items-center gap-1.5">
                              {p.sku}
                              {isRecentlySaved && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500 text-slate-950 rounded-md animate-pulse">
                                  BARU
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 font-bold text-white max-w-xs">
                            <div>{p.name}</div>
                            {p.description && (
                              <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                                {p.description}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-3.5 text-[11px] text-slate-300">
                            <div className="font-semibold text-emerald-400">{p.baseUnit} (Utama)</div>
                            {p.units && p.units.length > 0 && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {p.units
                                  .filter((u) => u.unitName !== p.baseUnit)
                                  .map((u) => `${u.unitName} (${u.multiplier}x)`)
                                  .join(', ')}
                              </div>
                            )}
                          </td>

                          {isOwner && (
                            <td className="p-3.5 text-right font-medium text-slate-400">
                              {formatRupiah(p.buyPrice)}
                            </td>
                          )}

                          <td className="p-3.5 text-right font-bold text-emerald-400">
                            {formatRupiah(p.sellPrice)}
                            {p.wholesalePrice && (
                              <div className="text-[10px] text-amber-400 font-normal">
                                Grosir: {formatRupiah(p.wholesalePrice)}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5 text-center">
                            <span
                              className={`inline-block font-bold px-2.5 py-1 rounded-lg text-xs ${
                                isOut
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : isLow
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-500/15 text-emerald-300'
                              }`}
                            >
                              {formatNumber(p.stock)} {p.baseUnit}
                            </span>
                            {isLow && !isOut && (
                              <div className="text-[10px] text-amber-400 mt-0.5">
                                Min: {p.minStock}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {p.rackLocation || '-'}
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Stock Adjust button */}
                              <button
                                onClick={() => handleOpenAdjust(p)}
                                title="Koreksi / Penyesuaian Stok"
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center border border-slate-700/50"
                              >
                                <ArrowUpDown className="w-4 h-4" />
                              </button>

                              {isOwner && (
                                <>
                                  <button
                                    onClick={() => handleOpenEditProduct(p)}
                                    title="Edit Data Material"
                                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center border border-slate-700/50"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => setDeletingProduct(p)}
                                    title="Hapus Material"
                                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center border border-slate-700/50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* KARTU STOK (STOCK MOVEMENT LEDGER) */}
      {activeSubTab === 'LEDGER' && isOwner && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">
                Buku Mutasi Keluar-Masuk Barang Real-time
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedProductFilter}
                onChange={(e) => setSelectedProductFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 w-full sm:w-64"
              >
                <option value="">Semua Material Bangunan</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Tanggal & Waktu</th>
                    <th className="p-3.5">Nama Material</th>
                    <th className="p-3.5">Tipe Mutasi</th>
                    <th className="p-3.5 text-right">Stok Awal</th>
                    <th className="p-3.5 text-center">Perubahan (+/-)</th>
                    <th className="p-3.5 text-right">Saldo Akhir</th>
                    <th className="p-3.5">No. Referensi</th>
                    <th className="p-3.5">Keterangan</th>
                    <th className="p-3.5">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {ledgerLoading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Memuat data mutasi stok...
                      </td>
                    </tr>
                  ) : filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        Belum ada catatan mutasi stok untuk filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((m) => {
                      const isPositive = m.quantityChange > 0;
                      return (
                        <tr key={m.id} className="hover:bg-slate-850/50 transition">
                          <td className="p-3.5 text-slate-400 whitespace-nowrap">
                            {formatIndonesianDate(m.date)}
                          </td>
                          <td className="p-3.5 font-bold text-white">
                            {m.productName}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                m.type === 'PENJUALAN'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : m.type === 'PEMBELIAN'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : m.type === 'BARANG_RUSAK'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-purple-500/20 text-purple-300'
                              }`}
                            >
                              {m.type}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-medium text-slate-400">
                            {formatNumber(m.previousStock)}
                          </td>
                          <td className="p-3.5 text-center font-bold">
                            <span
                              className={isPositive ? 'text-emerald-400' : 'text-rose-400'}
                            >
                              {isPositive ? `+${formatNumber(m.quantityChange)}` : formatNumber(m.quantityChange)}{' '}
                              {m.unitName}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-bold text-white">
                            {formatNumber(m.resultingStock)} {m.unitName}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-400">
                            {m.referenceNo || '-'}
                          </td>
                          <td className="p-3.5 text-slate-300 max-w-xs truncate">
                            {m.notes}
                          </td>
                          <td className="p-3.5 text-slate-400">
                            {m.createdBy}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-8">
            <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-base text-white">
                {editingProduct ? 'Edit Master Data Material' : 'Tambah Material Bangunan Baru'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="bg-rose-500/20 border border-rose-500/60 text-rose-200 p-3.5 rounded-xl text-xs flex items-start gap-2.5 shadow-lg">
                  <span className="text-lg leading-none font-bold text-rose-400">⚠️</span>
                  <div>
                    <p className="font-bold text-rose-300">Belum Bisa Disimpan:</p>
                    <p className="mt-0.5">{formError}</p>
                  </div>
                </div>
              )}

              {/* Tips Format Ukuran Toko Bangunan */}
              <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-[11px] text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-slate-400">
                  💡 <strong className="text-emerald-400">Tips Penulisan Ukuran & Inci:</strong> Gunakan tanda kutip dua (<code className="text-amber-300 font-bold bg-slate-900 px-1 py-0.5 rounded">"</code>) atau kata <code className="text-amber-300 font-bold bg-slate-900 px-1 py-0.5 rounded">Dim</code> / <code className="text-amber-300 font-bold bg-slate-900 px-1 py-0.5 rounded">Inch</code>.
                </span>
                <span className="text-slate-400">
                  Contoh: <span className="text-white font-medium">Paku Kayu 1 1/2"</span> atau <span className="text-white font-medium">Paku 1.5 Inch</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Kode SKU Material *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. SMN-GRS-50"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Kategori Material *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Semen & Pasir">Semen & Pasir</option>
                    <option value="Besi & Baja">Besi & Baja</option>
                    <option value="Kayu & Triplek">Kayu & Triplek</option>
                    <option value="Cat & Kimia">Cat & Kimia</option>
                    <option value="Pipa & Sanitari">Pipa & Sanitari</option>
                    <option value="Keramik & Lantai">Keramik & Lantai</option>
                    <option value="Atap & Plafon">Atap & Plafon</option>
                    <option value="Alat & Hardware">Alat & Hardware</option>
                    <option value="Listrik">Listrik & Kabel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Nama Lengkap Material *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Semen Gresik PPC 50 Kg"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Satuan Utama (Base Unit) *
                  </label>
                  <input
                    type="text"
                    required
                    value={baseUnit}
                    onChange={(e) => setBaseUnit(e.target.value)}
                    placeholder="Sak / Batang / Kubik / Kaleng"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Harga Beli HPP (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={buyPrice || ''}
                    onChange={(e) => setBuyPrice(Number(e.target.value) || 0)}
                    placeholder="Modal toko"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Harga Jual Retail (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={sellPrice || ''}
                    onChange={(e) => setSellPrice(Number(e.target.value) || 0)}
                    placeholder="Harga jual umum"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Harga Grosir / Tukang (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={wholesalePrice || ''}
                    onChange={(e) => setWholesalePrice(Number(e.target.value) || 0)}
                    placeholder="Harga potongan tukang"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Stok Saat Ini ({baseUnit}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Batas Peringatan Minimum
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Lokasi Rak / Gudang Penyimpanan
                </label>
                <input
                  type="text"
                  value={rackLocation}
                  onChange={(e) => setRackLocation(e.target.value)}
                  placeholder="e.g. Gudang Utama - Pallet A1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Multi-Satuan Builder Section */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-400">
                    Konfigurasi Multi-Satuan / Satuan Turunan
                  </span>
                  <span className="text-[11px] text-slate-400">
                    e.g. 1 Truk = 160 Sak @Rp 10.800.000
                  </span>
                </div>

                {units.length > 0 && (
                  <div className="space-y-1.5">
                    {units.map((u, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex justify-between items-center text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">{u.unitName}</span>
                          <span className="text-slate-400 text-[11px] ml-2">
                            (1 {u.unitName} = {u.multiplier} {baseUnit})
                          </span>
                          <span className="text-emerald-400 font-semibold ml-3">
                            Jual: {formatRupiah(u.price)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveUnitConversion(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Sub-unit Inputs */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <input
                      type="text"
                      placeholder="Nama Satuan (e.g. Truk)"
                      value={tempUnitName}
                      onChange={(e) => setTempUnitName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder={`Pengali (x ${baseUnit})`}
                      value={tempMultiplier || ''}
                      onChange={(e) => setTempMultiplier(Number(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Harga Jual Satuan Ini"
                      value={tempUnitPrice || ''}
                      onChange={(e) => setTempUnitPrice(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-bold outline-none"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddUnitConversion}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold py-1.5 rounded-lg border border-slate-700"
                    >
                      + Tambah Satuan
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isSavingProduct}
                  onClick={() => setIsProductModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center gap-2"
                >
                  {isSavingProduct && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{isSavingProduct ? 'Menyimpan...' : 'Simpan Material'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STOCK ADJUSTMENT (KOREKSI STOK / BARANG RUSAK) */}
      {isAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">Penyesuaian Fisik / Koreksi Stok</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="p-5 space-y-4 text-xs">
              <div>
                <p className="text-slate-400">Material:</p>
                <p className="font-bold text-white text-sm">{adjustingProduct.name}</p>
                <p className="text-emerald-400 font-medium mt-0.5">
                  Stok saat ini di sistem: {adjustingProduct.stock} {adjustingProduct.baseUnit}
                </p>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Tipe Mutasi *</label>
                <select
                  value={adjustType}
                  onChange={(e: any) => setAdjustType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                >
                  <option value="PENYESUAIAN_PLUS">Penyesuaian Tambah (+) / Koreksi Opname</option>
                  <option value="PENYESUAIAN_MINUS">Penyesuaian Kurang (-) / Selisih Hilang</option>
                  <option value="BARANG_RUSAK">Barang Rusak / Pecah / Kadaluarsa (-)</option>
                  <option value="RETUR">Retur Material dari Pelanggan (+)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Jumlah Perubahan ({adjustingProduct.baseUnit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty || ''}
                  onChange={(e) => setAdjustQty(Number(e.target.value) || 0)}
                  placeholder="e.g. 5"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Alasan / Catatan *</label>
                <input
                  type="text"
                  required
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Hasil Stock Opname Fisik Gudang / Sak Semen Robek"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Proses Koreksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE PRODUCT CONFIRMATION */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-slate-100">
            <div className="p-5 bg-rose-950/30 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Hapus Material Bangunan?</h3>
                <p className="text-xs text-slate-400">Data master barang ini akan dihapus dari katalog toko.</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">SKU / Kode:</span>
                  <span className="font-mono text-slate-200 font-semibold">{deletingProduct.sku}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Nama Barang:</span>
                  <span className="font-bold text-white text-right">{deletingProduct.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Kategori:</span>
                  <span className="text-slate-300">{deletingProduct.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Sisa Stok Fisik:</span>
                  <span className="font-bold text-amber-400">{deletingProduct.stock} {deletingProduct.baseUnit}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={isDeletingProduct}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={isDeletingProduct}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-950/50 transition cursor-pointer"
              >
                {isDeletingProduct ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Barang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
