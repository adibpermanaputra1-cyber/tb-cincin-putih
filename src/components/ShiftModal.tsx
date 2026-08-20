import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../lib/format';
import { StoreShift, User, SaleTransaction, Expense } from '../types';
import { api } from '../lib/api';
import {
  ArrowLeft,
  Lock,
  Unlock,
  Clock,
  User as UserIcon,
  DollarSign,
  Building2,
  AlertCircle,
  CheckCircle2,
  X,
  History,
  Coins,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onShiftUpdated?: () => void;
  initialMode?: 'OPEN' | 'CLOSE' | 'HISTORY';
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onShiftUpdated,
  initialMode,
}) => {
  const [activeShift, setActiveShift] = useState<StoreShift | null>(null);
  const [shiftHistory, setShiftHistory] = useState<StoreShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'HISTORY'>('CURRENT');

  // Tutup Shift States
  const [actualCashStr, setActualCashStr] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');
  const [durationText, setDurationText] = useState<string>('0 jam 0 menit');

  // Buka Shift States
  const [startingCashStr, setStartingCashStr] = useState<string>('500.000');
  const [openNotes, setOpenNotes] = useState<string>('');
  const [selectedCashier, setSelectedCashier] = useState<string>(currentUser.name);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadShiftData = async () => {
    setLoading(true);
    try {
      const [current, history] = await Promise.all([
        api.getActiveShift(),
        api.getShifts(),
      ]);
      setActiveShift(current);
      setShiftHistory(history);

      if (current) {
        // Pre-fill expected cash or starting cash
        const expected = (current.startingCash || 0) + (current.cashSalesAmount || 0) - (current.cashExpensesAmount || 0);
        setActualCashStr(expected > 0 ? expected.toLocaleString('id-ID') : '');
      }
    } catch (err) {
      console.error('Error loading shift data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      loadShiftData();
      if (initialMode === 'HISTORY') {
        setActiveTab('HISTORY');
      } else {
        setActiveTab('CURRENT');
      }
    }
  }, [isOpen, initialMode]);

  // Live timer calculation for open shift
  useEffect(() => {
    if (!activeShift?.startTime || activeShift.status !== 'OPEN') return;

    const updateDuration = () => {
      const start = new Date(activeShift.startTime).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - start);
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setDurationText(`${hours} jam ${minutes} menit`);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 10000);
    return () => clearInterval(interval);
  }, [activeShift]);

  if (!isOpen) return null;

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const startCash = parseFloat(startingCashStr.replace(/[^0-9]/g, '')) || 0;
    if (startCash < 0) {
      setErrorMsg('Kas awal tidak boleh kurang dari 0');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.openShift({
        startingCash: startCash,
        cashierName: selectedCashier || currentUser.name,
        cashierId: currentUser.id,
        notes: openNotes.trim(),
      });

      setSuccessMsg('Kasir berhasil dibuka! Selamat bertugas.');
      await loadShiftData();
      if (onShiftUpdated) onShiftUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuka shift kasir');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const actual = parseFloat(actualCashStr.replace(/[^0-9]/g, ''));
    if (isNaN(actual) || actual < 0) {
      setErrorMsg('Masukkan jumlah uang fisik aktual yang ada di laci kasir');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.closeShift({
        shiftId: activeShift.id,
        actualCash: actual,
        notes: closeNotes.trim(),
        closedBy: currentUser.name,
      });

      setSuccessMsg('Shift kasir berhasil ditutup dan direkonsiliasi.');
      await loadShiftData();
      if (onShiftUpdated) onShiftUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menutup shift kasir');
    } finally {
      setSubmitting(false);
    }
  };

  // Expected calculations
  const expectedCash = activeShift
    ? (activeShift.startingCash || 0) + (activeShift.cashSalesAmount || 0) - (activeShift.cashExpensesAmount || 0)
    : 0;

  const actualNum = parseFloat(actualCashStr.replace(/[^0-9]/g, '')) || 0;
  const difference = actualNum - expectedCash;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Bar with tabs */}
        <div
          className={`px-5 py-4 flex items-center justify-between text-white border-b ${
            activeShift
              ? 'bg-rose-900/90 border-rose-700/50'
              : 'bg-emerald-900/90 border-emerald-700/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 -ml-1 rounded-lg hover:bg-white/10 text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-base sm:text-lg font-bold">
              {activeShift ? 'Tutup Kasir' : 'Buka Kasir / Shift Baru'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab(activeTab === 'CURRENT' ? 'HISTORY' : 'CURRENT')}
              className="px-2.5 py-1 rounded-lg text-xs bg-white/15 hover:bg-white/25 text-white font-medium flex items-center gap-1 transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>{activeTab === 'CURRENT' ? 'Riwayat' : 'Form Shift'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: FORM SHIFT (TUTUP / BUKA) */}
          {activeTab === 'CURRENT' && (
            <>
              {activeShift ? (
                /* --- TUTUP KASIR MODE (MATCHING SCREENSHOT 3) --- */
                <form onSubmit={handleCloseShift} className="space-y-4">
                  {/* Big Red Lock Icon Box */}
                  <div className="text-center py-2">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto mb-2 shadow-inner">
                      <Lock className="w-7 h-7" />
                    </div>
                    <h2 className="text-base font-extrabold text-white">Tutup Kasir</h2>
                    <p className="text-xs text-slate-400">
                      Rekonsiliasi uang fisik di laci kasir sebelum mengakhiri jam shift kerja
                    </p>
                  </div>

                  {/* Shift Info Card (Screenshot 3 Pink/Rose Card) */}
                  <div className="bg-rose-950/40 border border-rose-800/40 rounded-2xl p-4 space-y-2.5 text-xs text-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4 text-rose-400" />
                        <span>Shift Dibuka</span>
                      </div>
                      <span className="font-semibold text-white">
                        {new Date(activeShift.startTime).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}, {new Date(activeShift.startTime).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-rose-900/40 pt-2">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Durasi Shift</span>
                      </div>
                      <span className="font-semibold text-amber-300">{durationText}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-rose-900/40 pt-2">
                      <div className="flex items-center gap-2 text-slate-400">
                        <UserIcon className="w-4 h-4 text-emerald-400" />
                        <span>Kasir</span>
                      </div>
                      <span className="font-bold text-white">{activeShift.cashierName}</span>
                    </div>
                  </div>

                  {/* Kas Awal Banner */}
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <span>KAS AWAL</span>
                    </div>
                    <div className="text-base font-extrabold text-white">
                      {formatRupiah(activeShift.startingCash || 0)}
                    </div>
                  </div>

                  {/* Hitung Fisik Uang (Screenshot 3 Input) */}
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>HITUNG FISIK UANG</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Hitung semua uang tunai di laci kasir dan masukkan jumlahnya di bawah:
                    </p>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Jumlah Uang Aktual (Rp)"
                        value={actualCashStr}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, '');
                          setActualCashStr(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-base font-extrabold text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    {/* Calculation Comparison Preview */}
                    <div className="pt-2 border-t border-slate-700/50 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Total Kas Seharusnya di Laci:</span>
                        <span className="font-semibold text-slate-200">{formatRupiah(expectedCash)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Penjualan Tunai Selama Shift:</span>
                        <span className="font-semibold text-emerald-400">
                          +{formatRupiah(activeShift.cashSalesAmount || 0)} ({activeShift.totalTransactionsCount || 0} nota)
                        </span>
                      </div>
                      {activeShift.cashExpensesAmount ? (
                        <div className="flex justify-between text-slate-400">
                          <span>Pengeluaran Kas Toko:</span>
                          <span className="font-semibold text-rose-400">
                            -{formatRupiah(activeShift.cashExpensesAmount)}
                          </span>
                        </div>
                      ) : null}

                      <div className="flex justify-between font-bold pt-1 border-t border-slate-700">
                        <span className="text-slate-300">Selisih Fisik Kas:</span>
                        <span
                          className={`${
                            difference === 0
                              ? 'text-emerald-400'
                              : difference > 0
                              ? 'text-blue-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {difference === 0
                            ? 'Pas (Rp0)'
                            : difference > 0
                            ? `Lebih (+${formatRupiah(difference)})`
                            : `Kurang (-${formatRupiah(Math.abs(difference))})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Catatan Penutupan */}
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">Catatan Penutupan (Opsional)</span>
                      <span className="text-slate-500">{closeNotes.length}/500</span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={500}
                      placeholder="Catatan penutupan kasir jika ada selisih atau serah terima uang..."
                      value={closeNotes}
                      onChange={(e) => setCloseNotes(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-950/80 transition cursor-pointer"
                    >
                      {submitting ? 'Menutup Kasir...' : 'Tutup Kasir'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-2.5 rounded-2xl border border-slate-700 text-slate-300 font-semibold text-xs hover:bg-slate-800 transition cursor-pointer"
                    >
                      ✕ Batal
                    </button>
                  </div>
                </form>
              ) : (
                /* --- BUKA KASIR / MULAI SHIFT MODE --- */
                <form onSubmit={handleOpenShift} className="space-y-4">
                  <div className="text-center py-2">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2 shadow-inner">
                      <Unlock className="w-7 h-7" />
                    </div>
                    <h2 className="text-base font-extrabold text-white">Mulai Shift / Buka Kasir</h2>
                    <p className="text-xs text-slate-400">
                      Masukkan modal kas awal di laci kasir sebelum melayani penjualan pelanggan
                    </p>
                  </div>

                  {/* Kas Awal Input */}
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Kas Awal di Laci (Uang Modal Kasir) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="500.000"
                        value={startingCashStr}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, '');
                          setStartingCashStr(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-base font-extrabold text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Uang pecahan kecil untuk uang kembalian pembeli (default: Rp500.000)
                    </p>
                  </div>

                  {/* Kasir Bertugas */}
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Kasir yang Bertugas
                    </label>
                    <div className="flex items-center gap-3 p-2.5 bg-slate-900 border border-slate-700 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {currentUser.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {currentUser.name}
                        </div>
                        <div className="text-[10px] text-emerald-400">
                          {currentUser.role} • {currentUser.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Catatan Pembukaan */}
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Catatan Pembukaan (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Contoh: Shift pagi buka toko material..."
                      value={openNotes}
                      onChange={(e) => setOpenNotes(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-950/80 transition cursor-pointer"
                    >
                      {submitting ? 'Membuka Shift...' : 'Mulai Shift Kasir'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-2.5 rounded-2xl border border-slate-700 text-slate-300 font-semibold text-xs hover:bg-slate-800 transition cursor-pointer"
                    >
                      ✕ Batal
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* TAB 2: RIWAYAT SHIFT TERDAHULU */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Riwayat Rekonsiliasi Shift Kasir</span>
                <span className="text-slate-500">{shiftHistory.length} shift tercatat</span>
              </div>

              {shiftHistory.length === 0 ? (
                <div className="text-center py-8 bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  Belum ada riwayat shift kasir sebelumnya
                </div>
              ) : (
                shiftHistory.map((s, idx) => {
                  const isClosed = s.status === 'CLOSED';
                  return (
                    <div
                      key={s.id || idx}
                      className="bg-slate-800/70 border border-slate-700/60 p-3.5 rounded-2xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isClosed ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'
                            }`}
                          />
                          <span className="font-bold text-white">
                            Shift #{s.shiftNumber || idx + 1} - {s.cashierName}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isClosed
                              ? 'bg-slate-700 text-slate-300'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isClosed ? 'SELESAI' : 'AKTIF'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                        <div>
                          Buka: {new Date(s.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })},{' '}
                          {new Date(s.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </div>
                        {s.endTime && (
                          <div className="text-right">
                            Tutup: {new Date(s.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-900/60 p-2.5 rounded-xl grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div>
                          <div className="text-slate-500">Kas Awal</div>
                          <div className="font-bold text-slate-200 mt-0.5">
                            {formatRupiah(s.startingCash || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Kas Masuk</div>
                          <div className="font-bold text-emerald-400 mt-0.5">
                            +{formatRupiah(s.cashSalesAmount || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Kas Aktual</div>
                          <div className="font-bold text-white mt-0.5">
                            {s.actualCash !== undefined ? formatRupiah(s.actualCash) : '-'}
                          </div>
                        </div>
                      </div>

                      {s.difference !== undefined && s.difference !== 0 && (
                        <div className="text-[11px] text-right">
                          <span className="text-slate-400">Selisih: </span>
                          <span
                            className={`font-bold ${
                              s.difference > 0 ? 'text-blue-400' : 'text-rose-400'
                            }`}
                          >
                            {s.difference > 0
                              ? `+${formatRupiah(s.difference)} (Lebih)`
                              : `-${formatRupiah(Math.abs(s.difference))} (Kurang)`}
                          </span>
                        </div>
                      )}

                      {s.closeNotes && (
                        <div className="text-[10px] text-slate-400 italic bg-slate-900/30 p-1.5 rounded-lg">
                          "{s.closeNotes}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
