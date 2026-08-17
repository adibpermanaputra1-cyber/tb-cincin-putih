import React from 'react';
import { Role } from '../types';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  FileSpreadsheet,
  CreditCard,
  ReceiptText,
  LineChart,
  Users,
  Settings,
  Lock,
  X,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'purchases'
  | 'receivables'
  | 'payables'
  | 'expenses'
  | 'reports'
  | 'users'
  | 'settings';

interface SidebarProps {
  currentRole: Role;
  activeTab: string;
  onTabChange?: (tab: string) => void;
  onSelectTab?: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  pendingReceivablesCount?: number;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  onSelectTab,
  isOpen = false,
  onClose,
  pendingReceivablesCount = 0,
  lowStockCount = 0,
}) => {
  const isOwner = currentRole === 'OWNER';

  const handleTabClick = (tabId: string) => {
    if (onTabChange) onTabChange(tabId);
    if (onSelectTab) onSelectTab(tabId);
    if (onClose) onClose();
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Keuangan',
      icon: LayoutDashboard,
      ownerOnly: true,
      badge: null,
      color: 'text-emerald-400',
    },
    {
      id: 'pos',
      label: 'Kasir POS Penjualan (F2)',
      icon: ShoppingCart,
      ownerOnly: false,
      badge: 'Utama',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      color: 'text-emerald-400',
    },
    {
      id: 'inventory',
      label: isOwner ? 'Inventaris & Kartu Stok' : 'Cek Stok Material',
      icon: Boxes,
      ownerOnly: false,
      badge: lowStockCount > 0 ? `${lowStockCount} Menipis` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      color: 'text-amber-400',
    },
    {
      id: 'purchases',
      label: 'Stok Masuk & PO Supplier',
      icon: Truck,
      ownerOnly: true,
      badge: null,
      color: 'text-blue-400',
    },
    {
      id: 'receivables',
      label: 'Buku Piutang (Kasbon)',
      icon: FileSpreadsheet,
      ownerOnly: true,
      badge: pendingReceivablesCount > 0 ? `${pendingReceivablesCount} Kasbon` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      color: 'text-rose-400',
    },
    {
      id: 'payables',
      label: 'Buku Utang Supplier',
      icon: CreditCard,
      ownerOnly: true,
      badge: null,
      color: 'text-purple-400',
    },
    {
      id: 'expenses',
      label: 'Beban Operasional',
      icon: ReceiptText,
      ownerOnly: true,
      badge: null,
      color: 'text-orange-400',
    },
    {
      id: 'reports',
      label: 'Laporan Laba Rugi & Kas',
      icon: LineChart,
      ownerOnly: true,
      badge: 'Keuangan',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      color: 'text-teal-400',
    },
    {
      id: 'users',
      label: 'Manajemen Karyawan',
      icon: Users,
      ownerOnly: true,
      badge: null,
      color: 'text-indigo-400',
    },
    {
      id: 'settings',
      label: 'Pengaturan Rekening & Toko',
      icon: Settings,
      ownerOnly: true,
      badge: 'Bank/QRIS',
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      color: 'text-blue-400',
    },
  ];

  const sidebarContent = (
    <aside className="w-full sm:w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-full min-h-[calc(100vh-80px)] z-30">
      {/* Role Navigation Info */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {isOwner ? 'Menu Utama Owner' : 'Menu Kasir POS'}
          </div>
        </div>

        {/* Mobile close button - Large touch target */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden min-w-[36px] min-h-[36px] p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List with generous touch targets */}
      <nav className="flex-1 p-2 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isRestricted = item.ownerOnly && !isOwner;
          const isActive = activeTab.toLowerCase() === item.id.toLowerCase();
          const Icon = item.icon;

          if (isRestricted) {
            return (
              <div
                key={item.id}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs text-slate-500 bg-slate-950/40 opacity-60 cursor-not-allowed border border-transparent"
                title="Fitur ini khusus hak akses Owner (Login sebagai Owner untuk membuka)"
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-[10px] text-slate-600">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Owner</span>
                </div>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 border-emerald-500'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Store Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex justify-between items-center text-slate-300">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Sistem Database:
          </span>
          <span className="font-semibold text-emerald-400 font-mono">Aktif</span>
        </div>
        <div className="text-[10px] text-slate-400 leading-tight">
          Sentuh menu di atas untuk berpindah modul kapan saja.
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block shrink-0">{sidebarContent}</div>

      {/* Mobile Drawer with Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-slate-900 shadow-2xl border-r border-slate-800 animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
