import React, { useState, useRef } from 'react';
import { api } from '../lib/api';
import {
  RotateCcw,
  AlertTriangle,
  Download,
  Upload,
  CheckCircle2,
  X,
  Lock,
  Loader2,
  ShieldAlert,
  Trash2,
  PackageCheck,
  CheckSquare,
  Square,
  Sparkles,
  Info,
} from 'lucide-react';

interface ResetDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  hideResetDemo: boolean;
  onToggleHideResetDemo: (hide: boolean) => void;
}

export const ResetDemoModal: React.FC<ResetDemoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  hideResetDemo,
  onToggleHideResetDemo,
}) => {
  const [activeMode, setActiveMode] = useState<'CLEAR_TRANSACTIONS' | 'RESET_DEMO' | 'BACKUP'>('CLEAR_TRANSACTIONS');
  const [resetStockToZero, setResetStockToZero] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle Download Backup JSON
  const handleDownloadBackup = async () => {
    setLoadingBackup(true);
    setErrorMsg(null);
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
      setSuccessMsg('File cadangan (backup JSON) berhasil diunduh ke perangkat Anda!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengunduh file cadangan');
    } finally {
      setLoadingBackup(false);
    }
  };

  // Handle Restore File from JSON
  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingRestore(true);
    setErrorMsg(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await api.restoreBackup(parsed);
      setSuccessMsg('Data cadangan berhasil dipulihkan!');
      setTimeout(() => {
        onSuccess('Data toko berhasil dipulihkan dari file cadangan!');
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'File JSON cadangan tidak valid atau rusak');
    } finally {
      setLoadingRestore(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Clear Transactions (Keuangan Rp 0, Barang Tetap Ada)
  const handleClearTransactions = async () => {
    setLoadingAction(true);
    setErrorMsg(null);
    try {
      const res = await api.resetTransactions(resetStockToZero);
      onSuccess(res.message || 'Pemasukan, pengeluaran & transaksi berhasil di-reset ke 0 (Katalog barang tetap utuh)!');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mereset transaksi keuangan');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Full Reset to Initial Demo Data
  const handleConfirmResetDemo = async () => {
    setLoadingAction(true);
    setErrorMsg(null);
    try {
      await api.resetDemo();
      onSuccess('Data demo berhasil dikembalikan ke kondisi awal contoh toko TB. Cincin Putih!');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mereset data demo');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Reset & Kelola Pembukuan Toko</h3>
              <p className="text-xs text-slate-400">TB. Cincin Putih - Sistem Kasir & Inventori</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-2 bg-slate-950 border-b border-slate-800 flex gap-1.5 px-6">
          <button
            type="button"
            onClick={() => setActiveMode('CLEAR_TRANSACTIONS')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMode === 'CLEAR_TRANSACTIONS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Mulai Pembukuan Baru (Rp 0)</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveMode('BACKUP')}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMode === 'BACKUP'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cadangan / Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('RESET_DEMO')}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMode === 'RESET_DEMO'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Data Contoh</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: CLEAR TRANSACTIONS TO 0 (KEEP PRODUCTS) */}
          {activeMode === 'CLEAR_TRANSACTIONS' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Mulai Operasional Toko dari Awal (Nol-kan Keuangan)</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Fitur ini akan mengosongkan seluruh riwayat pemasukan, pengeluaran, hutang, dan piutang toko ke <strong>Rp 0</strong>, namun <strong>semua nama barang material di kasir tetap tersimpan utuh</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-emerald-500/20 text-[11px] text-emerald-300">
                    ✅ <strong>Katalog Barang Tetap Aman:</strong> Nama produk, SKU, barcode, harga jual retail/grosir, dan satuan tetap ada di POS.
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-emerald-500/20 text-[11px] text-emerald-300">
                    🔄 <strong>Keuangan Bersih ke Rp 0:</strong> Omzet penjualan kasir, beban operasional, buku hutang distributor & kasbon jadi 0.
                  </div>
                </div>
              </div>

              {/* Stock Zero Option Checkbox */}
              <div 
                onClick={() => setResetStockToZero(!resetStockToZero)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                  resetStockToZero 
                    ? 'bg-slate-950 border-emerald-500/50 text-white' 
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5 text-emerald-400 shrink-0">
                  {resetStockToZero ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-200">
                    Kosongkan juga angka stok fisik semua barang menjadi 0 (Nol)
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Centang opsi ini agar Anda dapat memasukkan stok barang baru dari awal melalui menu <strong>Order Barang / Pembelian Supplier</strong> atau <strong>Penyesuaian Stok (Opname)</strong>.
                    Jika tidak dicentang, angka stok barang saat ini akan tetap dipertahankan.
                  </p>
                </div>
              </div>

              {/* Confirmation Notice */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Disarankan untuk mengunduh Backup di tab <strong>Cadangan</strong> jika sewaktu-waktu ingin melihat data lama.</span>
              </div>
            </div>
          )}

          {/* TAB 2: BACKUP & RESTORE */}
          {activeMode === 'BACKUP' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-950/20 border border-blue-500/30 rounded-2xl space-y-2">
                <div className="font-bold text-blue-400 text-xs flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Cadangkan atau Pulihkan File Database Toko</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Unduh file <code>.json</code> cadangan untuk disimpan di laptop/HP Anda, atau unggah file cadangan sebelumnya untuk memulihkan seluruh data toko kapan saja.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Download Backup */}
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  disabled={loadingBackup}
                  className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-emerald-500/40 text-slate-200 font-semibold text-xs flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center"
                >
                  {loadingBackup ? (
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  ) : (
                    <Download className="w-5 h-5 text-emerald-400" />
                  )}
                  <div>
                    <div className="font-bold text-white">Unduh Cadangan (Backup)</div>
                    <div className="text-[10px] text-slate-400">Simpan salinan data lengkap</div>
                  </div>
                </button>

                {/* Restore File */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loadingRestore}
                  className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-blue-500/40 text-slate-200 font-semibold text-xs flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center"
                >
                  {loadingRestore ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  ) : (
                    <Upload className="w-5 h-5 text-blue-400" />
                  )}
                  <div>
                    <div className="font-bold text-white">Pulihkan Data (Restore)</div>
                    <div className="text-[10px] text-slate-400">Upload file backup .json</div>
                  </div>
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
          )}

          {/* TAB 3: RESET TO DEMO DATA */}
          {activeMode === 'RESET_DEMO' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Kembalikan ke Contoh Data Demo TB. Cincin Putih</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Ini akan mengembalikan seluruh produk, transaksi contoh, kasbon simulasi Pak Haji Sukardi, dan utang distributor ke contoh demo bawaan sistem.
                </p>
              </div>
            </div>
          )}

          {/* Toggle Hide Reset Demo Button */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-200 text-xs">Kunci / Sembunyikan Tombol Reset di Header</div>
                <div className="text-[11px] text-slate-400">
                  Sembunyikan tombol "Reset Demo" dari bilah atas agar tidak bisa ditekan sembarangan saat kasir bertugas.
                </div>
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

        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
          
          {activeMode === 'CLEAR_TRANSACTIONS' && (
            <button
              type="button"
              onClick={handleClearTransactions}
              disabled={loadingAction}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              {loadingAction ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Reset...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Reset Keuangan ke 0 (Katalog Tetap Ada)</span>
                </>
              )}
            </button>
          )}

          {activeMode === 'RESET_DEMO' && (
            <button
              type="button"
              onClick={handleConfirmResetDemo}
              disabled={loadingAction}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/50 transition cursor-pointer"
            >
              {loadingAction ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mereset Data Demo...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Kembalikan ke Contoh Demo</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

