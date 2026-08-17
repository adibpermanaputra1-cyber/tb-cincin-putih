import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, User } from '../types';
import { formatRupiah, formatIndonesianDate } from '../lib/format';
import { api } from '../lib/api';
import {
  ReceiptText,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  Wallet,
  Users,
  Truck,
  Zap,
  Search,
  Building,
  DollarSign,
  UserCheck,
  CreditCard,
  Banknote,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface ExpensesModuleProps {
  expenses: Expense[];
  users?: User[];
  currentUser: User;
  onRefresh: () => void;
}

export const CATEGORY_GROUPS: {
  groupName: string;
  icon: React.ComponentType<{ className?: string }>;
  categories: {
    name: ExpenseCategory;
    description: string;
    badgeColor: string;
  }[];
}[] = [
  {
    groupName: 'Karyawan & Tenaga Kerja',
    icon: Users,
    categories: [
      {
        name: 'Kasbon & Pinjaman Karyawan',
        description: 'Pinjaman uang tunai / kasbon potong gaji karyawan toko',
        badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      },
      {
        name: 'Gaji & Upah Karyawan',
        description: 'Gaji bulanan, mingguan, atau harian staf toko',
        badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      },
      {
        name: 'Uang Makan & Konsumsi Karyawan',
        description: 'Makan siang, kopi, snack, air galon untuk tim toko',
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      },
      {
        name: 'Upah Kuli Bongkar / Muat Material',
        description: 'Ongkos bongkar semen, bata ringan, pasir, atau muat pesanan',
        badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      },
    ],
  },
  {
    groupName: 'Kendaraan & Armada Pengiriman',
    icon: Truck,
    categories: [
      {
        name: 'BBM & Solar Truk / Pikap Armada',
        description: 'Bensin & solar kendaraan pengiriman pesanan semen/pasir',
        badgeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
      },
      {
        name: 'Servis, Oli & Onderdil Truk',
        description: 'Ganti oli truk/pikap, tambal ban, servis berkala armada',
        badgeColor: 'bg-red-500/15 text-red-300 border-red-500/30',
      },
    ],
  },
  {
    groupName: 'Utilitas & Operasional Toko',
    icon: Zap,
    categories: [
      {
        name: 'Listrik, Air & Internet Toko',
        description: 'Token listrik PLN toko, tagihan PAM, dan Wi-Fi kasir',
        badgeColor: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
      },
      {
        name: 'Sewa Tempat, Kios & Gudang',
        description: 'Sewa bulanan / tahunan toko material dan gudang semen',
        badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      },
      {
        name: 'Perawatan & Renovasi Toko/Gudang',
        description: 'Perbaikan rak display, atap bocor, cat dinding toko',
        badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      },
      {
        name: 'Perlengkapan Toko, Plastik & ATK Nota',
        description: 'Kertas struk thermal kasir, lakban, kantong semen, spidol',
        badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      },
    ],
  },
  {
    groupName: 'Pajak & Administrasi Toko',
    icon: Building,
    categories: [
      {
        name: 'Pajak, Retribusi & Iuran Lingkungan',
        description: 'Iuran kebersihan pasar, keamanan lingkungan, retribusi daerah',
        badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      },
      {
        name: 'Biaya Administrasi & Transfer Bank',
        description: 'Biaya admin transfer antar bank, MDR QRIS, biaya buku cek',
        badgeColor: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
      },
      {
        name: 'Operasional Lainnya',
        description: 'Pengeluaran darurat atau kebutuhan tak terduga lainnya',
        badgeColor: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
      },
    ],
  },
];

const ALL_CATEGORIES_LIST: ExpenseCategory[] = CATEGORY_GROUPS.flatMap((g) =>
  g.categories.map((c) => c.name)
);

export const ExpensesModule: React.FC<ExpensesModuleProps> = ({
  expenses,
  users = [],
  currentUser,
  onRefresh,
}) => {
  // Filter & Search
  const [activeTabFilter, setActiveTabFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<'ALL' | 'TUNAI' | 'TRANSFER'>('ALL');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKasbonModalOpen, setIsKasbonModalOpen] = useState(false);

  // General Expense Form
  const [category, setCategory] = useState<ExpenseCategory>('BBM & Solar Truk / Pikap Armada');
  const [amount, setAmount] = useState<number>(0);
  const [recipient, setRecipient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'TRANSFER'>('TUNAI');
  const [notes, setNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Kasbon Dedicated Form State
  const [kasbonEmployeeName, setKasbonEmployeeName] = useState('');
  const [kasbonAmount, setKasbonAmount] = useState<number>(0);
  const [kasbonPaymentMethod, setKasbonPaymentMethod] = useState<'TUNAI' | 'TRANSFER'>('TUNAI');
  const [kasbonDeductionPlan, setKasbonDeductionPlan] = useState('Potong Gaji Akhir Bulan');
  const [kasbonReason, setKasbonReason] = useState('');
  const [kasbonDate, setKasbonDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Delete confirmation
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Calculate Aggregates
  const totalExpense = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  
  const totalKasbon = useMemo(() => {
    return expenses
      .filter((e) => e.category === 'Kasbon & Pinjaman Karyawan')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const kasbonCount = useMemo(() => {
    return expenses.filter((e) => e.category === 'Kasbon & Pinjaman Karyawan').length;
  }, [expenses]);

  const totalBBM = useMemo(() => {
    return expenses
      .filter((e) => e.category.includes('BBM') || e.category.includes('Solar') || e.category.includes('Bensin') || e.category.includes('Servis'))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalGaji = useMemo(() => {
    return expenses
      .filter((e) => e.category === 'Gaji & Upah Karyawan' || e.category.includes('Konsumsi') || e.category.includes('Kuli'))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Tab filter
      if (activeTabFilter === 'KASBON' && exp.category !== 'Kasbon & Pinjaman Karyawan') {
        return false;
      }
      if (
        activeTabFilter === 'GAJI' &&
        exp.category !== 'Gaji & Upah Karyawan' &&
        exp.category !== 'Uang Makan & Konsumsi Karyawan' &&
        exp.category !== 'Upah Kuli Bongkar / Muat Material' &&
        exp.category !== 'Konsumsi & Kuli Bongkar'
      ) {
        return false;
      }
      if (
        activeTabFilter === 'ARMADA' &&
        exp.category !== 'BBM & Solar Truk / Pikap Armada' &&
        exp.category !== 'Bensin & Solar Armada Truk' &&
        exp.category !== 'Servis, Oli & Onderdil Truk'
      ) {
        return false;
      }
      if (
        activeTabFilter === 'UTILITAS' &&
        exp.category !== 'Listrik, Air & Internet Toko' &&
        exp.category !== 'Listrik, Air & Internet' &&
        exp.category !== 'Sewa Tempat, Kios & Gudang' &&
        exp.category !== 'Sewa Tempat & Gudang' &&
        exp.category !== 'Perawatan & Renovasi Toko/Gudang' &&
        exp.category !== 'Perawatan & Maintenance' &&
        exp.category !== 'Perlengkapan Toko, Plastik & ATK Nota'
      ) {
        return false;
      }
      if (
        activeTabFilter === 'LAINNYA' &&
        exp.category !== 'Pajak, Retribusi & Iuran Lingkungan' &&
        exp.category !== 'Pajak & Retribusi' &&
        exp.category !== 'Biaya Administrasi & Transfer Bank' &&
        exp.category !== 'Operasional Lainnya'
      ) {
        return false;
      }

      // Payment filter
      if (selectedPaymentFilter !== 'ALL' && exp.paymentMethod !== selectedPaymentFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCategory = exp.category.toLowerCase().includes(q);
        const matchNotes = exp.notes?.toLowerCase().includes(q);
        const matchRecipient = exp.recipient?.toLowerCase().includes(q);
        const matchRecordedBy = exp.recordedBy?.toLowerCase().includes(q);
        if (!matchCategory && !matchNotes && !matchRecipient && !matchRecordedBy) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, activeTabFilter, selectedPaymentFilter, searchQuery]);

  // Open Standard Modal
  const handleOpenStandardModal = (defaultCat?: ExpenseCategory) => {
    if (defaultCat) setCategory(defaultCat);
    setAmount(0);
    setRecipient('');
    setNotes('');
    setPaymentMethod('TUNAI');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Open Kasbon Dedicated Modal
  const handleOpenKasbonModal = () => {
    setKasbonEmployeeName('');
    setKasbonAmount(0);
    setKasbonPaymentMethod('TUNAI');
    setKasbonDeductionPlan('Potong Gaji Akhir Bulan');
    setKasbonReason('');
    setKasbonDate(new Date().toISOString().split('T')[0]);
    setErrorMsg(null);
    setIsKasbonModalOpen(true);
  };

  // Save Standard Expense
  const handleSaveStandardExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMsg('Nominal pengeluaran harus lebih dari Rp 0!');
      return;
    }
    if (!notes.trim()) {
      setErrorMsg('Keterangan / keperluan pengeluaran wajib diisi!');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await api.createExpense({
        date: expenseDate ? new Date(expenseDate).toISOString() : new Date().toISOString(),
        category,
        amount,
        recipient: recipient.trim() || undefined,
        paymentMethod,
        notes: notes.trim(),
        recordedBy: currentUser.name,
      });

      setIsModalOpen(false);
      setSuccessMsg('Catatan beban operasional toko berhasil disimpan!');
      setTimeout(() => setSuccessMsg(null), 3500);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mencatat beban operasional');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Kasbon Expense
  const handleSaveKasbonExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kasbonEmployeeName.trim()) {
      setErrorMsg('Nama karyawan yang meminjam uang wajib dipilih atau diisi!');
      return;
    }
    if (kasbonAmount <= 0) {
      setErrorMsg('Nominal pinjaman kasbon harus lebih dari Rp 0!');
      return;
    }

    const compiledNotes = `[KASBON KARYAWAN: ${kasbonEmployeeName.trim()}] Rencana: ${kasbonDeductionPlan}. ${
      kasbonReason ? `Keperluan: ${kasbonReason.trim()}` : ''
    }`.trim();

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await api.createExpense({
        date: kasbonDate ? new Date(kasbonDate).toISOString() : new Date().toISOString(),
        category: 'Kasbon & Pinjaman Karyawan',
        amount: kasbonAmount,
        recipient: kasbonEmployeeName.trim(),
        paymentMethod: kasbonPaymentMethod,
        notes: compiledNotes,
        recordedBy: currentUser.name,
      });

      setIsKasbonModalOpen(false);
      setSuccessMsg(`Kasbon sebesar ${formatRupiah(kasbonAmount)} untuk ${kasbonEmployeeName} berhasil dicatat!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mencatat kasbon karyawan');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;

    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await api.deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
      setSuccessMsg('Catatan beban operasional berhasil dihapus!');
      setTimeout(() => setSuccessMsg(null), 3500);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus catatan pengeluaran');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper badge for categories
  const getCategoryBadgeClass = (cat: string) => {
    if (cat === 'Kasbon & Pinjaman Karyawan') {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold';
    }
    if (cat === 'Gaji & Upah Karyawan') {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    if (cat.includes('BBM') || cat.includes('Solar') || cat.includes('Bensin')) {
      return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
    }
    if (cat.includes('Listrik') || cat.includes('Air')) {
      return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
    }
    if (cat.includes('Sewa')) {
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    }
    if (cat.includes('Upah Kuli') || cat.includes('Konsumsi')) {
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Alerts */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 flex items-center gap-2 text-xs font-semibold shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 flex items-center gap-2 text-xs font-semibold shadow-lg animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-orange-500/15 border border-orange-500/30 rounded-2xl text-orange-400">
              <ReceiptText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Beban & Pengeluaran Toko
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola kasbon karyawan, gaji, solar armada pengiriman, listrik, dan biaya operasional TB. Cincin Putih.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Quick Kasbon Button */}
          <button
            onClick={handleOpenKasbonModal}
            className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 border border-purple-400/30 transition hover:scale-[1.02] cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-purple-200" />
            <span>💸 Pinjam Uang / Kasbon Karyawan</span>
          </button>

          {/* Standard Expense Button */}
          <button
            onClick={() => handleOpenStandardModal()}
            className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Pengeluaran Lain</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Akumulasi */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Total Semua Beban
            </span>
            <div className="text-lg font-black text-orange-400 mt-1">
              {formatRupiah(totalExpense)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{expenses.length} Transaksi Keluar</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Kasbon Karyawan */}
        <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-purple-400" />
              Kasbon Karyawan
            </span>
            <div className="text-lg font-black text-purple-200 mt-1">
              {formatRupiah(totalKasbon)}
            </div>
            <div className="text-[11px] text-purple-400/80 mt-0.5">{kasbonCount} Pinjaman Kasbon</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Total BBM & Armada */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              BBM & Armada Truk
            </span>
            <div className="text-lg font-black text-amber-400 mt-1">
              {formatRupiah(totalBBM)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Solar, Bensin & Servis</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Total Gaji & Tenaga */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Gaji, Kuli & Konsumsi
            </span>
            <div className="text-lg font-black text-emerald-400 mt-1">
              {formatRupiah(totalGaji)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Gaji + Uang Makan + Kuli</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTabFilter('ALL')}
            className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTabFilter === 'ALL'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            Semua Beban ({expenses.length})
          </button>

          <button
            onClick={() => setActiveTabFilter('KASBON')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
              activeTabFilter === 'KASBON'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 border border-purple-500/30'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>💸 Khusus Kasbon Karyawan ({kasbonCount})</span>
          </button>

          <button
            onClick={() => setActiveTabFilter('GAJI')}
            className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTabFilter === 'GAJI'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            👥 Gaji & Konsumsi
          </button>

          <button
            onClick={() => setActiveTabFilter('ARMADA')}
            className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTabFilter === 'ARMADA'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            🚚 Armada & BBM
          </button>

          <button
            onClick={() => setActiveTabFilter('UTILITAS')}
            className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTabFilter === 'UTILITAS'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            ⚡ Listrik, Sewa & Rutin
          </button>

          <button
            onClick={() => setActiveTabFilter('LAINNYA')}
            className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTabFilter === 'LAINNYA'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            📦 Pajak & Lainnya
          </button>
        </div>

        {/* Search & Payment Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama karyawan, penerima, atau keterangan pengeluaran..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPaymentFilter}
              onChange={(e: any) => setSelectedPaymentFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="ALL">Semua Metode Pembayaran</option>
              <option value="TUNAI">💵 Kas Tunai</option>
              <option value="TRANSFER">💳 Transfer Bank</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Kategori Beban</th>
                <th className="p-3.5 text-right">Nominal (Rp)</th>
                <th className="p-3.5">Penerima / Karyawan</th>
                <th className="p-3.5">Metode Bayar</th>
                <th className="p-3.5">Keterangan / Keperluan</th>
                <th className="p-3.5">Dicatat Oleh</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <ReceiptText className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                    Tidak ada catatan beban pengeluaran yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const isKasbon = exp.category === 'Kasbon & Pinjaman Karyawan';
                  return (
                    <tr
                      key={exp.id}
                      className={`hover:bg-slate-850/50 transition ${
                        isKasbon ? 'bg-purple-950/10' : ''
                      }`}
                    >
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">
                        {formatIndonesianDate(exp.date)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1.5 ${getCategoryBadgeClass(
                            exp.category
                          )}`}
                        >
                          {isKasbon && <Wallet className="w-3 h-3 text-purple-300 shrink-0" />}
                          {exp.category}
                        </span>
                      </td>
                      <td
                        className={`p-3.5 text-right font-extrabold text-sm ${
                          isKasbon ? 'text-purple-300' : 'text-orange-400'
                        }`}
                      >
                        {formatRupiah(exp.amount)}
                      </td>
                      <td className="p-3.5 font-medium">
                        {isKasbon ? (
                          <div className="flex items-center gap-1.5 text-purple-200 font-bold">
                            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                            {exp.recipient || 'Karyawan'}
                          </div>
                        ) : (
                          <span className="text-slate-200">{exp.recipient || '-'}</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-300 font-semibold whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          {exp.paymentMethod === 'TUNAI' ? (
                            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                          )}
                          {exp.paymentMethod === 'TUNAI' ? 'Kas Tunai' : 'Transfer'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300 max-w-xs break-words">
                        {exp.notes}
                      </td>
                      <td className="p-3.5 text-slate-400">{exp.recordedBy}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setDeletingExpense(exp)}
                          title="Hapus Catatan Pengeluaran"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: DEDICATED KASBON KARYAWAN (SANGAT MUDAH & CEPAT)                */}
      {/* ========================================================================= */}
      {isKasbonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-slate-100">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-purple-950/80 to-slate-900 border-b border-purple-500/30 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Pencatatan Kasbon / Pinjam Uang Karyawan</h3>
                  <p className="text-xs text-purple-300/80">Pengeluaran kas toko untuk pinjaman karyawan</p>
                </div>
              </div>
              <button
                onClick={() => setIsKasbonModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKasbonExpense} className="p-5 space-y-4 text-xs">
              {/* Info banner */}
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  Catatan ini akan otomatis masuk ke <strong>Beban Operasional</strong> sebagai pengeluaran kas toko dengan kategori khusus <strong>Kasbon Karyawan</strong>.
                </span>
              </div>

              {/* 1. Pilih / Ketik Nama Karyawan */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5 flex items-center justify-between">
                  <span>Nama Karyawan Yang Meminjam *</span>
                  <span className="text-[11px] text-slate-400 font-normal">Pilih cepat atau ketik</span>
                </label>

                {/* Quick chip buttons for existing users */}
                {users.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {users.map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => setKasbonEmployeeName(u.name)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                          kasbonEmployeeName === u.name
                            ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        👤 {u.name} ({u.role})
                      </button>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  required
                  value={kasbonEmployeeName}
                  onChange={(e) => setKasbonEmployeeName(e.target.value)}
                  placeholder="Ketik nama karyawan / sopir / kuli (e.g. Risma, Pak Joko Sopir, Budi)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-semibold text-xs outline-none focus:border-purple-500"
                />
              </div>

              {/* 2. Nominal Pinjaman & Quick Chips */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Nominal Pinjaman Uang (Rp) *
                </label>

                <input
                  type="number"
                  min="5000"
                  required
                  value={kasbonAmount || ''}
                  onChange={(e) => setKasbonAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-black text-purple-300 outline-none focus:border-purple-500 mb-2"
                />

                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {[50000, 100000, 200000, 500000, 1000000].map((quickVal) => (
                    <button
                      type="button"
                      key={quickVal}
                      onClick={() => setKasbonAmount(quickVal)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-950/60 hover:text-purple-300 text-slate-300 text-[11px] font-semibold border border-slate-700 transition cursor-pointer"
                    >
                      +{formatRupiah(quickVal)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Sumber Kas & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Sumber Penyerahan Uang *
                  </label>
                  <select
                    value={kasbonPaymentMethod}
                    onChange={(e: any) => setKasbonPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="TUNAI">💵 Kas Tunai (Laci Kasir)</option>
                    <option value="TRANSFER">💳 Transfer Bank Toko</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Tanggal Pinjam *</label>
                  <input
                    type="date"
                    required
                    value={kasbonDate}
                    onChange={(e) => setKasbonDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* 4. Rencana Pengembalian / Potong Gaji */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Rencana Potong Gaji / Pengembalian
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Potong Gaji Akhir Bulan',
                    'Potong Gaji Minggu Ini',
                    'Dicicil 2x Bayar',
                    'Dibayar Tunai Nanti',
                  ].map((plan) => (
                    <button
                      type="button"
                      key={plan}
                      onClick={() => setKasbonDeductionPlan(plan)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border cursor-pointer ${
                        kasbonDeductionPlan === plan
                          ? 'bg-purple-900/60 text-purple-200 border-purple-400'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={kasbonDeductionPlan}
                  onChange={(e) => setKasbonDeductionPlan(e.target.value)}
                  placeholder="e.g. Potong Gaji Akhir Bulan ini"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-purple-500"
                />
              </div>

              {/* 5. Catatan / Keperluan */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Keperluan / Alasan Pinjam (Opsional)
                </label>
                <input
                  type="text"
                  value={kasbonReason}
                  onChange={(e) => setKasbonReason(e.target.value)}
                  placeholder="e.g. Keperluan keluarga mendesak / Beli bensin motor pribadi"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-purple-500"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsKasbonModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-950/50 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Kasbon Karyawan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STANDARD / ALL CATEGORIES EXPENSE MODAL                          */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-slate-100">
            {/* Header */}
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-500/15 border border-orange-500/30 rounded-xl text-orange-400">
                  <ReceiptText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Catat Pengeluaran Beban Toko</h3>
                  <p className="text-[11px] text-slate-400">Pilih kategori lengkap beban operasional</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStandardExpense} className="p-5 space-y-3.5 text-xs">
              {/* Kategori Pengeluaran Terstruktur */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Kategori Pengeluaran Toko *
                </label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium outline-none focus:border-orange-500 cursor-pointer"
                >
                  {CATEGORY_GROUPS.map((grp) => (
                    <optgroup key={grp.groupName} label={`--- ${grp.groupName} ---`}>
                      {grp.categories.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Nominal Biaya & Quick Buttons */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Nominal Biaya Pengeluaran (Rp) *
                </label>
                <input
                  type="number"
                  min="1000"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-base font-black text-orange-400 outline-none focus:border-orange-500 mb-1.5"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[20000, 50000, 100000, 250000, 500000].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAmount(val)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 cursor-pointer"
                    >
                      +{formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Penerima / Tujuan & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Penerima / SPBU / Vendor
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g. SPBU Pertamina / PLN / Kuli 4 Orang"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Sumber Dana */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Sumber Dana Kas Toko *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="TUNAI">💵 Kas Tunai Laci Kasir</option>
                  <option value="TRANSFER">💳 Transfer Rekening Bank Toko</option>
                </select>
              </div>

              {/* Keterangan */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Keterangan / Keperluan Lengkap *
                </label>
                <textarea
                  required
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Beli solar truk armada kirim semen ke proyek Cikarang & isi galon air toko"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-orange-950/50 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengeluaran'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION                                              */}
      {/* ========================================================================= */}
      {deletingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-slate-100">
            <div className="p-5 bg-rose-950/30 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Hapus Catatan Pengeluaran?</h3>
                <p className="text-xs text-slate-400">Tindakan ini akan menghapus data beban ini dari pembukuan.</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Kategori:</span>
                  <span className="font-semibold text-orange-400">{deletingExpense.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Nominal:</span>
                  <span className="font-extrabold text-base text-rose-400">
                    {formatRupiah(deletingExpense.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Penerima/Karyawan:</span>
                  <span className="text-slate-200">{deletingExpense.recipient || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Tanggal:</span>
                  <span className="text-slate-200">{formatIndonesianDate(deletingExpense.date)}</span>
                </div>
                <div className="flex justify-between items-start gap-2 pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400 shrink-0">Keperluan:</span>
                  <span className="text-slate-300 text-right">{deletingExpense.notes}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingExpense(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-950/50 transition cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Catatan</span>
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
