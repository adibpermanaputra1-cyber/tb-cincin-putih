import React, { useState } from 'react';
import { SupplierPayable, User } from '../types';
import { formatRupiah, formatIndonesianDate, formatDateOnly } from '../lib/format';
import { api } from '../lib/api';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Truck,
  X,
} from 'lucide-react';

interface PayablesModuleProps {
  payables: SupplierPayable[];
  currentUser: User;
  onRefresh: () => void;
}

export const PayablesModule: React.FC<PayablesModuleProps> = ({
  payables,
  currentUser,
  onRefresh,
}) => {
  const [selectedPayable, setSelectedPayable] = useState<SupplierPayable | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'TUNAI' | 'TRANSFER'>('TRANSFER');
  const [payNotes, setPayNotes] = useState('');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalOutstanding = payables.reduce((sum, p) => sum + p.remainingAmount, 0);
  const totalPaid = payables.reduce((sum, p) => sum + p.paidAmount, 0);

  const handleOpenPayModal = (pay: SupplierPayable) => {
    setSelectedPayable(pay);
    setPayAmount(pay.remainingAmount);
    setPayMethod('TRANSFER');
    setPayNotes('Pembayaran Tempo Supplier');
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable || payAmount <= 0) {
      alert('Masukkan nominal pembayaran!');
      return;
    }
    setSubmitting(true);

    try {
      await api.payPayable(selectedPayable.id, {
        amount: payAmount,
        paymentMethod: payMethod,
        paidBy: currentUser.name,
        notes: payNotes,
      });

      setIsPayModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses pembayaran utang supplier');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Sisa Utang Usaha ke Supplier</div>
            <div className="text-xl font-extrabold text-amber-400 mt-1">
              {formatRupiah(totalOutstanding)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {payables.filter((p) => p.remainingAmount > 0).length} Faktur Supplier Aktif
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Utang Sudah Dilunasi</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              {formatRupiah(totalPaid)}
            </div>
            <div className="text-[11px] text-emerald-500/90 mt-0.5">Kas Keluar Terverifikasi</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Komitmen Pengadaan</div>
            <div className="text-xl font-extrabold text-white mt-1">
              {formatRupiah(totalOutstanding + totalPaid)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Buku Utang Accurate</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              Buku Utang Usaha ke Distributor Bahan Bangunan
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola jadwal pembayaran tempo dan cegah denda keterlambatan pengiriman material.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">No. PO</th>
                <th className="p-3.5">Nama Supplier / Distributor</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Jatuh Tempo</th>
                <th className="p-3.5 text-right">Total Tagihan</th>
                <th className="p-3.5 text-right">Sudah Dibayar</th>
                <th className="p-3.5 text-right">Sisa Utang</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {payables.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    Tidak ada catatan utang supplier saat ini.
                  </td>
                </tr>
              ) : (
                payables.map((p) => {
                  const isSettled = p.remainingAmount <= 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-850/50 transition">
                      <td className="p-3.5 font-mono font-bold text-slate-300">
                        {p.poNumber}
                      </td>
                      <td className="p-3.5 font-bold text-white max-w-xs">
                        {p.supplierName}
                      </td>
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">
                        {formatIndonesianDate(p.transactionDate)}
                      </td>
                      <td className="p-3.5 text-slate-300 font-semibold whitespace-nowrap">
                        {formatDateOnly(p.dueDate)}
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-300">
                        {formatRupiah(p.totalAmount)}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-emerald-400">
                        {formatRupiah(p.paidAmount)}
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-amber-400">
                        {formatRupiah(p.remainingAmount)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isSettled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : p.paidAmount > 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {isSettled ? 'LUNAS' : p.paidAmount > 0 ? 'DICICIL' : 'BELUM DIBAYAR'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {!isSettled && (
                          <button
                            onClick={() => handleOpenPayModal(p)}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <span>Bayar Utang</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: BAYAR UTANG SUPPLIER */}
      {isPayModalOpen && selectedPayable && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">Bayar Utang ke Supplier Material</h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Supplier:</span>
                  <span className="font-bold text-white">{selectedPayable.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">No. PO:</span>
                  <span className="font-mono text-purple-400">{selectedPayable.poNumber}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-slate-800">
                  <span className="text-slate-300">Sisa Utang:</span>
                  <span className="text-amber-400">{formatRupiah(selectedPayable.remainingAmount)}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Jumlah Pembayaran (Rp) *
                </label>
                <input
                  type="number"
                  min="1000"
                  max={selectedPayable.remainingAmount}
                  required
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-base font-extrabold text-purple-400 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Metode Pembayaran *
                </label>
                <select
                  value={payMethod}
                  onChange={(e: any) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                >
                  <option value="TRANSFER">Transfer Bank Toko</option>
                  <option value="TUNAI">Kas Tunai Toko</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Catatan Pembayaran
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Transfer via Bank Mandiri Toko"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-purple-950/50"
                >
                  {submitting ? 'Memproses...' : 'Konfirmasi Kas Keluar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
