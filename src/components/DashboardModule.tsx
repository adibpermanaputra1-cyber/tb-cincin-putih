import React, { useState, useEffect } from 'react';
import { DashboardOverview, User, Product, StoreShift } from '../types';
import { formatRupiah, formatNumber } from '../lib/format';
import { api } from '../lib/api';
import { StoreBalanceModal } from './StoreBalanceModal';
import { ShiftModal } from './ShiftModal';
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
  MinusCircle,
  Truck,
  Sparkles,
  Eye,
  EyeOff,
  Clock,
  User as UserIcon,
  Wallet,
  Coins,
  Receipt,
  Store,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Lock,
  Unlock,
  Building,
  Info,
} from 'lucide-react';

interface DashboardModuleProps {
  overview: DashboardOverview;
  currentUser: User;
  onNavigate: (tab: string) => void;
  products: Product[];
  onRefresh?: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  overview,
  currentUser,
  onNavigate,
  products,
  onRefresh,
}) => {
  // State for Saldo Toko privacy toggle (Show / Mask)
  const [showBalance, setShowBalance] = useState<boolean>(true);
  
  // Modals state
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState<boolean>(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [shiftModalMode, setShiftModalMode] = useState<'OPEN' | 'CLOSE' | 'HISTORY'>('OPEN');

  // Dynamic live shift timer
  const [activeShift, setActiveShift] = useState<StoreShift | null>(overview.activeShift || null);
  const [shiftDuration, setShiftDuration] = useState<string>('0 jam 55 menit');
  const [storeBalanceVal, setStoreBalanceVal] = useState<number>(overview.storeBalance ?? 3749501);

  const fetchLatestOverview = async () => {
    try {
      const [curBal, curShift] = await Promise.all([
        api.getStoreBalance(),
        api.getActiveShift(),
      ]);
      setStoreBalanceVal(curBal);
      setActiveShift(curShift);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to refresh dashboard overview:', err);
    }
  };

  useEffect(() => {
    if (overview.storeBalance !== undefined) {
      setStoreBalanceVal(overview.storeBalance);
    }
    if (overview.activeShift !== undefined) {
      setActiveShift(overview.activeShift);
    }
  }, [overview]);

  // Live Timer for active shift
  useEffect(() => {
    if (!activeShift?.startTime || activeShift.status !== 'OPEN') return;

    const updateTimer = () => {
      const start = new Date(activeShift.startTime).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - start);
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setShiftDuration(`${hours} jam ${minutes} menit`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 10000);
    return () => clearInterval(interval);
  }, [activeShift]);

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  // Cash in drawer calculations
  const startingCash = activeShift ? activeShift.startingCash : 500000;
  const cashSalesToday = overview.todaySales ?? 100000;
  const cashExpensesToday = overview.todayExpenses ?? 0;
  const cashInDrawer = overview.cashInDrawerNow ?? (startingCash + cashSalesToday - cashExpensesToday);

  return (
    <div className="p-3 sm:p-6 space-y-5 max-w-7xl mx-auto">
      
      {/* Top Header & Store Branding (Matching Screenshot 1) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-900/80 p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                TB.CINCIN PUTIH
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Jl. Raya Wajok Hulu KM. 11,5 (Depan Nawa Perkasa)
            </p>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="flex items-center gap-3 bg-slate-950/70 px-4 py-2 rounded-2xl border border-slate-800">
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">{currentUser.name}</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {currentUser.role}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">@{currentUser.username || 'owner'}</span>
          </div>
        </div>
      </div>

      {/* TOP HERO SECTION: SALDO TOKO & SHIFT AKTIF (Matching User Request & Screenshots 1, 2, 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CARD 1: SALDO TOKO (Deep Purple / Indigo Card matching Screenshot 1 & 2) */}
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between border border-indigo-500/30 group">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-indigo-200">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-indigo-100">
                  Saldo Toko
                </span>
              </div>

              {/* Eye Privacy Toggle */}
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white transition cursor-pointer"
                title={showBalance ? 'Sembunyikan Saldo' : 'Tampilkan Saldo'}
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Big Balance Number */}
            <div className="py-1">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                {showBalance ? formatRupiah(storeBalanceVal) : '••••••••••••'}
              </div>
              <p className="text-[11px] text-indigo-200/80 mt-1">
                Akumulasi modal, laba penjualan, & kas operasional
              </p>
            </div>
          </div>

          {/* Action Buttons: Tanam Modal, Tarik Modal, & Detail */}
          <div className="pt-4 mt-2 border-t border-indigo-400/25 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBalanceModalOpen(true)}
              className="flex-1 bg-white hover:bg-slate-100 active:bg-slate-200 text-indigo-900 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>+ Tanam Modal</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBalanceModalOpen(true)}
              className="flex-1 bg-indigo-950/60 hover:bg-indigo-950/80 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-indigo-400/30 transition cursor-pointer"
            >
              <MinusCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>- Tarik Modal</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBalanceModalOpen(true)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Lihat Rincian Mutasi Saldo"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CARD 2: SHIFT AKTIF / BUKA TUTUP TOKO (Green Card matching Screenshot 1 & 3) */}
        <div
          onClick={() => {
            setShiftModalMode(activeShift ? 'CLOSE' : 'OPEN');
            setIsShiftModalOpen(true);
          }}
          className={`rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between border cursor-pointer transition transform active:scale-[0.99] ${
            activeShift
              ? 'bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 border-emerald-500/40 hover:border-emerald-400'
              : 'bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border-slate-700 hover:border-slate-600'
          }`}
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    activeShift ? 'bg-emerald-300 animate-ping' : 'bg-slate-500'
                  }`}
                />
                <span className="text-xs sm:text-sm font-bold text-emerald-100">
                  {activeShift ? '● Shift Aktif' : 'Kasir Tutup'}
                </span>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white/15 text-white">
                {activeShift ? 'BUKA' : 'TUTUP'}
              </span>
            </div>

            {/* Live Shift Duration & Cashier */}
            <div className="py-1">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {activeShift ? shiftDuration : 'Shift Belum Dimulai'}
              </div>
              <div className="text-xs text-emerald-100/90 mt-1 flex items-center gap-2">
                <span>Kas Awal: {formatRupiah(activeShift ? activeShift.startingCash : 500000)}</span>
                {activeShift && (
                  <>
                    <span>•</span>
                    <span className="font-semibold">{activeShift.cashierName}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Tap Prompt (Matching Screenshot 1) */}
          <div className="pt-3 mt-2 border-t border-emerald-400/25 flex items-center justify-between text-xs font-semibold text-emerald-100">
            <div className="flex items-center gap-1.5">
              {activeShift ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-300" />
                  <span>👆 Tap untuk tutup kasir</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-300" />
                  <span>👆 Tap untuk mulai shift kasir</span>
                </>
              )}
            </div>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* SECTION: RINGKASAN HARI INI (Matching Screenshot 1 Layout) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
            <span>Ringkasan Hari Ini</span>
            <span className="text-xs font-normal text-slate-400">
              ({new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})
            </span>
          </h2>
          <button
            onClick={() => onNavigate('pos')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Buka Kasir POS (F2)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1 Big Teal Card: Uang di Kasir Sekarang */}
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 p-5 rounded-2xl border border-teal-600/40 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="text-xs font-bold text-teal-300">
              Uang di Kasir Sekarang (Fisik Laci)
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {formatRupiah(cashInDrawer)}
            </div>
            <div className="text-[11px] text-teal-200/80 mt-0.5">
              Kas Awal ({formatRupiah(startingCash)}) + Penjualan Tunai Hari Ini ({formatRupiah(cashSalesToday)})
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>{activeShift ? '1 kasir aktif' : 'Kasir tidak aktif'}</span>
          </div>
        </div>

        {/* 4 Cards Grid: Penjualan, Transaksi, Stok Menipis, Pengeluaran (Screenshot 1) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card A: Penjualan Hari Ini (Emerald) */}
          <div
            onClick={() => onNavigate('reports')}
            className="bg-slate-900 hover:bg-slate-850 p-4 rounded-2xl border border-emerald-500/30 shadow-lg cursor-pointer transition"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400">Penjualan</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-2">
              {formatRupiah(overview.todaySales)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Omset masuk hari ini
            </div>
          </div>

          {/* Card B: Transaksi (Blue) */}
          <div
            onClick={() => onNavigate('reports')}
            className="bg-slate-900 hover:bg-slate-850 p-4 rounded-2xl border border-blue-500/30 shadow-lg cursor-pointer transition"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400">Transaksi</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-blue-400 mt-2">
              {overview.todayTransactionsCount ?? 2} transaksi
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Nota kasir tercetak
            </div>
          </div>

          {/* Card C: Stok Menipis (Orange) */}
          <div
            onClick={() => onNavigate('inventory')}
            className="bg-slate-900 hover:bg-slate-850 p-4 rounded-2xl border border-amber-500/30 shadow-lg cursor-pointer transition"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400">Stok Menipis</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-amber-400 mt-2">
              {lowStockProducts.length} produk
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Perlu order ulang (PO)
            </div>
          </div>

          {/* Card D: Pengeluaran (Red) */}
          <div
            onClick={() => onNavigate('expenses')}
            className="bg-slate-900 hover:bg-slate-850 p-4 rounded-2xl border border-rose-500/30 shadow-lg cursor-pointer transition"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400">Pengeluaran</span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-rose-400 mt-2">
              {formatRupiah(overview.todayExpenses ?? 0)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Beban kasir & armada
            </div>
          </div>

        </div>
      </div>

      {/* ADDITIONAL OPERATIONAL SECTIONS: Piutang Mandor, Utang Supplier, Valuasi Stok */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
        
        {/* Piutang Mandor / Kasbon */}
        <div
          onClick={() => onNavigate('receivables')}
          className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl cursor-pointer hover:border-rose-500/50 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400">Piutang Mandor / Kontraktor</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-rose-400 mt-2">
              {formatRupiah(overview.totalReceivables)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Kasbon material belum tertagih
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between text-xs text-rose-400 font-semibold">
            <span>Buka Buku Piutang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Utang Supplier Material */}
        <div
          onClick={() => onNavigate('payables')}
          className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl cursor-pointer hover:border-amber-500/50 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400">Utang ke Supplier</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-400 mt-2">
              {formatRupiah(overview.totalPayables)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tempo jatuh tempo pembelian material
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between text-xs text-amber-400 font-semibold">
            <span>Buka Buku Utang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Valuasi Aset Stok Gudang */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl cursor-pointer hover:border-emerald-500/50 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400">Valuasi Aset Stok Fisik</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-2">
              {formatRupiah(overview.totalInventoryValue)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Nilai modal {overview.totalProducts} jenis barang & material
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span>Lihat Gudang & Kartu Stok</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

      {/* MODALS */}
      <StoreBalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        currentUser={currentUser}
        onBalanceUpdated={fetchLatestOverview}
      />

      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        currentUser={currentUser}
        initialMode={shiftModalMode}
        onShiftUpdated={fetchLatestOverview}
      />

    </div>
  );
};
