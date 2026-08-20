import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Product,
  Supplier,
  PurchaseOrder,
  Customer,
  SaleTransaction,
  CustomerReceivable,
  SupplierPayable,
  Expense,
  StoreSettings,
  DashboardOverview,
} from './types';
import { api } from './lib/api';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { POSModule } from './components/POSModule';
import { InventoryModule } from './components/InventoryModule';
import { PurchasesModule } from './components/PurchasesModule';
import { ReceivablesModule } from './components/ReceivablesModule';
import { PayablesModule } from './components/PayablesModule';
import { ExpensesModule } from './components/ExpensesModule';
import { ReportsModule } from './components/ReportsModule';
import { DashboardModule } from './components/DashboardModule';
import { UsersModule } from './components/UsersModule';
import { SettingsModule } from './components/SettingsModule';
import { ResetDemoModal } from './components/ResetDemoModal';
import { Loader2, CheckCircle2, AlertCircle, X, ShoppingCart, Boxes, LayoutDashboard, FileSpreadsheet, Menu } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tb_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset Demo Modal & Visibility Setting
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [hideResetDemo, setHideResetDemo] = useState<boolean>(() => {
    return localStorage.getItem('tb_hide_reset_demo') === 'true';
  });

  // Global In-App Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const handleToggleHideResetDemo = (hide: boolean) => {
    setHideResetDemo(hide);
    localStorage.setItem('tb_hide_reset_demo', hide ? 'true' : 'false');
    showToast(hide ? 'Tombol Reset Demo disembunyikan dari header' : 'Tombol Reset Demo ditampilkan di header');
  };

  // App Master Data States with LocalStorage Initial Fallback
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('tb_cache_products');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const cached = localStorage.getItem('tb_cache_suppliers');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [receivables, setReceivables] = useState<CustomerReceivable[]>([]);
  const [payables, setPayables] = useState<SupplierPayable[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(() => {
    try {
      const cached = localStorage.getItem('tb_cache_settings');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState<User[]>([]);
  const [overview, setOverview] = useState<DashboardOverview>({
    todaySales: 0,
    monthSales: 0,
    monthNetProfit: 0,
    totalReceivables: 0,
    totalPayables: 0,
    totalProducts: 0,
    totalInventoryValue: 0,
  });

  // Fetch all live data from backend API with cache updates and retry
  const refreshAllData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [
        prodsData,
        supsData,
        purchsData,
        custsData,
        salesData,
        recsData,
        paysData,
        expsData,
        setsData,
        ovData,
        usersData,
      ] = await Promise.all([
        api.getProducts().catch(() => null),
        api.getSuppliers().catch(() => null),
        api.getPurchases().catch(() => null),
        api.getCustomers().catch(() => null),
        api.getSales().catch(() => null),
        api.getReceivables().catch(() => null),
        api.getPayables().catch(() => null),
        api.getExpenses().catch(() => null),
        api.getSettings().catch(() => null),
        api.getDashboardOverview().catch(() => null),
        currentUser.role === 'OWNER' ? api.getUsers().catch(() => null) : Promise.resolve([]),
      ]);

      if (prodsData && Array.isArray(prodsData) && prodsData.length > 0) {
        setProducts(prodsData);
        localStorage.setItem('tb_cache_products', JSON.stringify(prodsData));
      } else if (prodsData && Array.isArray(prodsData)) {
        // If server returns empty list, only update if there's no cache
        const cached = localStorage.getItem('tb_cache_products');
        if (!cached || JSON.parse(cached).length === 0) {
          setProducts(prodsData);
        }
      }

      if (supsData && Array.isArray(supsData)) {
        setSuppliers(supsData);
        localStorage.setItem('tb_cache_suppliers', JSON.stringify(supsData));
      }
      if (purchsData && Array.isArray(purchsData)) setPurchases(purchsData);
      if (custsData && Array.isArray(custsData)) setCustomers(custsData);
      if (salesData && Array.isArray(salesData)) setSales(salesData);
      if (recsData && Array.isArray(recsData)) setReceivables(recsData);
      if (paysData && Array.isArray(paysData)) setPayables(paysData);
      if (expsData && Array.isArray(expsData)) setExpenses(expsData);
      if (setsData) {
        setSettings(setsData);
        localStorage.setItem('tb_cache_settings', JSON.stringify(setsData));
      }
      if (ovData) setOverview(ovData);
      if (usersData && Array.isArray(usersData)) setUsers(usersData);
    } catch (err) {
      console.error('Error loading app data:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshAllData();
    }
  }, [currentUser, refreshAllData]);

  // Global Keyboard Shortcuts (F2 for POS, F1 for Dashboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('pos');
      } else if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('tb_user', JSON.stringify(user));
    // Kasir directly opens POS by default
    if (user.role === 'KASIR') {
      setActiveTab('pos');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tb_user');
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleResetDemoSuccess = (msg: string) => {
    refreshAllData();
    showToast(msg, 'success');
  };

  // If not authenticated, render Login Portal
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const pendingReceivablesCount = receivables.filter((r) => r.remainingAmount > 0).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Toast Notification Floating Banner */}
      {toastMessage && (
        <div className="fixed top-3 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-3 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/30'
                : 'bg-rose-950/95 border-rose-500 text-rose-200 ring-2 ring-rose-500/30'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onResetDemo={!hideResetDemo && currentUser.role === 'OWNER' ? () => setIsResetModalOpen(true) : undefined}
        lowStockCount={lowStockCount}
        onNavigateToStock={() => setActiveTab('inventory')}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onOpenPOS={() => setActiveTab('pos')}
      />

      {/* Reset Demo Modal */}
      <ResetDemoModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={handleResetDemoSuccess}
        hideResetDemo={hideResetDemo}
        onToggleHideResetDemo={handleToggleHideResetDemo}
      />

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentRole={currentUser.role}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSidebarOpen(false);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          lowStockCount={lowStockCount}
          pendingReceivablesCount={pendingReceivablesCount}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950/90 relative pb-20 md:pb-0">
          {activeTab === 'dashboard' && (
            <DashboardModule
              overview={overview}
              currentUser={currentUser}
              onNavigate={setActiveTab}
              products={products}
              settings={settings}
              onUpdateCurrentUser={(updated) => {
                setCurrentUser(updated);
                localStorage.setItem('tb_user', JSON.stringify(updated));
                showToast(`Profil ${updated.name} berhasil disimpan!`);
                refreshAllData();
              }}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'pos' && (
            <POSModule
              products={products}
              customers={customers}
              currentUser={currentUser}
              onTransactionComplete={refreshAllData}
              onRefreshProducts={refreshAllData}
              settings={settings}
              storeSettings={settings}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryModule
              products={products}
              currentUser={currentUser}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesModule
              purchases={purchases}
              suppliers={suppliers}
              products={products}
              currentUser={currentUser}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'receivables' && (
            <ReceivablesModule
              receivables={receivables}
              currentUser={currentUser}
              settings={settings}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'payables' && (
            <PayablesModule
              payables={payables}
              currentUser={currentUser}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesModule
              expenses={expenses}
              users={users}
              currentUser={currentUser}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsModule
              currentUser={currentUser}
              sales={sales}
            />
          )}

          {activeTab === 'users' && currentUser.role === 'OWNER' && (
            <UsersModule
              users={users}
              currentUser={currentUser}
              onRefresh={refreshAllData}
              onUpdateCurrentUser={(updated) => {
                setCurrentUser(updated);
                localStorage.setItem('tb_user', JSON.stringify(updated));
                showToast(`Profil ${updated.name} berhasil disimpan!`);
                refreshAllData();
              }}
            />
          )}

          {activeTab === 'settings' && currentUser.role === 'OWNER' && (
            <SettingsModule
              settings={settings}
              currentUser={currentUser}
              onUpdateCurrentUser={(updated) => {
                setCurrentUser(updated);
                localStorage.setItem('tb_user', JSON.stringify(updated));
                showToast(`Profil ${updated.name} berhasil disimpan!`);
                refreshAllData();
              }}
              onRefresh={refreshAllData}
              hideResetDemo={hideResetDemo}
              onToggleHideResetDemo={handleToggleHideResetDemo}
              onOpenResetModal={() => setIsResetModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Ergonomic Bottom Navigation Bar (Visible on phones & tablets < md) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl"
      >
        {/* Kasir POS Tab */}
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition cursor-pointer min-h-[48px] ${
            activeTab === 'pos'
              ? 'text-emerald-400 font-bold bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ShoppingCart className={`w-5 h-5 ${activeTab === 'pos' ? 'text-emerald-400' : 'text-slate-400'}`} />
          </div>
          <span className="text-[10px] mt-1 font-medium">Kasir POS</span>
        </button>

        {/* Stok / Inventori Tab */}
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition cursor-pointer min-h-[48px] ${
            activeTab === 'inventory'
              ? 'text-amber-400 font-bold bg-amber-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Boxes className={`w-5 h-5 ${activeTab === 'inventory' ? 'text-amber-400' : 'text-slate-400'}`} />
            {lowStockCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full px-1 min-w-[14px] h-[14px] flex items-center justify-center">
                {lowStockCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium">Stok Barang</span>
        </button>

        {/* Dashboard Tab (if Owner) or Purchases */}
        {currentUser.role === 'OWNER' ? (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition cursor-pointer min-h-[48px] ${
              activeTab === 'dashboard'
                ? 'text-emerald-400 font-bold bg-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-1 font-medium">Dashboard</span>
          </button>
        ) : null}

        {/* Kasbon / Piutang Tab (if Owner) */}
        {currentUser.role === 'OWNER' && (
          <button
            onClick={() => setActiveTab('receivables')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition cursor-pointer min-h-[48px] ${
              activeTab === 'receivables'
                ? 'text-rose-400 font-bold bg-rose-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <FileSpreadsheet className={`w-5 h-5 ${activeTab === 'receivables' ? 'text-rose-400' : 'text-slate-400'}`} />
              {pendingReceivablesCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-black rounded-full px-1 min-w-[14px] h-[14px] flex items-center justify-center">
                  {pendingReceivablesCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-medium">Buku Kasbon</span>
          </button>
        )}

        {/* All Menus Drawer Toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-400 hover:text-white transition cursor-pointer min-h-[48px]"
        >
          <Menu className="w-5 h-5 text-slate-300" />
          <span className="text-[10px] mt-1 font-medium">Semua Menu</span>
        </button>
      </nav>
    </div>
  );
}
