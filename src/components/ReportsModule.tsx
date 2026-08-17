import React, { useState, useEffect } from 'react';
import { FinancialReport, SaleTransaction, User } from '../types';
import { formatRupiah, formatNumber, formatIndonesianDate } from '../lib/format';
import { api } from '../lib/api';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface ReportsModuleProps {
  currentUser: User;
  sales: SaleTransaction[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ currentUser, sales }) => {
  const [activeTab, setActiveTab] = useState<'LABA_RUGI' | 'ARUS_KAS' | 'KASIR_SALES'>('LABA_RUGI');
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of this month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const data = await api.getFinancialReports(startDate, endDate);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;
    let csv = `LAPORAN KEUANGAN TB. CINCIN PUTIH\n`;
    csv += `Periode: ${startDate} s/d ${endDate}\n\n`;
    csv += `KOMPONEN,NOMINAL (RP)\n`;
    csv += `Pendapatan Penjualan Material,${report.profitAndLoss.totalRevenue}\n`;
    csv += `HPP (Harga Pokok Penjualan),${report.profitAndLoss.cogs}\n`;
    csv += `LABA KOTOR,${report.profitAndLoss.grossProfit}\n`;
    csv += `Beban Operasional Usaha,${report.profitAndLoss.totalExpenses}\n`;
    csv += `LABA BERSIH BERJALAN,${report.profitAndLoss.netProfit}\n\n`;
    csv += `RINCIAN BEBAN OPERASIONAL\n`;
    csv += `Gaji Karyawan,${report.profitAndLoss.expenseBreakdown.salaries}\n`;
    csv += `Solar & Armada Truk,${report.profitAndLoss.expenseBreakdown.fuelAndTransport}\n`;
    csv += `Listrik Air & Internet,${report.profitAndLoss.expenseBreakdown.utilities}\n`;
    csv += `Sewa Tempat,${report.profitAndLoss.expenseBreakdown.rent}\n`;
    csv += `Konsumsi & Kuli,${report.profitAndLoss.expenseBreakdown.consumption}\n`;
    csv += `Lainnya,${report.profitAndLoss.expenseBreakdown.others}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Keuangan_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Laporan Keuangan & Akuntansi Standar Accurate
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Hitungan real-time HPP, Laba Kotor, Laba Bersih, Arus Kas Toko, dan Rekapitulasi Kasir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub Navigation */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('LABA_RUGI')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'LABA_RUGI'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Laba Rugi (P&L)
            </button>
            <button
              onClick={() => setActiveTab('ARUS_KAS')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'ARUS_KAS'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Arus Kas (Cash Flow)
            </button>
            <button
              onClick={() => setActiveTab('KASIR_SALES')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'KASIR_SALES'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rekap Penjualan
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">Filter Rentang Waktu:</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white outline-none focus:border-emerald-500"
          />
          <span className="text-slate-500">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white outline-none focus:border-emerald-500"
          />
          <button
            onClick={fetchFinancials}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1 rounded-lg transition cursor-pointer"
          >
            Terapkan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-900 p-12 rounded-2xl border border-slate-800 text-center text-slate-400">
          Menghitung data pembukuan keuangan toko...
        </div>
      ) : !report ? (
        <div className="bg-slate-900 p-12 rounded-2xl border border-slate-800 text-center text-slate-500">
          Gagal memuat laporan keuangan.
        </div>
      ) : (
        <>
          {/* TAB 1: LABA RUGI ACCURATE */}
          {activeTab === 'LABA_RUGI' && (
            <div className="space-y-6">
              
              {/* Highlight Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Total Pendapatan Material</div>
                  <div className="text-lg font-extrabold text-white mt-1">
                    {formatRupiah(report.profitAndLoss.totalRevenue)}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Penjualan Retail & Grosir</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Harga Pokok Penjualan (HPP)</div>
                  <div className="text-lg font-extrabold text-rose-400 mt-1">
                    {formatRupiah(report.profitAndLoss.cogs)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Modal Dasar Material Terjual</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Laba Kotor (Gross Profit)</div>
                  <div className="text-lg font-extrabold text-blue-400 mt-1">
                    {formatRupiah(report.profitAndLoss.grossProfit)}
                  </div>
                  <div className="text-[10px] text-blue-300 mt-0.5">
                    Margin: {report.profitAndLoss.totalRevenue > 0
                      ? ((report.profitAndLoss.grossProfit / report.profitAndLoss.totalRevenue) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Laba Bersih Usaha (Net)</div>
                  <div
                    className={`text-lg font-extrabold mt-1 ${
                      report.profitAndLoss.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatRupiah(report.profitAndLoss.netProfit)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Setelah Beban Operasional</div>
                </div>
              </div>

              {/* Detailed P&L Statement */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-white">
                    Laporan Laba Rugi Komprehensif (Accurate Style)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Periode: {formatIndonesianDate(startDate)} s/d {formatIndonesianDate(endDate)}
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Revenue Section */}
                  <div>
                    <div className="font-bold text-slate-300 text-sm mb-2 flex justify-between">
                      <span>I. PENDAPATAN USAHA (REVENUE)</span>
                      <span>{formatRupiah(report.profitAndLoss.totalRevenue)}</span>
                    </div>
                    <div className="pl-4 space-y-1.5 text-slate-400">
                      <div className="flex justify-between">
                        <span>• Penjualan Tunai / Kas Langsung</span>
                        <span className="text-slate-200">
                          {formatRupiah(report.cashFlow.cashInflow.cashSales)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Penjualan Non-Tunai / Kasbon (Tempo)</span>
                        <span className="text-slate-200">
                          {formatRupiah(
                            Math.max(0, report.profitAndLoss.totalRevenue - report.cashFlow.cashInflow.cashSales)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* COGS Section */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="font-bold text-slate-300 text-sm mb-2 flex justify-between">
                      <span>II. HARGA POKOK PENJUALAN (HPP)</span>
                      <span className="text-rose-400">({formatRupiah(report.profitAndLoss.cogs)})</span>
                    </div>
                    <div className="pl-4 text-slate-400 flex justify-between">
                      <span>• Modal Pokok Material yang Terjual (FIFO Standar)</span>
                      <span className="text-rose-400">{formatRupiah(report.profitAndLoss.cogs)}</span>
                    </div>
                  </div>

                  {/* Gross Profit Line */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center font-bold text-sm">
                    <span className="text-emerald-400">LABA KOTOR (GROSS PROFIT)</span>
                    <span className="text-emerald-400">{formatRupiah(report.profitAndLoss.grossProfit)}</span>
                  </div>

                  {/* Operational Expenses Section */}
                  <div className="pt-2">
                    <div className="font-bold text-slate-300 text-sm mb-2 flex justify-between">
                      <span>III. BEBAN OPERASIONAL USAHA (OPEX)</span>
                      <span className="text-orange-400">({formatRupiah(report.profitAndLoss.totalExpenses)})</span>
                    </div>
                    <div className="pl-4 space-y-1.5 text-slate-400">
                      <div className="flex justify-between">
                        <span>• Gaji & Upah Karyawan / Pramuniaga</span>
                        <span className="text-slate-300">{formatRupiah(report.profitAndLoss.expenseBreakdown.salaries)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Bahan Bakar (Bensin/Solar) Armada Pengiriman</span>
                        <span className="text-slate-300">{formatRupiah(report.profitAndLoss.expenseBreakdown.fuelAndTransport)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Listrik, Air PDAM & Internet Toko</span>
                        <span className="text-slate-300">{formatRupiah(report.profitAndLoss.expenseBreakdown.utilities)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Sewa Tempat, Toko & Gudang Bahan</span>
                        <span className="text-slate-300">{formatRupiah(report.profitAndLoss.expenseBreakdown.rent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Konsumsi Harian & Upah Kuli Bongkar Muat</span>
                        <span className="text-slate-300">{formatRupiah(report.profitAndLoss.expenseBreakdown.consumption)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Pemeliharaan Armada & Operasional Lainnya</span>
                        <span className="text-slate-300">{formatRupiah(report.profitAndLoss.expenseBreakdown.others)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Profit Line */}
                  <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl flex justify-between items-center font-extrabold text-base">
                    <span className="text-emerald-300">LABA BERSIH BERJALAN (NET OPERATING PROFIT)</span>
                    <span className="text-emerald-400">{formatRupiah(report.profitAndLoss.netProfit)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARUS KAS (CASH FLOW) */}
          {activeTab === 'ARUS_KAS' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Total Uang Kas Masuk</div>
                  <div className="text-xl font-extrabold text-emerald-400 mt-1">
                    {formatRupiah(report.cashFlow.cashInflow.total)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Penjualan Tunai + Tagihan Piutang</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Total Uang Kas Keluar</div>
                  <div className="text-xl font-extrabold text-rose-400 mt-1">
                    {formatRupiah(report.cashFlow.cashOutflow.total)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Belanja Material + Utang + Beban</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Surplus / Arus Kas Bersih</div>
                  <div
                    className={`text-xl font-extrabold mt-1 ${
                      report.cashFlow.netCashFlow >= 0 ? 'text-blue-400' : 'text-rose-400'
                    }`}
                  >
                    {formatRupiah(report.cashFlow.netCashFlow)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Likuiditas Kas Toko</div>
                </div>
              </div>

              {/* Cash Flow Statement Table */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5 text-xs">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-white">
                    Laporan Arus Kas Masuk & Keluar Riil
                  </h3>
                  <p className="text-xs text-slate-400">
                    Memantau uang fisik dan transfer yang benar-benar masuk dan keluar dari kasir/bank.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* INFLOW */}
                  <div>
                    <div className="font-bold text-emerald-400 text-sm mb-2 flex justify-between">
                      <span className="flex items-center gap-1.5">
                        <ArrowDownRight className="w-4 h-4" /> ARUS KAS MASUK (CASH INFLOW)
                      </span>
                      <span>{formatRupiah(report.cashFlow.cashInflow.total)}</span>
                    </div>
                    <div className="pl-4 space-y-1.5 text-slate-300">
                      <div className="flex justify-between">
                        <span>• Penjualan Tunai / QRIS / Debit Langsung Kasir</span>
                        <span>{formatRupiah(report.cashFlow.cashInflow.cashSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Pelunasan Kasbon & Piutang dari Mandor/Kontraktor</span>
                        <span>{formatRupiah(report.cashFlow.cashInflow.receivablesCollected)}</span>
                      </div>
                    </div>
                  </div>

                  {/* OUTFLOW */}
                  <div className="pt-3 border-t border-slate-800">
                    <div className="font-bold text-rose-400 text-sm mb-2 flex justify-between">
                      <span className="flex items-center gap-1.5">
                        <ArrowUpRight className="w-4 h-4" /> ARUS KAS KELUAR (CASH OUTFLOW)
                      </span>
                      <span>({formatRupiah(report.cashFlow.cashOutflow.total)})</span>
                    </div>
                    <div className="pl-4 space-y-1.5 text-slate-300">
                      <div className="flex justify-between">
                        <span>• Pembelian Tunai Material Bangunan ke Distributor</span>
                        <span>{formatRupiah(report.cashFlow.cashOutflow.cashPurchases)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Pelunasan Utang Usaha ke Supplier</span>
                        <span>{formatRupiah(report.cashFlow.cashOutflow.payablesPaid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Pembayaran Beban & Biaya Operasional Toko</span>
                        <span>{formatRupiah(report.cashFlow.cashOutflow.operatingExpenses)}</span>
                      </div>
                    </div>
                  </div>

                  {/* NET FLOW */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center font-extrabold text-sm">
                    <span className="text-white">SALDO KAS BERSIH (NET CASH SURPLUS / DEFICIT)</span>
                    <span
                      className={
                        report.cashFlow.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }
                    >
                      {formatRupiah(report.cashFlow.netCashFlow)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REKAP PENJUALAN KASIR */}
          {activeTab === 'KASIR_SALES' && (
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 font-bold text-sm text-white flex justify-between items-center">
                  <span>Daftar Transaksi Kasir Periode Terpilih</span>
                  <span className="text-xs text-slate-400 font-normal">
                    Total: {sales.length} Faktur Penjualan
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">No. Invoice</th>
                        <th className="p-3.5">Waktu</th>
                        <th className="p-3.5">Pelanggan</th>
                        <th className="p-3.5">Rincian Item</th>
                        <th className="p-3.5 text-right">Subtotal</th>
                        <th className="p-3.5 text-right">Diskon</th>
                        <th className="p-3.5 text-right">Ongkir</th>
                        <th className="p-3.5 text-right">Total Akhir</th>
                        <th className="p-3.5">Metode Bayar</th>
                        <th className="p-3.5">Kasir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {sales.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-10 text-center text-slate-500">
                            Belum ada transaksi penjualan pada rentang tanggal ini.
                          </td>
                        </tr>
                      ) : (
                        sales.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-850/50 transition">
                            <td className="p-3.5 font-mono font-bold text-emerald-400">
                              {s.invoiceNo}
                            </td>
                            <td className="p-3.5 text-slate-400 whitespace-nowrap">
                              {formatIndonesianDate(s.date)}
                            </td>
                            <td className="p-3.5 font-bold text-white max-w-xs">
                              <div>{s.customerName}</div>
                              {s.deliveryAddress && (
                                <div className="text-[10px] text-slate-500 font-normal truncate">
                                  Kirim: {s.deliveryAddress}
                                </div>
                              )}
                            </td>
                            <td className="p-3.5">
                              <div className="space-y-0.5 max-w-xs">
                                {s.items.map((it, idx) => (
                                  <div key={idx} className="text-[11px] text-slate-300">
                                    • {it.productName} ({formatNumber(it.quantity)} {it.unit})
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-3.5 text-right text-slate-300 font-medium">
                              {formatRupiah(s.subtotal)}
                            </td>
                            <td className="p-3.5 text-right text-rose-400 font-medium">
                              {s.discountAmount > 0 ? `-${formatRupiah(s.discountAmount)}` : '-'}
                            </td>
                            <td className="p-3.5 text-right text-blue-400 font-medium">
                              {s.deliveryFee > 0 ? `+${formatRupiah(s.deliveryFee)}` : '-'}
                            </td>
                            <td className="p-3.5 text-right font-extrabold text-white">
                              {formatRupiah(s.totalAmount)}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  s.paymentMethod === 'TEMPO'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {s.paymentMethod}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-400">{s.cashierName}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};
