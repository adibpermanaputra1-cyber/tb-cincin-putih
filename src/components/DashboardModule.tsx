import React from 'react';
import { DashboardOverview, User, Product } from '../types';
import { formatRupiah, formatNumber } from '../lib/format';
import {
  TrendingUp,
  ShoppingBag,
  Boxes,
  FileSpreadsheet,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  Package,
  PlusCircle,
  Truck,
  Sparkles,
} from 'lucide-react';

interface DashboardModuleProps {
  overview: DashboardOverview;
  currentUser: User;
  onNavigate: (tab: string) => void;
  products: Product[];
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  overview,
  currentUser,
  onNavigate,
  products,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-6 rounded-3xl border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sistem Terintegrasi Toko Bangunan & POS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {getGreeting()}, {currentUser.name}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Berikut adalah ringkasan operasional toko, omset penjualan material, sisa piutang mandor, dan persediaan semen & besi hari ini.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate('pos')}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/80 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buka Kasir POS (F2)</span>
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              <Boxes className="w-4 h-4 text-emerald-400" />
              <span>Cek Stok Gudang</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Omset Hari Ini */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg relative">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400">Penjualan Hari Ini</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {formatRupiah(overview.todaySales)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Bulan Ini:</span>
            <span className="text-emerald-400 font-bold">{formatRupiah(overview.monthSales)}</span>
          </div>
        </div>

        {/* Laba Bersih Bulan Ini */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg relative">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400">Laba Bersih Bulan Ini</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold mt-2 ${overview.monthNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatRupiah(overview.monthNetProfit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Setelah HPP & Beban Operasional
          </div>
        </div>

        {/* Piutang Kasbon Pelanggan */}
        <div
          onClick={() => onNavigate('receivables')}
          className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg relative cursor-pointer hover:border-rose-500/40 transition"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400">Piutang Mandor / Kontraktor</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 mt-2">
            {formatRupiah(overview.totalReceivables)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Kasbon Belum Lunas</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
          </div>
        </div>

        {/* Utang ke Supplier Material */}
        <div
          onClick={() => onNavigate('payables')}
          className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg relative cursor-pointer hover:border-amber-500/40 transition"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400">Utang ke Supplier</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 mt-2">
            {formatRupiah(overview.totalPayables)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Tempo Pembelian Material</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

      </div>

      {/* Second Row: Stock Inventory Valuation & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Low Stock Alerts & Fast Action */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">
                Peringatan Stok Menipis ({lowStockProducts.length} Material)
              </h3>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Semua stok material bangunan masih di atas batas aman minimum.
              </div>
            ) : (
              lowStockProducts.slice(0, 5).map((p) => (
                <div key={p.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-white">{p.name}</div>
                    <div className="text-[11px] text-slate-400">
                      SKU: <span className="font-mono">{p.sku}</span> • Lokasi: {p.rackLocation || 'Gudang'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-400 text-sm">
                      Sisa {formatNumber(p.stock)} {p.baseUnit}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Batas Min: {p.minStock} {p.baseUnit}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Asset Value & Quick Navigation */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Boxes className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Valuasi Aset Fisik Toko</h3>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Material:</span>
                <span className="font-bold text-white">{overview.totalProducts} Jenis Produk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nilai Aset Modal (HPP):</span>
                <span className="font-bold text-emerald-400">{formatRupiah(overview.totalInventoryValue)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-[11px] text-slate-400 font-semibold block">Pintasan Cepat:</span>
            <button
              onClick={() => onNavigate('purchases')}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border border-slate-700 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                <span>Catat Pengiriman Supplier (PO)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigate('expenses')}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border border-slate-700 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-400" />
                <span>Catat Beban & Bensin Armada</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
