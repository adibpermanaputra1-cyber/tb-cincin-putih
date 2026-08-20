import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../lib/format';
import { StoreCapitalTransaction, User } from '../types';
import { api } from '../lib/api';
import {
  ArrowLeft,
  SlidersHorizontal,
  PlusCircle,
  MinusCircle,
  Info,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  X,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
} from 'lucide-react';

interface StoreBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onBalanceUpdated?: () => void;
}

export const StoreBalanceModal: React.FC<StoreBalanceModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onBalanceUpdated,
}) => {
  const [balance, setBalance] = useState<number>(3749501);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Tanam / Tarik
  const [modalType, setModalType] = useState<'TANAM' | 'TARIK' | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'TRANSFER'>('TUNAI');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [curBal, list] = await Promise.all([
        api.getStoreBalance(),
        api.getStoreBalanceMovements(),
      ]);
      setBalance(curBal);
      setMovements(list);
    } catch (err) {
      console.error('Failed to load store balance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) {
      setErrorMsg('Masukkan jumlah nominal yang valid');
      return;
    }

    if (modalType === 'TARIK' && numAmount > balance) {
      setErrorMsg(`Saldo tidak mencukupi. Saldo saat ini: ${formatRupiah(balance)}`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.createCapitalTransaction({
        type: modalType === 'TANAM' ? 'TANAM_MODAL' : 'TARIK_MODAL',
        amount: numAmount,
        notes: notes.trim() || (modalType === 'TANAM' ? 'Tanam Modal Tambahan' : 'Prive Penarikan Modal'),
        paymentMethod,
        recordedBy: currentUser.name,
      });

      setModalType(null);
      setAmount('');
      setNotes('');
      await loadData();
      if (onBalanceUpdated) onBalanceUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMovements = movements.filter((m) => {
    if (filterType === 'TANAM' && m.type !== 'TANAM_MODAL') return false;
    if (filterType === 'TARIK' && m.type !== 'TARIK_MODAL') return false;
    if (filterType === 'PENJUALAN' && m.type !== 'PENJUALAN') return false;
    if (filterType === 'PENGELUARAN' && m.type !== 'PENGELUARAN') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title?.toLowerCase().includes(q);
      const matchSub = m.subtitle?.toLowerCase().includes(q);
      const matchNotes = m.notes?.toLowerCase().includes(q);
      if (!matchTitle && !matchSub && !matchNotes) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="bg-indigo-900/90 text-white px-5 py-4 flex items-center justify-between border-b border-indigo-700/50">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white hover:text-indigo-200 font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-base sm:text-lg">Saldo Toko</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Big Purple Saldo Banner */}
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 rounded-2xl shadow-xl text-white text-center relative overflow-hidden">
            <div className="text-indigo-200 text-xs sm:text-sm font-medium tracking-wide">
              Saldo Saat Ini
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 mb-5">
              {formatRupiah(balance)}
            </div>

            {/* Action Buttons: Tanam & Tarik Modal */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setAmount('');
                  setNotes('');
                  setModalType('TANAM');
                }}
                className="bg-white hover:bg-slate-100 active:bg-slate-200 text-indigo-900 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                <span>+ Tanam Modal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setAmount('');
                  setNotes('');
                  setModalType('TARIK');
                }}
                className="bg-indigo-950/60 hover:bg-indigo-950/80 active:bg-indigo-950 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-indigo-400/30 transition cursor-pointer"
              >
                <MinusCircle className="w-4 h-4 text-rose-400" />
                <span>- Tarik Modal</span>
              </button>
            </div>
          </div>

          {/* Yellow/Amber Info Notice matching user screenshot */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-200/90 text-xs">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Ini saldo total toko (akumulasi modal, penjualan, pembelian, pengeluaran), bukan kas di laci kasir. Untuk kas kasir aktif, lihat menu Shift.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari riwayat mutasi modal / transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'TANAM', label: 'Tanam Modal' },
                { id: 'TARIK', label: 'Tarik Modal' },
                { id: 'PENJUALAN', label: 'Penjualan' },
                { id: 'PENGELUARAN', label: 'Pengeluaran' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    filterType === tab.id
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* History Movement List */}
          <div className="space-y-2 pt-1">
            {loading ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Memuat riwayat saldo...
              </div>
            ) : filteredMovements.length === 0 ? (
              <div className="text-center py-8 bg-slate-800/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
                Belum ada data mutasi saldo yang sesuai filter
              </div>
            ) : (
              filteredMovements.map((item) => {
                const isPlus = item.isPositive;
                return (
                  <div
                    key={item.id}
                    className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 p-3.5 rounded-xl flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          item.type === 'TANAM_MODAL'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : item.type === 'TARIK_MODAL'
                            ? 'bg-rose-500/20 text-rose-400'
                            : item.type === 'PENJUALAN'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {item.type === 'PENJUALAN' ? (
                          <ShoppingCart className="w-4 h-4" />
                        ) : item.type === 'TANAM_MODAL' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : item.type === 'TARIK_MODAL' ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : (
                          <Receipt className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.subtitle} • {new Date(item.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-bold ${
                          isPlus ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPlus ? `+${formatRupiah(item.amount)}` : `-${formatRupiah(item.amount)}`}
                      </div>
                      {item.runningBalance > 0 && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Saldo: {formatRupiah(item.runningBalance)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Pop-up Form for Tanam / Tarik */}
        {modalType && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {modalType === 'TANAM' ? (
                    <>
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      <span>Tanam Modal Toko (Tambah Modal)</span>
                    </>
                  ) : (
                    <>
                      <MinusCircle className="w-4 h-4 text-rose-400" />
                      <span>Tarik Modal Toko (Prive Pemilik)</span>
                    </>
                  )}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-2.5 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmitModal} className="space-y-3.5">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">
                    Jumlah Nominal (Rp) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      value={amount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setAmount(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('TUNAI')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        paymentMethod === 'TUNAI'
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Uang Tunai (Cash)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('TRANSFER')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        paymentMethod === 'TRANSFER'
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Transfer Rekening
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">
                    Keterangan / Catatan
                  </label>
                  <input
                    type="text"
                    placeholder={
                      modalType === 'TANAM'
                        ? 'Contoh: Setoran modal tambahan dari bank BCA'
                        : 'Contoh: Penarikan prive pemilik keperluan pribadi'
                    }
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-lg cursor-pointer ${
                      modalType === 'TANAM'
                        ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-950/60'
                        : 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 shadow-rose-950/60'
                    }`}
                  >
                    {submitting ? 'Memproses...' : modalType === 'TANAM' ? 'Simpan Setoran' : 'Konfirmasi Tarik'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
