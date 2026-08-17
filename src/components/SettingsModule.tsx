import React, { useState, useEffect, useRef } from 'react';
import { StoreSettings, BankAccountItem } from '../types';
import { api } from '../lib/api';
import {
  Settings,
  Save,
  Store,
  Receipt,
  CheckCircle2,
  Download,
  Upload,
  RotateCcw,
  Lock,
  Loader2,
  Database,
  AlertTriangle,
  CreditCard,
  QrCode,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  Building2,
  Sparkles,
  Image as ImageIcon,
  PackageCheck,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface SettingsModuleProps {
  settings: StoreSettings | null;
  onRefresh: () => void;
  hideResetDemo?: boolean;
  onToggleHideResetDemo?: (hide: boolean) => void;
  onOpenResetModal?: () => void;
}

const COMMON_BANKS = [
  { name: 'BCA', color: 'bg-blue-600' },
  { name: 'BRI', color: 'bg-sky-600' },
  { name: 'Mandiri', color: 'bg-amber-600' },
  { name: 'BNI', color: 'bg-orange-600' },
  { name: 'BSI', color: 'bg-teal-600' },
  { name: 'CIMB Niaga', color: 'bg-red-700' },
  { name: 'Danamon', color: 'bg-amber-700' },
  { name: 'Permata', color: 'bg-emerald-700' },
  { name: 'SeaBank', color: 'bg-orange-500' },
  { name: 'Bank Jago', color: 'bg-amber-500' },
];

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  onRefresh,
  hideResetDemo = false,
  onToggleHideResetDemo,
  onOpenResetModal,
}) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PAYMENT' | 'RECEIPT' | 'BACKUP'>('PAYMENT');

  // Store Profile States
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [npwp, setNpwp] = useState('');
  const [ownerName, setOwnerName] = useState('');

  // Receipt & Taxes
  const [receiptFooter, setReceiptFooter] = useState('');
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(0);

  // Bank Accounts States
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankName, setBankName] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [isDefaultBank, setIsDefaultBank] = useState(true);

  // QRIS States
  const [qrisMerchantName, setQrisMerchantName] = useState('');
  const [qrisNmid, setQrisNmid] = useState('');
  const [qrisImageUrl, setQrisImageUrl] = useState('');
  const [qrisInstruction, setQrisInstruction] = useState('');

  // Action & Feedback States
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

  // Backup & Restore states
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qrisImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName || '');
      setTagline(settings.tagline || '');
      setOwnerName(settings.ownerName || '');
      setAddress(settings.address || '');
      setPhone(settings.phone || '');
      setEmail(settings.email || '');
      setNpwp(settings.npwp || '');
      setReceiptFooter(settings.receiptFooter || '');
      setDefaultTaxRate(settings.defaultTaxRate || 0);

      // Bank accounts initialization
      if (settings.bankAccounts && settings.bankAccounts.length > 0) {
        setBankAccounts(settings.bankAccounts);
      } else if (settings.bankAccount) {
        // Parse legacy bankAccount string if needed
        setBankAccounts([
          {
            id: 'bank_01',
            bankName: 'BCA',
            accountNumber: '8801-2345-678',
            holderName: settings.storeName || 'TB. Cincin Putih',
            isDefault: true,
          },
        ]);
      } else {
        setBankAccounts([
          {
            id: 'bank_01',
            bankName: 'BCA',
            accountNumber: '8801-2345-678',
            holderName: 'TB. Cincin Putih / Ahmad Junaidi',
            isDefault: true,
          },
        ]);
      }

      // QRIS initialization
      setQrisMerchantName(settings.qrisMerchantName || settings.storeName || 'TB. CINCIN PUTIH');
      setQrisNmid(settings.qrisNmid || 'ID1020030040050');
      setQrisImageUrl(settings.qrisImageUrl || '');
      setQrisInstruction(
        settings.qrisInstruction ||
          'Scan QRIS melalui aplikasi mobile banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, Dana, ShopeePay).'
      );
    }
  }, [settings]);

  // Handle adding or updating a bank account in the list
  const handleSaveBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim()) {
      alert('Nama Bank dan Nomor Rekening wajib diisi');
      return;
    }

    if (editingBankId) {
      // Update existing
      setBankAccounts((prev) =>
        prev.map((b) => {
          if (b.id === editingBankId) {
            return {
              ...b,
              bankName: bankName.trim(),
              accountNumber: accountNumber.trim(),
              holderName: holderName.trim() || storeName || 'TB. Cincin Putih',
              isDefault: isDefaultBank,
            };
          }
          return isDefaultBank ? { ...b, isDefault: false } : b;
        })
      );
      setEditingBankId(null);
    } else {
      // Add new
      const newBank: BankAccountItem = {
        id: `bank_${Date.now()}`,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        holderName: holderName.trim() || storeName || 'TB. Cincin Putih',
        isDefault: isDefaultBank || bankAccounts.length === 0,
      };

      setBankAccounts((prev) => {
        if (newBank.isDefault) {
          return [...prev.map((b) => ({ ...b, isDefault: false })), newBank];
        }
        return [...prev, newBank];
      });
    }

    // Reset bank form
    setBankName('BCA');
    setAccountNumber('');
    setHolderName('');
    setIsDefaultBank(false);
  };

  const handleEditBank = (bank: BankAccountItem) => {
    setEditingBankId(bank.id);
    setBankName(bank.bankName);
    setAccountNumber(bank.accountNumber);
    setHolderName(bank.holderName);
    setIsDefaultBank(!!bank.isDefault);
  };

  const handleDeleteBank = (id: string) => {
    if (bankAccounts.length <= 1) {
      alert('Minimal harus ada 1 nomor rekening bank yang terdaftar.');
      return;
    }
    setBankAccounts((prev) => {
      const filtered = prev.filter((b) => b.id !== id);
      // If deleted was default, make the first one default
      if (!filtered.some((b) => b.isDefault) && filtered.length > 0) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
    if (editingBankId === id) {
      setEditingBankId(null);
      setBankName('BCA');
      setAccountNumber('');
      setHolderName('');
    }
  };

  const handleSetDefaultBank = (id: string) => {
    setBankAccounts((prev) =>
      prev.map((b) => ({
        ...b,
        isDefault: b.id === id,
      }))
    );
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankId(id);
    setTimeout(() => setCopiedBankId(null), 2500);
  };

  // Upload custom QRIS barcode image
  const handleQrisImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran gambar barcode QRIS maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setQrisImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save all settings to API
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      // Build summary bankAccount string for legacy receipt templates
      const primaryBank = bankAccounts.find((b) => b.isDefault) || bankAccounts[0];
      const bankSummaryString = primaryBank
        ? `${primaryBank.bankName} ${primaryBank.accountNumber} a.n ${primaryBank.holderName}`
        : 'BCA 8801-2345-678 a.n TB. Cincin Putih';

      await api.updateSettings({
        storeName,
        tagline,
        ownerName,
        address,
        phone,
        email,
        npwp,
        receiptFooter,
        footerNote: receiptFooter,
        defaultTaxRate,
        bankAccount: bankSummaryString,
        bankAccounts,
        qrisMerchantName,
        qrisNmid,
        qrisImageUrl,
        qrisInstruction,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
      onRefresh();
    } catch (err: any) {
      setBackupError(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  // Backup & Restore Handlers
  const handleDownloadBackup = async () => {
    setLoadingBackup(true);
    setBackupError(null);
    setBackupMsg(null);
    try {
      const backupData = await api.getBackup();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `backup_tb_cincinputih_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupMsg('File cadangan database berhasil diunduh!');
      setTimeout(() => setBackupMsg(null), 4000);
    } catch (err: any) {
      setBackupError(err.message || 'Gagal mengunduh file cadangan');
    } finally {
      setLoadingBackup(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingRestore(true);
    setBackupError(null);
    setBackupMsg(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await api.restoreBackup(parsed);
      setBackupMsg('Data cadangan berhasil dipulihkan!');
      setTimeout(() => {
        setBackupMsg(null);
        onRefresh();
      }, 1500);
    } catch (err: any) {
      setBackupError(err.message || 'File JSON cadangan tidak valid atau rusak');
    } finally {
      setLoadingRestore(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-emerald-400" />
            Pengaturan Toko & Rekening Pembayaran
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Atur nomor rekening bank transfer (BCA/Mandiri/BRI/dll), QRIS toko, identitas nota kasir, dan backup database.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleSaveAll()}
          disabled={saving}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Pengaturan rekening bank, QRIS, dan identitas toko berhasil disimpan dan langsung aktif di Kasir POS!</span>
        </div>
      )}

      {backupMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{backupMsg}</span>
        </div>
      )}

      {backupError && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-center gap-2 text-rose-300 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{backupError}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('PAYMENT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'PAYMENT'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>💳 Rekening Bank & QRIS Toko</span>
          <span className="bg-blue-400/20 text-blue-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
            {bankAccounts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PROFILE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'PROFILE'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>🏢 Profil & Kontak Toko</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RECEIPT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'RECEIPT'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>🧾 Format Struk & Pajak</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BACKUP')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'BACKUP'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>💾 Backup & Keamanan</span>
        </button>
      </div>

      {/* TAB 1: REKENING BANK & QRIS (USER REQUESTED DEDICATED MENU) */}
      {activeTab === 'PAYMENT' && (
        <div className="space-y-6">
          {/* Section 1: Bank Accounts */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  Daftar Rekening Bank Transfer Pembayaran
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Nomor rekening di bawah akan otomatis muncul saat kasir memilih metode <strong>TRANSFER</strong> dan tercantum pada nota/struk belanja.
                </p>
              </div>
            </div>

            {/* List of Configured Bank Accounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bankAccounts.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between ${
                    b.isDefault
                      ? 'bg-gradient-to-br from-blue-950/70 via-slate-900 to-slate-900 border-blue-500/50 shadow-lg shadow-blue-950/30'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  {/* Bank Badge & Default Indicator */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-blue-600 text-white font-extrabold text-xs rounded-lg tracking-wider">
                        {b.bankName}
                      </span>
                      {b.isDefault && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] rounded-md">
                          ⭐ Rekening Utama (Default)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditBank(b)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                        title="Edit Rekening"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBank(b.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        title="Hapus Rekening"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Account Number & Copy */}
                  <div className="space-y-1 my-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Nomor Rekening:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(b.accountNumber, b.id)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedBankId === b.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin No</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="font-mono font-extrabold text-lg text-white tracking-wider bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                      {b.accountNumber}
                    </div>
                  </div>

                  {/* Account Holder */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Atas Nama (A/N):</span>
                      <span className="font-bold text-slate-200">{b.holderName}</span>
                    </div>
                    {!b.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultBank(b.id)}
                        className="text-[10px] text-slate-400 hover:text-emerald-400 underline font-semibold cursor-pointer"
                      >
                        Jadikan Utama
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Form Add / Edit Bank */}
            <form onSubmit={handleSaveBankAccount} className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  {editingBankId ? <Edit2 className="w-3.5 h-3.5 text-amber-400" /> : <Plus className="w-3.5 h-3.5 text-emerald-400" />}
                  {editingBankId ? 'Edit Data Rekening Bank' : 'Tambah Rekening Bank Baru'}
                </span>
                {editingBankId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBankId(null);
                      setBankName('BCA');
                      setAccountNumber('');
                      setHolderName('');
                    }}
                    className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              {/* Quick Bank Chips */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5">Pilih Cepat Nama Bank:</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_BANKS.map((cb) => (
                    <button
                      key={cb.name}
                      type="button"
                      onClick={() => setBankName(cb.name)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        bankName.toUpperCase() === cb.name.toUpperCase()
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {cb.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Nama Bank *</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Contoh: BCA, BRI, Mandiri"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Nomor Rekening *</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Contoh: 88012345678"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Atas Nama (A/N) Rekening *</label>
                  <input
                    type="text"
                    required
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="Contoh: TB. Cincin Putih / Ahmad Junaidi"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefaultBank}
                    onChange={(e) => setIsDefaultBank(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Jadikan sebagai Rekening Utama (Default)</span>
                </label>

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-950/50 cursor-pointer transition"
                >
                  {editingBankId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{editingBankId ? 'Perbarui Rekening' : 'Tambahkan Rekening'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: QRIS Toko */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                Pengaturan QRIS Pembayaran Toko
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Konfigurasi barcode QRIS untuk menerima pembayaran dari BCA Mobile, Livin Mandiri, BRImo, GoPay, OVO, ShopeePay, dan DANA.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* QRIS Input Form */}
              <div className="lg:col-span-2 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Nama Merchant QRIS *</label>
                    <input
                      type="text"
                      value={qrisMerchantName}
                      onChange={(e) => setQrisMerchantName(e.target.value)}
                      placeholder="TB. CINCIN PUTIH"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">NMID (National Merchant ID)</label>
                    <input
                      type="text"
                      value={qrisNmid}
                      onChange={(e) => setQrisNmid(e.target.value)}
                      placeholder="ID1020030040050"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Upload QRIS Image */}
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Upload Gambar Barcode QRIS Asli Toko (Opsional):
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => qrisImageInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition text-xs font-semibold"
                    >
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span>{qrisImageUrl ? 'Ganti File Gambar QRIS' : 'Pilih Gambar Barcode QRIS'}</span>
                    </button>
                    {qrisImageUrl && (
                      <button
                        type="button"
                        onClick={() => setQrisImageUrl('')}
                        className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs transition cursor-pointer"
                      >
                        Hapus Gambar Custom
                      </button>
                    )}
                    <input
                      type="file"
                      ref={qrisImageInputRef}
                      accept="image/*"
                      onChange={handleQrisImageUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Jika tidak mengunggah gambar, sistem POS akan otomatis menampilkan barcode visual QRIS dinamis dengan nama merchant Anda.
                  </p>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Petunjuk Pembayaran QRIS untuk Pelanggan</label>
                  <textarea
                    rows={2}
                    value={qrisInstruction}
                    onChange={(e) => setQrisInstruction(e.target.value)}
                    placeholder="Scan QRIS melalui aplikasi mobile banking..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 resize-none text-xs"
                  />
                </div>
              </div>

              {/* QRIS Live Preview */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] text-slate-400 font-semibold mb-2">
                  Pratinjau QRIS di Layar Kasir:
                </span>
                
                <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center max-w-[200px] w-full">
                  <div className="text-[10px] font-black text-slate-950 tracking-wider mb-1">
                    QRIS PEMBAYARAN
                  </div>
                  {qrisImageUrl ? (
                    <img
                      src={qrisImageUrl}
                      alt="QRIS Barcode"
                      className="w-36 h-36 object-contain rounded"
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center bg-slate-100 rounded border border-slate-300">
                      <QrCode className="w-32 h-32 text-slate-950" />
                    </div>
                  )}
                  <div className="text-[10px] font-extrabold text-slate-900 mt-1 uppercase truncate max-w-full">
                    {qrisMerchantName || 'TB. CINCIN PUTIH'}
                  </div>
                  {qrisNmid && (
                    <div className="text-[8px] text-slate-500 font-mono">
                      NMID: {qrisNmid}
                    </div>
                  )}
                </div>

                <div className="mt-3 text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3" />
                  <span>Siap digunakan di mode bayar QRIS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Save Bar */}
          <div className="flex justify-end bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
            <button
              type="button"
              onClick={() => handleSaveAll()}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-8 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer transition"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Menyimpan...' : 'Simpan Rekening Bank & QRIS'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PROFIL & KONTAK TOKO */}
      {activeTab === 'PROFILE' && (
        <form onSubmit={handleSaveAll} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6 text-xs">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Store className="w-4 h-4 text-emerald-400" />
              Profil Usaha Bahan Bangunan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Nama Toko *</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Slogan / Tagline Usaha</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Nama Pemilik (Owner)</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Nomor Telepon / WA Toko</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">NPWP Toko (Opsional)</label>
                <input
                  type="text"
                  value={npwp}
                  onChange={(e) => setNpwp(e.target.value)}
                  placeholder="09.876.543.2-412.000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Alamat Lengkap Toko & Gudang</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Profil Toko'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: FORMAT STRUK & PAJAK */}
      {activeTab === 'RECEIPT' && (
        <form onSubmit={handleSaveAll} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6 text-xs">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Receipt className="w-4 h-4 text-purple-400" />
              Kustomisasi Cetak Struk Kasir & Pajak
            </h3>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Tarif Pajak PPN (%) Default</label>
              <input
                type="number"
                min="0"
                max="100"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(Number(e.target.value) || 0)}
                className="w-full sm:w-48 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Pesan Penutup Kaki Nota / Syarat Retur Material
              </label>
              <textarea
                rows={3}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Barang yang sudah dibeli dapat ditukar jika cacat maksimal 3 hari kerja..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 resize-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Format Struk'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: BACKUP & KEAMANAN */}
      {activeTab === 'BACKUP' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6 text-xs">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Database className="w-4 h-4 text-teal-400" />
            Keamanan Data Toko, Cadangan (Backup) & Reset
          </h3>

          {/* Start Fresh Reset Option */}
          <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Mulai Pembukuan Baru (Nol-kan Keuangan & Transaksi)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Nol-kan semua transaksi kasir, pemasukan, pengeluaran, hutang supplier, dan piutang kasbon agar Anda dapat menginput dari awal secara nyata.
                  </p>
                </div>
              </div>
              {onOpenResetModal && (
                <button
                  type="button"
                  onClick={onOpenResetModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-md shadow-emerald-950/50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Buka Menu Reset</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Nama Produk Kasir POS</strong> tetap tersimpan lengkap & tidak terhapus.</span>
              </div>
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Bebas pilih apakah stok mau di-nol-kan (0) atau dipertahankan.</span>
              </div>
            </div>
          </div>

          {/* Backup & Restore Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-400" />
                  Unduh Cadangan Data (Backup JSON)
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Simpan salinan lengkap semua barang, rekening bank, transaksi kasir, buku kasbon, dan laporan keuangan ke file di komputer Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={loadingBackup}
                className="w-full py-2.5 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {loadingBackup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download Backup Sekarang</span>
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-400" />
                  Pulihkan Data dari File Cadangan (Restore)
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Kembalikan data toko Anda yang tersimpan sebelumnya jika terjadi kesalahan input atau reset yang tidak disengaja.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loadingRestore}
                className="w-full py-2.5 px-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {loadingRestore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Pilih File Backup & Pulihkan</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </div>
          </div>

          {/* Lock/Hide Reset Demo Switch */}
          {onToggleHideResetDemo && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">
                    Kunci / Sembunyikan Tombol "Reset Demo" di Header
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Aktifkan ini jika data toko TB. Cincin Putih sudah <strong>fix</strong> dan siap digunakan operasional sehari-hari agar tombol reset tidak muncul dan tidak sengaja tertekan kasir.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={hideResetDemo}
                  onChange={(e) => onToggleHideResetDemo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          )}

          {/* Trigger Reset Demo Modal directly */}
          {onOpenResetModal && (
            <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-slate-400 text-[11px]">
              <span>Perlu mengembalikan ke data awal contoh?</span>
              <button
                type="button"
                onClick={onOpenResetModal}
                className="text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Buka Menu Reset Data Demo</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
