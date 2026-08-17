import React, { useState } from 'react';
import { PurchaseOrder, Supplier, Product, User } from '../types';
import { formatRupiah, formatNumber, formatIndonesianDate, formatDateOnly } from '../lib/format';
import { api } from '../lib/api';
import { Truck, Plus, CheckCircle2, UserPlus, FileText, X } from 'lucide-react';

interface PurchasesModuleProps {
  purchases: PurchaseOrder[];
  suppliers: Supplier[];
  products: Product[];
  currentUser: User;
  onRefresh: () => void;
}

export const PurchasesModule: React.FC<PurchasesModuleProps> = ({
  purchases,
  suppliers,
  products,
  currentUser,
  onRefresh,
}) => {
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Form State for Purchase Order
  const [supplierId, setSupplierId] = useState('');
  const [poItems, setPoItems] = useState<
    { productId: string; quantity: number; buyPrice: number }[]
  >([]);
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'TRANSFER' | 'TEMPO'>('TEMPO');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  // Form State for New Supplier
  const [supName, setSupName] = useState('');
  const [supCode, setSupCode] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supSpecialty, setSupSpecialty] = useState('Semen & Pasir');
  const [supAddress, setSupAddress] = useState('');
  const [supNotes, setSupNotes] = useState('');

  // Add Item line to PO
  const handleAddItemLine = () => {
    if (products.length === 0) return;
    setPoItems([
      ...poItems,
      { productId: products[0].id, quantity: 10, buyPrice: products[0].buyPrice },
    ]);
  };

  const handleUpdateItemLine = (
    index: number,
    field: 'productId' | 'quantity' | 'buyPrice',
    value: any
  ) => {
    const updated = [...poItems];
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      updated[index].productId = value;
      if (prod) updated[index].buyPrice = prod.buyPrice;
    } else if (field === 'quantity') {
      updated[index].quantity = Number(value) || 0;
    } else if (field === 'buyPrice') {
      updated[index].buyPrice = Number(value) || 0;
    }
    setPoItems(updated);
  };

  const handleRemoveItemLine = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const totalPOAmount = poItems.reduce(
    (acc, item) => acc + item.quantity * item.buyPrice,
    0
  );

  // Save Purchase Order
  const handleSavePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || poItems.length === 0) {
      alert('Pilih supplier dan tambahkan setidaknya 1 item material!');
      return;
    }

    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;

    try {
      const itemsPayload = poItems.map((item) => {
        const prod = products.find((p) => p.id === item.productId)!;
        return {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          unit: prod.baseUnit,
          multiplier: 1,
          quantity: item.quantity,
          baseQuantity: item.quantity,
          buyPrice: item.buyPrice,
          subtotal: item.quantity * item.buyPrice,
        };
      });

      const actualPaid =
        paymentMethod === 'TEMPO' ? paidAmount : totalPOAmount;
      const remaining = Math.max(0, totalPOAmount - actualPaid);

      await api.createPurchase({
        supplierId: sup.id,
        supplierName: sup.name,
        items: itemsPayload,
        totalAmount: totalPOAmount,
        paymentMethod,
        paymentStatus:
          remaining <= 0 ? 'LUNAS' : actualPaid > 0 ? 'SEBAGIAN' : 'BELUM_LUNAS',
        paidAmount: actualPaid,
        remainingAmount: remaining,
        dueDate: paymentMethod === 'TEMPO' ? dueDate : undefined,
        notes: notes || undefined,
        receivedBy: currentUser.name,
      });

      setIsPOModalOpen(false);
      setPoItems([]);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan PO');
    }
  };

  // Save New Supplier
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName || !supPhone) {
      alert('Nama dan No Telp supplier wajib diisi!');
      return;
    }
    try {
      await api.createSupplier({
        name: supName,
        code: supCode || `SUP-${Date.now().toString().slice(-4)}`,
        phone: supPhone,
        contactPerson: supContact || undefined,
        materialSpecialty: supSpecialty,
        address: supAddress || undefined,
        notes: supNotes || undefined,
        active: true,
      });
      setIsSupplierModalOpen(false);
      setSupName('');
      setSupPhone('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan supplier');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            Pembelian & Stok Masuk dari Supplier
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Catat pengiriman semen, besi tronton, pasir armada dan update otomatis saldo utang supplier.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-blue-400" />
            <span>+ Mitra Supplier</span>
          </button>

          <button
            onClick={() => {
              if (suppliers.length === 0) {
                alert('Silakan daftarkan Supplier terlebih dahulu!');
                return;
              }
              setSupplierId(suppliers[0].id);
              setPoItems([
                {
                  productId: products[0]?.id || '',
                  quantity: 50,
                  buyPrice: products[0]?.buyPrice || 0,
                },
              ]);
              setIsPOModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat PO / Stok Masuk</span>
          </button>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 font-bold text-sm text-white flex justify-between items-center">
          <span>Riwayat Surat Pesanan & Penerimaan Barang</span>
          <span className="text-xs text-slate-400 font-normal">
            Total Transaksi: {purchases.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">No. PO</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Pemasok / Distributor</th>
                <th className="p-3.5">Rincian Material</th>
                <th className="p-3.5 text-right">Total Pembelian</th>
                <th className="p-3.5">Metode Bayar</th>
                <th className="p-3.5">Status Pembayaran</th>
                <th className="p-3.5">Penerima</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Belum ada riwayat penerimaan stok dari supplier.
                  </td>
                </tr>
              ) : (
                purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-850/50 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-200">
                      {po.poNumber}
                    </td>
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">
                      {formatIndonesianDate(po.date)}
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      {po.supplierName}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5 max-w-xs">
                        {po.items.map((it, idx) => (
                          <div key={idx} className="text-[11px] text-slate-300">
                            • {it.productName} ({formatNumber(it.quantity)} {it.unit})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-white">
                      {formatRupiah(po.totalAmount)}
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-300">
                        {po.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          po.paymentStatus === 'LUNAS'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : po.paymentStatus === 'SEBAGIAN'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {po.paymentStatus}
                      </span>
                      {po.remainingAmount > 0 && (
                        <div className="text-[10px] text-rose-400 mt-0.5">
                          Sisa: {formatRupiah(po.remainingAmount)}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400">{po.receivedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREATE PURCHASE ORDER / STOK MASUK */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-8">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">Pencatatan Stok Masuk / PO Supplier</h3>
              <button onClick={() => setIsPOModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePO} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Pilih Supplier Material *</label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.materialSpecialty})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Daftar Material yang Diterima</span>
                  <button
                    type="button"
                    onClick={handleAddItemLine}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold text-[11px]"
                  >
                    + Tambah Baris
                  </button>
                </div>

                {poItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <div className="sm:col-span-5">
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateItemLine(idx, 'productId', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min="1"
                        placeholder="Jumlah"
                        value={item.quantity || ''}
                        onChange={(e) => handleUpdateItemLine(idx, 'quantity', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="Harga Beli"
                        value={item.buyPrice || ''}
                        onChange={(e) => handleUpdateItemLine(idx, 'buyPrice', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-emerald-400 font-bold text-[11px] outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemLine(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-300">Total Nominal Pembelian:</span>
                <span className="font-extrabold text-base text-emerald-400">
                  {formatRupiah(totalPOAmount)}
                </span>
              </div>

              {/* Payment Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Metode Pembayaran *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  >
                    <option value="TEMPO">Tempo / Utang Usaha (Accurate)</option>
                    <option value="TUNAI">Tunai / Kas Toko</option>
                    <option value="TRANSFER">Transfer Bank</option>
                  </select>
                </div>

                {paymentMethod === 'TEMPO' ? (
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Uang Muka / DP Dibayar (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      max={totalPOAmount}
                      value={paidAmount || ''}
                      onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                ) : null}
              </div>

              {paymentMethod === 'TEMPO' && (
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Tanggal Jatuh Tempo Utang</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-300 font-medium block mb-1">Catatan Pengiriman / Armada</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Kirim via Tronton Nopol B 9812 UI"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPOModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50"
                >
                  Simpan & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUPPLIER */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">Tambah Mitra Supplier Material</h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Nama Perusahaan / Distributor *</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="PT Semen Gresik / UD Sumber Kayu"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">No. HP / Telepon Sales *</label>
                <input
                  type="text"
                  required
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  placeholder="0812-xxxx"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Spesialisasi Bahan Bangunan</label>
                <input
                  type="text"
                  value={supSpecialty}
                  onChange={(e) => setSupSpecialty(e.target.value)}
                  placeholder="e.g. Besi Beton SNI, Pipa PVC, Cat"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold"
                >
                  Simpan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
