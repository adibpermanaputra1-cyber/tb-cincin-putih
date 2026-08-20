import React, { useRef, useState } from 'react';
import { SaleTransaction, StoreSettings } from '../types';
import { formatRupiah, formatIndonesianDate, formatDateOnly } from '../lib/format';
import {
  Printer,
  Share2,
  CheckCircle2,
  X,
  Truck,
  Copy,
  Check,
  ExternalLink,
  Bluetooth,
  Smartphone,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { generateEscPosReceipt, printBluetoothEscPos, printViaRawBT } from '../lib/escpos';

interface ReceiptModalProps {
  transaction: SaleTransaction;
  settings?: StoreSettings;
  onClose: () => void;
}

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'TB. Cincin Putih',
  tagline: 'Bahan Bangunan & Material Terlengkap',
  ownerName: 'Pak Ahmad & Buk Maesaroh',
  address: 'Jl. Raya Industri No. 88, Cikarang, Bekasi',
  phone: '0812-3456-7890',
  email: 'tbcincinputih@gmail.com',
  bankAccount: 'BCA 1234567890 a/n TB Cincin Putih',
  footerNote: 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan tanpa nota.',
  qrisInstruction: 'Scan QRIS untuk pembayaran instan',
  defaultTaxRate: 0,
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  settings,
  onClose,
}) => {
  const safeSettings = settings || DEFAULT_STORE_SETTINGS;
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [btStatus, setBtStatus] = useState<string | null>(null);
  const [btLoading, setBtLoading] = useState(false);
  const [btError, setBtError] = useState<string | null>(null);

  const getReceiptHtml = () => {
    const isKasbon = transaction.paymentMethod === 'KASBON';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${isKasbon ? 'BON KASBON' : 'NOTA'} #${transaction.invoiceNo}</title>
          <style>
            @page {
              size: 58mm auto;
              margin: 0;
            }
            @media print {
              html, body {
                width: 58mm;
                margin: 0 !important;
                padding: 0 !important;
              }
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              line-height: 1.35;
              color: #000;
              background: #fff;
              margin: 0 auto;
              padding: 6px 4px;
              width: 100%;
              max-width: 58mm;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .divider {
              border-bottom: 1px dashed #000;
              margin: 5px 0;
            }
            .double-divider {
              border-bottom: 2px dashed #000;
              margin: 6px 0;
            }
            .kasbon-banner {
              border: 1px dashed #000;
              padding: 3px 2px;
              margin: 4px 0;
              text-align: center;
              font-weight: 900;
              font-size: 11px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            .item-row {
              margin-bottom: 4px;
            }
            .store-title {
              font-size: 13px;
              font-weight: 900;
              margin-bottom: 2px;
            }
            .store-sub {
              font-size: 10px;
              line-height: 1.2;
            }
            .total-row {
              font-size: 13px;
              font-weight: 900;
              margin-top: 4px;
              padding-top: 4px;
              border-top: 1px solid #000;
            }
            .sig-box {
              margin-top: 14px;
              display: flex;
              justify-content: space-between;
              text-align: center;
              font-size: 9px;
            }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div class="store-title uppercase">${safeSettings.storeName}</div>
            <div class="store-sub">${safeSettings.tagline}</div>
            <div class="store-sub">${safeSettings.address}</div>
            <div class="store-sub">Telp: ${safeSettings.phone}</div>
          </div>

          ${isKasbon ? `<div class="kasbon-banner">*** NOTA BON KASBON / HUTANG ***</div>` : ''}

          <div class="double-divider"></div>

          <div class="row"><span>No. Faktur:</span><span class="font-bold">${transaction.invoiceNo}</span></div>
          <div class="row"><span>Tanggal:</span><span>${formatIndonesianDate(transaction.date)}</span></div>
          <div class="row"><span>Kasir:</span><span>${transaction.cashierName}</span></div>
          <div class="row"><span>Pelanggan:</span><span class="font-bold">${transaction.customerName}</span></div>
          ${transaction.customerPhone ? `<div class="row"><span>No. Telp:</span><span>${transaction.customerPhone}</span></div>` : ''}
          ${transaction.customerAddress ? `<div class="row"><span>Alamat:</span><span>${transaction.customerAddress}</span></div>` : ''}

          <div class="divider"></div>
          <div class="row font-bold" style="font-size: 10px;">
            <span>RINCIAN MATERIAL</span>
            <span>SUBTOTAL</span>
          </div>
          <div class="divider"></div>

          ${(transaction.items || (transaction as any).cart || [])
            .map(
              (item: any) => {
                const rawName = item.productName || item.name || item.nama_barang || item.nama || 'Barang Material';
                const rawQty = Number(item.quantity ?? item.qty ?? item.jumlah ?? 1);
                const rawUnit = item.unit || item.sellingUnit || item.selectedUnit || item.satuan || 'Pcs';
                const rawPrice = Number(item.unitPrice ?? item.activePrice ?? item.price ?? item.harga ?? item.sellPrice ?? 0);
                const rawSubtotal = Number(item.subtotal ?? (rawQty * rawPrice));
                return `
            <div class="item-row">
              <div class="font-bold">${rawName}</div>
              <div class="row" style="font-size: 10px; color: #333;">
                <span>${rawQty} ${rawUnit} x ${formatRupiah(rawPrice)}</span>
                <span class="font-bold" style="color: #000;">${formatRupiah(rawSubtotal)}</span>
              </div>
            </div>
          `;
              }
            )
            .join('')}

          <div class="divider"></div>

          <div class="row"><span>Subtotal:</span><span>${formatRupiah(transaction.subtotal)}</span></div>
          ${transaction.discountAmount > 0 ? `<div class="row"><span>Diskon:</span><span>-${formatRupiah(transaction.discountAmount)}</span></div>` : ''}
          ${transaction.deliveryFee > 0 ? `<div class="row"><span>Ongkir Armada:</span><span>${formatRupiah(transaction.deliveryFee)}</span></div>` : ''}
          
          <div class="row total-row">
            <span>TOTAL TAGIHAN:</span>
            <span>${formatRupiah(transaction.grandTotal)}</span>
          </div>

          <div class="divider"></div>
          
          ${
            isKasbon
              ? `
            <div class="row font-bold"><span>Status:</span><span>BELUM LUNAS (KASBON)</span></div>
            <div class="row"><span>DP / Uang Muka:</span><span>${formatRupiah(transaction.paidAmount)}</span></div>
            <div class="row font-bold" style="font-size: 12px; border-top: 1px dashed #000; padding-top: 3px;">
              <span>SISA PIUTANG:</span>
              <span>${formatRupiah(transaction.remainingAmount)}</span>
            </div>
            ${transaction.dueDate ? `<div class="row font-bold" style="margin-top: 3px; font-size: 10px;"><span>Jatuh Tempo:</span><span>${formatDateOnly(transaction.dueDate)}</span></div>` : ''}
          `
              : `
            <div class="row font-bold"><span>Metode Bayar:</span><span>${transaction.paymentMethod}</span></div>
            <div class="row"><span>Tunai Diterima:</span><span>${formatRupiah(transaction.cashPaid)}</span></div>
            <div class="row font-bold"><span>Kembalian:</span><span>${formatRupiah(transaction.changeDue)}</span></div>
          `
          }

          ${
            isKasbon
              ? `
            <div class="sig-box">
              <div style="width: 48%;">
                <div>Tanda Tangan Penerima,</div>
                <div style="margin-top: 28px;">( .................... )</div>
              </div>
              <div style="width: 48%;">
                <div>Hormat Kami,</div>
                <div style="margin-top: 28px;">( ${transaction.cashierName || 'Kasir'} )</div>
              </div>
            </div>
          `
              : ''
          }

          <div class="double-divider"></div>
          <div class="text-center" style="font-size: 9px;">
            <div>${safeSettings.receiptFooter || safeSettings.footerNote}</div>
            ${
              safeSettings.bankAccounts && safeSettings.bankAccounts.length > 0
                ? `<div style="margin-top: 4px; font-weight: bold;">
                    ${safeSettings.bankAccounts.map((b) => `<div>${b.bankName}: ${b.accountNumber} (a.n ${b.holderName})</div>`).join('')}
                   </div>`
                : `<div style="margin-top: 3px; font-weight: bold;">${safeSettings.bankAccount}</div>`
            }
            <div style="margin-top: 4px; color: #666; font-size: 8px;">POS TB. Cincin Putih</div>
          </div>
        </body>
      </html>
    `;
  };

  // Check if running inside iframe
  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Direct Standard Browser Print
  const handlePrint = () => {
    try {
      window.print();
    } catch {
      handleOpenPrintWindow();
    }
  };

  // Open in standalone full tab to bypass iframe Bluetooth / Print sandbox
  const handleOpenStandalone = () => {
    try {
      window.open(window.location.href, '_blank');
    } catch {
      // fallback
    }
  };

  // Dedicated Print Tab / Window (Bypass iFrame sandbox)
  const handleOpenPrintWindow = () => {
    try {
      const html = getReceiptHtml();
      const printWindow = window.open('', '_blank', 'width=420,height=700');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          try {
            printWindow.print();
          } catch {
            // ignore
          }
        }, 500);
      } else {
        window.print();
      }
    } catch {
      window.print();
    }
  };

  // Direct Bluetooth Thermal Printer ESC/POS
  const handlePrintBluetooth = async () => {
    setBtError(null);
    setBtLoading(true);
    setBtStatus('Menghubungkan ke Printer Bluetooth...');

    // If inside iframe, warn and offer standalone
    if (isInsideIframe) {
      setBtLoading(false);
      setBtStatus(null);
      setBtError('IFRAME_PERMISSION_ERROR');
      return;
    }

    try {
      const bytes = generateEscPosReceipt(transaction, safeSettings, 58);
      await printBluetoothEscPos(bytes, (status) => setBtStatus(status));
      setTimeout(() => {
        setBtStatus(null);
        setBtLoading(false);
      }, 2500);
    } catch (err: any) {
      setBtLoading(false);
      setBtStatus(null);
      const errMsg = err?.message || '';
      if (errMsg.includes('permissions policy') || errMsg.includes('SecurityError') || errMsg.includes('disallowed')) {
        setBtError('IFRAME_PERMISSION_ERROR');
      } else {
        setBtError(errMsg || 'Gagal terhubung ke printer Bluetooth. Pastikan Bluetooth aktif dan printer dinyalakan.');
      }
    }
  };

  // Android RawBT App Print
  const handlePrintRawBT = () => {
    try {
      printViaRawBT(transaction, safeSettings);
    } catch {
      setBtError('Gagal membuka aplikasi RawBT. Pastikan aplikasi RawBT terpasang di Android Anda.');
    }
  };

  const generateReceiptText = () => {
    let msg = `*NOTA PENJUALAN - ${(safeSettings.storeName || 'TB. CINCIN PUTIH').toUpperCase()}*\n`;
    msg += `No. Faktur: ${transaction.invoiceNo}\n`;
    msg += `Tanggal: ${formatIndonesianDate(transaction.date)}\n`;
    msg += `Pelanggan: ${transaction.customerName}\n`;
    if (transaction.customerPhone) msg += `No. HP: ${transaction.customerPhone}\n`;
    if (transaction.customerAddress) msg += `Alamat Kirim: ${transaction.customerAddress}\n`;
    msg += `--------------------------------\n`;
    transaction.items.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.productName}\n   ${item.quantity} ${item.unit} x ${formatRupiah(item.unitPrice)} = ${formatRupiah(item.subtotal)}\n`;
    });
    msg += `--------------------------------\n`;
    msg += `Subtotal: ${formatRupiah(transaction.subtotal)}\n`;
    if (transaction.discountAmount > 0) msg += `Diskon: -${formatRupiah(transaction.discountAmount)}\n`;
    if (transaction.deliveryFee > 0) msg += `Ongkir Armada: ${formatRupiah(transaction.deliveryFee)}\n`;
    msg += `*TOTAL AKHIR: ${formatRupiah(transaction.grandTotal)}*\n`;
    msg += `Metode Pembayaran: ${transaction.paymentMethod}\n`;
    if (transaction.paymentMethod === 'KASBON') {
      msg += `Uang Muka (DP): ${formatRupiah(transaction.paidAmount)}\n`;
      msg += `*SISA PIUTANG (KASBON): ${formatRupiah(transaction.remainingAmount)}*\n`;
      if (transaction.dueDate) msg += `Jatuh Tempo: ${formatDateOnly(transaction.dueDate)}\n`;
    } else {
      msg += `Dibayar: ${formatRupiah(transaction.cashPaid)}\n`;
      msg += `Kembalian: ${formatRupiah(transaction.changeDue)}\n`;
    }
    msg += `--------------------------------\n`;
    msg += `${safeSettings.receiptFooter || safeSettings.footerNote || 'Terima kasih atas kunjungan Anda.'}\n`;
    if (safeSettings.bankAccounts && safeSettings.bankAccounts.length > 0) {
      msg += `Rekening Transfer:\n`;
      safeSettings.bankAccounts.forEach((b) => {
        msg += `• ${b.bankName}: ${b.accountNumber} (a.n ${b.holderName})\n`;
      });
    } else {
      msg += `Rekening: ${safeSettings.bankAccount || 'BCA 8801-2345-678 a.n TB. Cincin Putih'}\n`;
    }
    return msg;
  };

  const handleShareWhatsApp = () => {
    const text = generateReceiptText();
    const phone = transaction.customerPhone?.replace(/[^0-9]/g, '') || '';
    const formattedPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const url = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const text = generateReceiptText();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm block text-white">Transaksi Berhasil Disimpan</span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">Faktur #{transaction.invoiceNo}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Messages for Bluetooth & Printing */}
        {btStatus && (
          <div className="p-3 bg-emerald-950/60 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 px-4 sm:px-5">
            {btLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0 text-emerald-400" />}
            <span className="font-medium">{btStatus}</span>
          </div>
        )}

        {btError && (
          <div className="p-3.5 bg-amber-950/70 border-b border-amber-500/40 text-amber-200 text-xs space-y-2 px-4 sm:px-5">
            {btError === 'IFRAME_PERMISSION_ERROR' ? (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-300">Izin Bluetooth Dibatasi oleh Jendela Pratinjau (iFrame)</p>
                      <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                        Browser Chrome membatasi akses Bluetooth jika aplikasi dibuka di dalam tab AI Studio (iFrame). Silakan pilih salah satu solusi berikut:
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setBtError(null)} className="text-amber-400 hover:text-white p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  {/* Solution 1: Open in standalone tab */}
                  <button
                    type="button"
                    onClick={handleOpenStandalone}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer min-h-[38px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>1. Buka di Tab Penuh (Bluetooth Aktif)</span>
                  </button>

                  {/* Solution 2: Print using standard system print */}
                  <button
                    type="button"
                    onClick={handleOpenPrintWindow}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer min-h-[38px]"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>2. Cetak Langsung (PDF / USB)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <span className="font-medium text-rose-200">{btError}</span>
                    <p className="text-[11px] text-rose-300/80 mt-0.5">
                      Tips: Pastikan Bluetooth di HP aktif dan printer thermal dinyalakan (posisi pairing).
                    </p>
                  </div>
                </div>
                <button onClick={() => setBtError(null)} className="text-rose-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Printable Receipt Paper Container */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] bg-slate-950 flex justify-center items-start">
          <div
            id="printable-receipt"
            ref={receiptRef}
            className="w-full max-w-[360px] bg-white text-slate-950 p-5 rounded-2xl shadow-xl font-mono text-xs leading-relaxed select-all border border-slate-200"
          >
            {/* Store Branding */}
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-3 mb-3">
              <h2 className="font-extrabold text-base tracking-tight uppercase text-slate-950">
                {safeSettings.storeName}
              </h2>
              <p className="text-[11px] text-slate-600 font-sans">{safeSettings.tagline}</p>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">{safeSettings.address}</p>
              <p className="text-[10px] text-slate-500 font-sans">Telp: {safeSettings.phone}</p>
              {safeSettings.npwp && (
                <p className="text-[9px] text-slate-400 font-sans">NPWP: {safeSettings.npwp}</p>
              )}
              {transaction.paymentMethod === 'KASBON' && (
                <div className="mt-2 py-1 px-2 border border-dashed border-rose-600 bg-rose-50 text-rose-800 text-[11px] font-bold rounded">
                  *** NOTA BON KASBON / HUTANG ***
                </div>
              )}
            </div>

            {/* Invoice Info */}
            <div className="border-b border-dashed border-slate-300 pb-2 mb-2 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>No. Faktur:</span>
                <span className="font-bold">{transaction.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{formatIndonesianDate(transaction.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{transaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-semibold">{transaction.customerName}</span>
              </div>
              {transaction.customerPhone && (
                <div className="flex justify-between">
                  <span>No. HP:</span>
                  <span>{transaction.customerPhone}</span>
                </div>
              )}
              {transaction.customerAddress && (
                <div className="flex justify-between">
                  <span>Alamat Kirim:</span>
                  <span className="text-right max-w-[180px] truncate">{transaction.customerAddress}</span>
                </div>
              )}
            </div>

            {/* Purchased Items Table */}
            <div className="border-b-2 border-dashed border-slate-300 pb-3 mb-3">
              <div className="text-[10px] font-bold text-slate-600 uppercase mb-1.5 flex justify-between border-b border-slate-200 pb-1">
                <span>RINCIAN MATERIAL</span>
                <span>TOTAL</span>
              </div>
              <div className="space-y-2">
                {transaction.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-[11px]">
                      {item.productName}
                    </div>
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>
                        {item.quantity} {item.unit} x {formatRupiah(item.unitPrice)}
                        {item.discount > 0 ? ` (disc -${formatRupiah(item.discount)})` : ''}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations & Totals */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2 mb-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon Transaksi:</span>
                  <span>-{formatRupiah(transaction.discountAmount)}</span>
                </div>
              )}
              {transaction.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>PPN ({transaction.taxRate}%):</span>
                  <span>{formatRupiah(transaction.taxAmount)}</span>
                </div>
              )}
              {transaction.deliveryFee > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3 h-3 inline" /> Ongkir Armada:
                  </span>
                  <span>{formatRupiah(transaction.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm text-slate-950 pt-1 border-t border-slate-300">
                <span>TOTAL AKHIR:</span>
                <span>{formatRupiah(transaction.grandTotal)}</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="space-y-1 text-[11px] border-b-2 border-dashed border-slate-300 pb-3 mb-3">
              <div className="flex justify-between">
                <span>Metode Bayar:</span>
                <span className="font-bold">{transaction.paymentMethod}</span>
              </div>
              {transaction.paymentMethod === 'KASBON' ? (
                <>
                  <div className="flex justify-between text-emerald-700">
                    <span>Uang Muka (DP):</span>
                    <span>{formatRupiah(transaction.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-600">
                    <span>Sisa Piutang (Kasbon):</span>
                    <span>{formatRupiah(transaction.remainingAmount)}</span>
                  </div>
                  {transaction.dueDate && (
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>Jatuh Tempo:</span>
                      <span className="font-semibold text-rose-700">{formatDateOnly(transaction.dueDate)}</span>
                    </div>
                  )}

                  {/* Physical Signature on Receipt */}
                  <div className="pt-3 mt-2 border-t border-dashed border-slate-200 grid grid-cols-2 text-center text-[10px] text-slate-700">
                    <div>
                      <p>Penerima / Pemilik Hutang,</p>
                      <div className="mt-8 border-b border-dotted border-slate-400 mx-3"></div>
                      <p className="text-[9px] text-slate-500 mt-0.5">({transaction.customerName})</p>
                    </div>
                    <div>
                      <p>Kasir Toko,</p>
                      <div className="mt-8 border-b border-dotted border-slate-400 mx-3"></div>
                      <p className="text-[9px] text-slate-500 mt-0.5">({transaction.cashierName || 'TB. Cincin Putih'})</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Jumlah Bayar:</span>
                    <span>{formatRupiah(transaction.cashPaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(transaction.changeDue)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer Notes & Bank Account */}
            <div className="text-center text-[9px] text-slate-500 font-sans space-y-1">
              <p className="font-medium text-slate-700">{safeSettings.receiptFooter || safeSettings.footerNote}</p>
              {safeSettings.bankAccounts && safeSettings.bankAccounts.length > 0 ? (
                <div className="font-mono text-[9px] text-slate-700 font-semibold space-y-0.5">
                  {safeSettings.bankAccounts.map((b) => (
                    <p key={b.id}>
                      {b.bankName}: {b.accountNumber} (a.n {b.holderName})
                    </p>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-[9px] text-slate-600 font-semibold">{safeSettings.bankAccount}</p>
              )}
              <p className="text-[8px] text-slate-400 pt-1">Point of Sale • TB. Cincin Putih</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons - Clear, Mobile-friendly */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 space-y-2 shrink-0">
          
          {/* Printing Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Primary Bluetooth POS Printer Button */}
            <button
              type="button"
              onClick={handlePrintBluetooth}
              disabled={btLoading}
              className="min-h-[44px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              <Bluetooth className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>Cetak Bluetooth (Thermal 58/80mm)</span>
            </button>

            {/* Browser Print / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Cetak Standar / Simpan PDF</span>
            </button>
          </div>

          {/* Secondary Helpers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
            {/* RawBT App for Android */}
            <button
              type="button"
              onClick={handlePrintRawBT}
              title="Cetak lewat aplikasi RawBT di Android"
              className="min-h-[38px] bg-slate-800/80 hover:bg-slate-750 text-slate-300 font-medium py-1.5 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 border border-slate-700/80 transition cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>RawBT Android</span>
            </button>

            {/* Dedicated Window */}
            <button
              type="button"
              onClick={handleOpenPrintWindow}
              title="Buka struk di tab tersendiri"
              className="min-h-[38px] bg-slate-800/80 hover:bg-slate-750 text-slate-300 font-medium py-1.5 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 border border-slate-700/80 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Buka Tab Baru</span>
            </button>

            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="min-h-[38px] bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-400 font-medium py-1.5 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 border border-emerald-500/30 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>Kirim WA</span>
            </button>

            {/* Copy Text */}
            <button
              type="button"
              onClick={handleCopyText}
              className="min-h-[38px] bg-slate-800/80 hover:bg-slate-750 text-slate-300 font-medium py-1.5 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 border border-slate-700/80 transition cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>
          </div>

          {/* Next Transaction Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[40px] bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              <span>+ Tutup & Mulai Transaksi Baru</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
