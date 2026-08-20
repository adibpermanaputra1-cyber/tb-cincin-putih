import React from 'react';
import { User } from '../types';
import {
  Building2,
  LogOut,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  Sparkles,
  Clock,
  Menu,
  ShoppingCart,
  Boxes,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  greetingText?: string;
  onLogout: () => void;
  onResetDemo?: () => void;
  lowStockCount?: number;
  onNavigateToStock?: () => void;
  onToggleSidebar?: () => void;
  onOpenPOS?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  greetingText = 'Selamat Datang di Sistem Kasir & Penjualan TB. Cincin Putih',
  onLogout,
  onResetDemo,
  lowStockCount = 0,
  onNavigateToStock,
  onToggleSidebar,
  onOpenPOS,
}) => {
  const [timeStr, setTimeStr] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Dynamic Greeting Banner (Accurate Welcome Greeting) - Compact on Mobile */}
      <div className="bg-gradient-to-r from-emerald-900/90 via-slate-900 to-emerald-950 px-3 sm:px-4 py-1 border-b border-emerald-800/40 flex items-center justify-between text-[11px] sm:text-xs">
        <div className="flex items-center gap-1.5 text-emerald-300 font-medium truncate">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
          <span className="truncate">{greetingText}</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-400 text-[11px] shrink-0 font-mono">
          <span className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3 h-3 text-emerald-400" />
            {timeStr} WIB
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Toko Aktif
          </span>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="px-2.5 sm:px-6 py-2 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Brand, Mobile Hamburger & Store Name */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Hamburger Menu Toggle - Touch friendly min 44px */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden min-w-[40px] min-h-[40px] p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-650 text-slate-200 hover:text-white transition flex items-center justify-center cursor-pointer border border-slate-700/80"
              title="Buka Menu Lengkap"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 shrink-0">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-xs sm:text-base tracking-tight text-white leading-tight">
                TB. CINCIN PUTIH
              </span>
              <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                Kasir & Stok Toko
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
              Bahan Bangunan • Semen • Pasir • Besi • Cat • Alat Pertukangan
            </p>
          </div>
        </div>

        {/* Right side quick actions & profile */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Quick POS Shortcut Button - Always Visible & Touch-friendly */}
          {onOpenPOS && (
            <button
              onClick={onOpenPOS}
              className="min-h-[38px] flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-950/50 transition cursor-pointer"
              title="Buka Kasir POS Penjualan (Tekan keyboard F2)"
            >
              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs">Kasir</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-emerald-700/80 text-[10px] font-mono border border-emerald-500/40">
                F2
              </span>
            </button>
          )}

          {/* Low stock quick notification button */}
          {lowStockCount > 0 && onNavigateToStock && (
            <button
              onClick={onNavigateToStock}
              className="min-h-[38px] px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Klik untuk membuka barang stok menipis"
            >
              <Boxes className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">{lowStockCount}</span>
              <span className="hidden md:inline">Stok Menipis</span>
            </button>
          )}

          {/* Reset Demo Data Button (for Owner) */}
          {onResetDemo && (
            <button
              onClick={onResetDemo}
              title="Reset & Kelola Cadangan Data Toko"
              className="min-h-[38px] p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}

          {/* Standalone / Open Tab Button (For Full Bluetooth & Printing permissions) */}
          <button
            onClick={() => window.open(window.location.href, '_blank')}
            title="Buka di Tab Penuh untuk Akses Bluetooth & Cetak Maksimal"
            className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 active:scale-95 text-sky-300 hover:text-sky-200 border border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-[11px] sm:text-xs">Buka Tab Penuh</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-3 border-l border-slate-800">
            <div className="text-right hidden lg:block">
              <div className="text-xs font-bold text-white leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-400">
                {currentUser.email}
              </div>
            </div>

            <div
              className={`px-2 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 ${
                currentUser.role === 'OWNER'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              }`}
            >
              {currentUser.role === 'OWNER' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>OWNER</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>KASIR</span>
                </>
              )}
            </div>

            {/* Logout button in header */}
            <button
              onClick={onLogout}
              id="header-logout-btn"
              title="Keluar dari Sistem Kasir / Ganti Akun"
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white border border-rose-500/60 text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/60 active:scale-95"
            >
              <LogOut className="w-4 h-4 text-rose-200 shrink-0" />
              <span className="text-xs font-bold tracking-wide">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
