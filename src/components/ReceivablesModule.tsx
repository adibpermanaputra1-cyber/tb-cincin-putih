import React, { useState } from 'react';
import { CustomerReceivable, User, StoreSettings, SaleTransaction } from '../types';
import { formatRupiah, formatIndonesianDate, formatDateOnly } from '../lib/format';
import { api } from '../lib/api';
import { ReceiptModal } from './ReceiptModal';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  ArrowRight,
  Receipt,
  Share2,
  Printer,
  X,
} from 'lucide-react';

interface ReceivablesModuleProps {
  receivables: CustomerReceivable[];
  currentUser: User;
  settings?: StoreSettings;
  onRefresh: () => void;
}

export const ReceivablesModule: React.FC<ReceivablesModuleProps> = ({
  receivables,
  currentUser,
  settings,
  onRefresh,
}) => {
  const [selectedReceivable, setSelectedReceivable] = useState<CustomerReceivable | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'TUNAI' | 'TRANSFER' | 'QRIS'>('TUNAI');
  const [payNotes, setPayNotes] = useState('');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BELUM_LUNAS' | 'LUNAS'>('ALL');
  const [previewTransaction, setPreviewTransaction] = useState<SaleTransaction | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const totalOutstanding = receivables.reduce((sum, r) => sum + r.remainingAmount, 0);
  const totalCollected = receivables.reduce((sum, r) => sum + r.paidAmount, 0);

  const filtered = receivables.filter((r) => {
    if (statusFilter === 'BELUM_LUNAS') return r.remainingAmount > 0;
    if (statusFilter === 'LUNAS') return r.remainingAmount <= 0;
    return true;
  });

  const handleOpenPayModal = (rec: CustomerReceivable) => {
    setSelectedReceivable(rec);
    setPayAmount(rec.remainingAmount);
    setPayMethod('TUNAI');
    setPayNotes('Pelunasan Kasbon');
    setIsPayModalOpen(true);
  };

  const handlePrintKasbonInvoice = async (rec: CustomerReceivable) => {
    setLoadingInvoice(true);
    try {
      const allSales = await api.getSales();
      const matched = allSales.find((s) => s.invoiceNo === rec.invoiceNo || s.id === rec.invoiceId);
      if (matched) {
        setPreviewTransaction(matched);
      } else {
        // Construct fallback transaction representation
        const fallbackSale: SaleTransaction = {
          id: rec.invoiceId || rec.id,
          invoiceNo: rec.invoiceNo,
          date: rec.transactionDate,
          cashierId: currentUser.id,
          cashierName: currentUser.name,
          customerName: rec.customerName,
          customerPhone: rec.customerPhone,
          customerAddress: rec.customerAddress,
          items: [
            {
              productId: 'material_custom',
              productName: 'Material Bangunan (Sesuai Bon)',
              sku: 'MAT-BON',
              unit: 'Paket',
              multiplier: 1,
              quantity: 1,
              baseQuantity: 1,
              unitPrice: rec.totalAmount,
              buyPrice: 0,
              discount: 0,
              subtotal: rec.totalAmount,
              profit: 0,
            },
          ],
          subtotal: rec.totalAmount,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          deliveryFee: 0,
          grandTotal: rec.totalAmount,
          totalHpp: 0,
          grossProfit: 0,
          paymentMethod: 'KASBON',
          paymentStatus: rec.remainingAmount <= 0 ? 'LUNAS' : rec.paidAmount > 0 ? 'SEBAGIAN' : 'BELUM_LUNAS',
          paidAmount: rec.paidAmount,
          remainingAmount: rec.remainingAmount,
          cashPaid: rec.paidAmount,
          changeDue: 0,
          dueDate: rec.dueDate,
          notes: rec.notes,
        };
        setPreviewTransaction(fallbackSale);
      }
    } catch (e) {
      alert('Gagal memuat rincian nota kasbon');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceivable || payAmount <= 0) {
      alert('Masukkan nominal pembayaran!');
      return;
    }
    setSubmitting(true);

    try {
      await api.payReceivable(selectedReceivable.id, {
        amount: payAmount,
        paymentMethod: payMethod,
        receivedBy: currentUser.name,
        notes: payNotes,
      });

      setIsPayModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses pembayaran piutang');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReminderWA = (r: CustomerReceivable) => {
    if (!r.customerPhone) {
      alert('Nomor HP pelanggan belum terdaftar pada nota ini.');
      return;
    }
    const cleanPhone = r.customerPhone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;

    let msg = `Halo Bapak/Ibu *${r.customerName}*,\n`;
    msg += `Kami dari *Toko Bangunan Ahmad Junaidi* menginformasikan mengenai kasbon material nota *${r.invoiceNo}*.\n`;
    msg += `Total Tagihan: ${formatRupiah(r.totalAmount)}\n`;
    msg += `Sudah Dibayar: ${formatRupiah(r.paidAmount)}\n`;
    msg += `*SISA PIUTANG: ${formatRupiah(r.remainingAmount)}*\n`;
    if (r.dueDate) msg += `Jatuh Tempo: ${formatDateOnly(r.dueDate)}\n`;
    msg += `Pembayaran dapat ditransfer ke rekening toko BCA 8801-2345-678 a.n Ahmad Junaidi atau tunai ke toko.\n`;
    msg += `Terima kasih atas kerja samanya! 🙏`;

    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Kasbon Belum Lunas</div>
            <div className="text-xl font-extrabold text-rose-400 mt-1">
              {formatRupiah(totalOutstanding)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {receivables.filter((r) => r.remainingAmount > 0).length} Pelanggan Tertagih
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Piutang Berhasil Ditagih</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              {formatRupiah(totalCollected)}
            </div>
            <div className="text-[11px] text-emerald-500/90 mt-0.5">Kas Masuk ke Toko</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Akumulasi Piutang</div>
            <div className="text-xl font-extrabold text-white mt-1">
              {formatRupiah(totalOutstanding + totalCollected)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Buku Piutang Accurate</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Buku Piutang & Kasbon Pelanggan (Mandor / Kontraktor)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Setiap pembayaran cicilan/pelunasan otomatis mencatat uang masuk ke kas toko.
            </p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'ALL' ? 'bg-emerald-600 text-white' : 'text-slate-400'
              }`}
            >
              Semua ({receivables.length})
            </button>
            <button
              onClick={() => setStatusFilter('BELUM_LUNAS')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'BELUM_LUNAS' ? 'bg-rose-600 text-white' : 'text-slate-400'
              }`}
            >
              Belum Lunas
            </button>
            <button
              onClick={() => setStatusFilter('LUNAS')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'LUNAS' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              Lunas
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Faktur</th>
                <th className="p-3.5">Nama Pelanggan</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Jatuh Tempo</th>
                <th className="p-3.5 text-right">Total Tagihan</th>
                <th className="p-3.5 text-right">Sudah Dibayar</th>
                <th className="p-3.5 text-right">Sisa Piutang</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    Tidak ada catatan piutang pada filter ini.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isSettled = r.remainingAmount <= 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-850/50 transition">
                      <td className="p-3.5 font-mono font-bold text-slate-300">
                        {r.invoiceNo}
                      </td>
                      <td className="p-3.5 font-bold text-white max-w-xs">
                        <div>{r.customerName}</div>
                        {r.customerPhone && (
                          <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{r.customerPhone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">
                        {formatIndonesianDate(r.transactionDate)}
                      </td>
                      <td className="p-3.5 text-slate-300 font-semibold whitespace-nowrap">
                        {formatDateOnly(r.dueDate)}
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-300">
                        {formatRupiah(r.totalAmount)}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-emerald-400">
                        {formatRupiah(r.paidAmount)}
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-rose-400">
                        {formatRupiah(r.remainingAmount)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isSettled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : r.paidAmount > 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {isSettled ? 'LUNAS' : r.paidAmount > 0 ? 'CICILAN (SEBAGIAN)' : 'BELUM BAYAR'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handlePrintKasbonInvoice(r)}
                            title="Cetak Nota / Bon Kasbon"
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition cursor-pointer flex items-center gap-1 text-xs font-semibold min-h-[38px]"
                          >
                            <Printer className="w-4 h-4" />
                            <span>Bon</span>
                          </button>

                          {!isSettled && (
                            <button
                              onClick={() => handleOpenPayModal(r)}
                              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer min-h-[38px] shadow-sm"
                            >
                              <span>Bayar</span>
                            </button>
                          )}

                          {r.customerPhone && !isSettled && (
                            <button
                              onClick={() => handleSendReminderWA(r)}
                              title="Kirim Tagihan WhatsApp"
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECEIPT MODAL UNTUK CETAK BON KASBON / PELUNASAN */}
      {previewTransaction && (
        <ReceiptModal
          transaction={previewTransaction}
          settings={settings}
          onClose={() => setPreviewTransaction(null)}
        />
      )}

      {/* MODAL: BAYAR / PELUNASAN PIUTANG */}
      {isPayModalOpen && selectedReceivable && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">Pembayaran Kasbon / Piutang</h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pelanggan:</span>
                  <span className="font-bold text-white">{selectedReceivable.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">No. Faktur:</span>
                  <span className="font-mono text-emerald-400">{selectedReceivable.invoiceNo}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-slate-800">
                  <span className="text-slate-300">Sisa Piutang:</span>
                  <span className="text-rose-400">{formatRupiah(selectedReceivable.remainingAmount)}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Jumlah Pembayaran (Rp) *
                </label>
                <input
                  type="number"
                  min="1000"
                  max={selectedReceivable.remainingAmount}
                  required
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-base font-extrabold text-emerald-400 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Metode Pembayaran *
                </label>
                <select
                  value={payMethod}
                  onChange={(e: any) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                >
                  <option value="TUNAI">Kas Tunai</option>
                  <option value="TRANSFER">Transfer Bank (BCA / Mandiri)</option>
                  <option value="QRIS">QRIS Dinamis Toko</option>
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
                  placeholder="e.g. Cicilan kedua via Mandiri"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
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
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50"
                >
                  {submitting ? 'Memproses...' : 'Konfirmasi Uang Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
