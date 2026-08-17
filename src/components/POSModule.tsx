import React, { useState, useMemo } from 'react';
import {
  Product,
  CartItem,
  User,
  StoreSettings,
  SaleTransaction,
  PaymentMethod,
  UnitConversion,
} from '../types';
import { formatRupiah, formatNumber } from '../lib/format';
import { api } from '../lib/api';
import confetti from 'canvas-confetti';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  Banknote,
  QrCode,
  Calendar,
  Layers,
  ArrowRight,
  User as UserIcon,
  Phone,
  MapPin,
  FileText,
  Tag,
  Package,
  Copy,
  Check,
  Building2,
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';

interface POSModuleProps {
  products: Product[];
  currentUser: User;
  settings?: StoreSettings;
  storeSettings?: StoreSettings;
  customers?: any[];
  onRefreshProducts?: () => void;
  onTransactionComplete?: () => void;
}

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'TB. Cincin Putih',
  tagline: 'Bahan Bangunan & Material Terlengkap',
  ownerName: 'Pak Ahmad & Buk Maesaroh',
  address: 'Jl. Raya Industri No. 88, Cikarang, Bekasi',
  phone: '0812-3456-7890',
  email: 'tbcincinputih@gmail.com',
  bankAccount: 'BCA 1234567890 a/n TB Cincin Putih / Mandiri 9876543210',
  footerNote: 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan tanpa nota.',
  qrisInstruction: 'Scan QRIS untuk pembayaran instan',
  defaultTaxRate: 0,
};

export const POSModule: React.FC<POSModuleProps> = ({
  products,
  currentUser,
  settings,
  storeSettings,
  customers = [],
  onRefreshProducts,
  onTransactionComplete,
}) => {
  const activeSettings = settings || storeSettings || DEFAULT_STORE_SETTINGS;
  const triggerRefresh = onRefreshProducts || onTransactionComplete || (() => {});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [priceTier, setPriceTier] = useState<'RETAIL' | 'GROSIR'>('RETAIL');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mobileTab, setMobileTab] = useState<'PRODUCTS' | 'CART'>('PRODUCTS');
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0); // 0 or 11%
  const [orderNotes, setOrderNotes] = useState('');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TUNAI');
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [kasbonDp, setKasbonDp] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<SaleTransaction | null>(null);
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

  const handleCopyBankNo = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankId(id);
    setTimeout(() => setCopiedBankId(null), 2500);
  };

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return ['SEMUA', ...Array.from(set)];
  }, [products]);

  // Filtered Products - robust matching
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Don't hide if isActive is undefined/null
      if (p.isActive === false) return false;
      const matchCat = selectedCategory === 'SEMUA' || (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.rackLocation && p.rackLocation.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add Product to Cart with default base unit or specific unit
  const addToCart = (product: Product, unitConv?: UnitConversion) => {
    const unitName = unitConv ? unitConv.unitName : product.baseUnit;
    const multiplier = unitConv ? unitConv.multiplier : 1;
    let unitPrice = unitConv
      ? priceTier === 'GROSIR' && product.wholesalePrice
        ? unitConv.price * (product.wholesalePrice / product.sellPrice)
        : unitConv.price
      : priceTier === 'GROSIR' && product.wholesalePrice
      ? product.wholesalePrice
      : product.sellPrice;

    unitPrice = Math.round(unitPrice);
    const baseBuyPrice = unitConv ? unitConv.buyPrice : product.buyPrice;

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.productId === product.id && item.selectedUnit === unitName
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        const item = updated[existingIdx];
        const newQty = item.quantity + 1;
        updated[existingIdx] = {
          ...item,
          quantity: newQty,
          subtotal: newQty * item.unitPrice - item.discount,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          selectedUnit: unitName,
          multiplier,
          unitPrice,
          baseBuyPrice,
          quantity: 1,
          discount: 0,
          subtotal: unitPrice,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      updated[index] = {
        ...item,
        quantity: newQty,
        subtotal: newQty * item.unitPrice - item.discount,
      };
      return updated;
    });
  };

  const updateItemDiscount = (index: number, discount: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const validDiscount = Math.max(0, Math.min(discount, item.quantity * item.unitPrice));
      updated[index] = {
        ...item,
        discount: validDiscount,
        subtotal: item.quantity * item.unitPrice - validDiscount,
      };
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setDeliveryFee(0);
    setTaxRate(0);
    setOrderNotes('');
  };

  // Cart Totals
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    if (taxRate <= 0) return 0;
    const taxableAmount = Math.max(0, cartSubtotal - discountAmount);
    return Math.round((taxableAmount * taxRate) / 100);
  }, [cartSubtotal, discountAmount, taxRate]);

  const grandTotal = useMemo(() => {
    const base = Math.max(0, cartSubtotal - discountAmount) + taxAmount + (deliveryFee || 0);
    return base;
  }, [cartSubtotal, discountAmount, taxAmount, deliveryFee]);

  const totalHpp = useMemo(() => {
    return cart.reduce((acc, item) => {
      const hppPerUnit = item.baseBuyPrice * item.multiplier;
      return acc + hppPerUnit * item.quantity;
    }, 0);
  }, [cart]);

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashPaid(grandTotal);
    setKasbonDp(0);
    setIsCheckoutOpen(true);
  };

  // Process Checkout
  const handleProcessTransaction = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);

    try {
      let paidAmount = 0;
      let remainingAmount = 0;
      let changeDue = 0;
      let finalCashPaid = cashPaid;

      if (paymentMethod === 'TUNAI') {
        if (cashPaid < grandTotal) {
          alert('Jumlah uang tunai yang diterima kurang dari total belanja!');
          setSubmitting(false);
          return;
        }
        paidAmount = grandTotal;
        remainingAmount = 0;
        changeDue = cashPaid - grandTotal;
      } else if (paymentMethod === 'TRANSFER' || paymentMethod === 'QRIS') {
        paidAmount = grandTotal;
        remainingAmount = 0;
        changeDue = 0;
        finalCashPaid = grandTotal;
      } else if (paymentMethod === 'KASBON') {
        if (!customerName || customerName === 'Pelanggan Umum') {
          alert('Untuk transaksi Kasbon / Piutang, harap isi Nama Pelanggan / Kontraktor / Mandor!');
          setSubmitting(false);
          return;
        }
        paidAmount = kasbonDp;
        remainingAmount = Math.max(0, grandTotal - kasbonDp);
        changeDue = 0;
        finalCashPaid = kasbonDp;
      }

      const saleItems = cart.map((item) => {
        const itemHpp = item.baseBuyPrice * item.multiplier;
        return {
          productId: item.productId,
          productName: item.name,
          sku: item.sku,
          unit: item.selectedUnit,
          multiplier: item.multiplier,
          quantity: item.quantity,
          baseQuantity: item.quantity * item.multiplier,
          unitPrice: item.unitPrice,
          buyPrice: itemHpp,
          subtotal: item.subtotal,
          discount: item.discount,
          profit: item.subtotal - itemHpp * item.quantity,
        };
      });

      const salePayload = {
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        customerName: customerName || 'Pelanggan Umum',
        customerPhone: customerPhone || undefined,
        customerAddress: customerAddress || undefined,
        items: saleItems,
        subtotal: cartSubtotal,
        discountAmount,
        taxRate,
        taxAmount,
        deliveryFee,
        grandTotal,
        totalHpp,
        grossProfit: grandTotal - (deliveryFee || 0) - (taxAmount || 0) - totalHpp,
        paymentMethod,
        paymentStatus:
          remainingAmount <= 0
            ? ('LUNAS' as const)
            : paidAmount > 0
            ? ('SEBAGIAN' as const)
            : ('BELUM_LUNAS' as const),
        cashPaid: finalCashPaid,
        changeDue,
        paidAmount,
        remainingAmount,
        dueDate: paymentMethod === 'KASBON' ? dueDate : undefined,
        notes: orderNotes || undefined,
      };

      const result = await api.createSale(salePayload);

      // Confetti effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      setLastTransaction(result);
      setIsCheckoutOpen(false);
      clearCart();
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCartQty = useMemo(() => cart.reduce((acc, c) => acc + c.quantity, 0), [cart]);

  return (
    <div className="min-h-[calc(100vh-140px)] flex-1 flex flex-col lg:flex-row lg:h-[calc(100vh-80px)] lg:overflow-hidden bg-slate-950 text-slate-100 relative">
      
      {/* Mobile Top Segmented View Switcher (Visible on < lg) */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-2.5 flex items-center gap-2 shrink-0 z-20 shadow-md sticky top-0">
        <button
          type="button"
          onClick={() => setMobileTab('PRODUCTS')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[44px] ${
            mobileTab === 'PRODUCTS'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 ring-2 ring-emerald-500/30'
              : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Package className="w-4 h-4 text-emerald-400" />
          <span>Katalog ({filteredProducts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('CART')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[44px] relative ${
            mobileTab === 'CART'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 ring-2 ring-emerald-500/30'
              : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4 text-amber-400" />
          <span>Keranjang</span>
          {totalCartQty > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs animate-pulse">
              {totalCartQty}
            </span>
          )}
        </button>
      </div>

      {/* LEFT SECTION: Catalog & Fast Material Search */}
      <div className={`flex-1 flex-col min-w-0 border-r border-slate-800 ${mobileTab === 'PRODUCTS' ? 'flex' : 'hidden'} lg:flex relative`}>
        
        {/* Search Bar & Category Chips */}
        <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-800 space-y-2.5 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Input Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Material (Semen, Besi, Cat, Bata, Kayu, SKU)..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-16 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-lg"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Price Tier Selector (Retail vs Grosir Tukang) */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setPriceTier('RETAIL')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer min-h-[36px] ${
                  priceTier === 'RETAIL'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Retail Umum
              </button>
              <button
                type="button"
                onClick={() => setPriceTier('GROSIR')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer min-h-[36px] ${
                  priceTier === 'GROSIR'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Grosir / Tukang
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer min-h-[34px] flex items-center gap-1 ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                    : 'bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
                }`}
              >
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Filter summary status bar */}
          {(selectedCategory !== 'SEMUA' || searchQuery) && (
            <div className="flex items-center justify-between text-[11px] bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/80 text-slate-400">
              <span>
                Menampilkan <strong className="text-emerald-400">{filteredProducts.length}</strong> dari {products.length} material
              </span>
              <button
                onClick={() => {
                  setSelectedCategory('SEMUA');
                  setSearchQuery('');
                }}
                className="text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
              >
                Tampilkan Semua
              </button>
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 content-start pb-32 lg:pb-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/60 p-6">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-400" />
              <p className="text-sm font-semibold text-slate-300">Material Tidak Ditemukan</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? `Tidak ada barang yang cocok dengan kata kunci "${searchQuery}"` : 'Kategori ini belum memiliki barang.'}
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('SEMUA');
                  setSearchQuery('');
                }}
                className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 cursor-pointer"
              >
                Reset Pencarian & Kategori
              </button>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isLow = product.stock <= product.minStock && product.stock > 0;
              const isOut = product.stock <= 0;
              const currentPrice =
                priceTier === 'GROSIR' && product.wholesalePrice
                  ? product.wholesalePrice
                  : product.sellPrice;

              return (
                <div
                  key={product.id}
                  className={`bg-slate-900 border rounded-2xl p-3.5 flex flex-col justify-between transition-all hover:border-slate-700 ${
                    isOut
                      ? 'border-slate-800 bg-slate-900/90'
                      : isLow
                      ? 'border-amber-500/40 bg-slate-900'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {product.sku || 'SKU'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isOut
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : isLow
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {isOut ? 'Stok: 0 (Siap Jual/PO)' : `Stok: ${formatNumber(product.stock)} ${product.baseUnit}`}
                      </span>
                    </div>

                    {/* Product Name & Details */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">
                        {product.name}
                      </h4>
                      {product.rackLocation && (
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-500" />
                          <span>{product.rackLocation}</span>
                        </p>
                      )}
                    </div>

                    {/* Base Price Display */}
                    <div className="flex items-baseline justify-between pt-1">
                      <div className="text-xs text-slate-400 font-medium">
                        Harga / {product.baseUnit}:
                      </div>
                      <div className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">
                        {formatRupiah(currentPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Multi-Satuan Action Buttons */}
                  <div className="pt-3 border-t border-slate-800/80 mt-3 space-y-1.5">
                    {/* Primary Base Unit Button */}
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="w-full min-h-[38px] bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl flex items-center justify-between transition cursor-pointer shadow-sm"
                    >
                      <span className="flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        <span>1 {product.baseUnit}</span>
                      </span>
                      <span className="font-mono">{formatRupiah(currentPrice)}</span>
                    </button>

                    {/* Alternative Multi-Units (e.g. Truk, Pallet, Ikat, Dus, Pcs) */}
                    {product.units && product.units.length > 0 && (
                      <div className="grid grid-cols-1 gap-1">
                        {product.units
                          .filter((u) => u.unitName !== product.baseUnit)
                          .map((u, uIdx) => {
                            const unitDisplayPrice =
                              priceTier === 'GROSIR' && product.wholesalePrice
                                ? Math.round(u.price * (product.wholesalePrice / product.sellPrice))
                                : u.price;

                            return (
                              <button
                                key={uIdx}
                                type="button"
                                onClick={() => addToCart(product, u)}
                                className="w-full min-h-[34px] bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-medium py-1 px-2.5 rounded-xl flex items-center justify-between border border-slate-700 transition cursor-pointer"
                              >
                                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                  <Plus className="w-3 h-3" />
                                  <span>{u.unitName}</span>
                                </span>
                                <span className="font-mono">{formatRupiah(unitDisplayPrice)}</span>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mobile Sticky Floating Cart Bar (Appears on Catalog when items in cart) */}
        {cart.length > 0 && (
          <div className="lg:hidden p-3 bg-slate-900/95 backdrop-blur-md border-t border-emerald-500/40 sticky bottom-0 z-30 shadow-2xl flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Total {totalCartQty} item:</div>
              <div className="font-extrabold text-emerald-400 text-sm font-mono">{formatRupiah(grandTotal)}</div>
            </div>
            <button
              type="button"
              onClick={() => setMobileTab('CART')}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/80 cursor-pointer min-h-[44px]"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Lihat Keranjang & Bayar →</span>
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SECTION: Accurate Interactive Cart & Checkout Panel */}
      <div className={`w-full lg:w-96 xl:w-[420px] bg-slate-900 flex-col shrink-0 border-t lg:border-t-0 border-slate-800 ${mobileTab === 'CART' ? 'flex' : 'hidden'} lg:flex`}>
        
        {/* Mobile Back Button to Catalog */}
        <div className="lg:hidden bg-slate-850 p-2.5 border-b border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileTab('PRODUCTS')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>← Tambah Material Lainnya</span>
          </button>
          <span className="text-[11px] text-slate-400 font-medium">
            {totalCartQty} item dipilih
          </span>
        </div>

        {/* Cart Header */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Keranjang Penjualan</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              {cart.reduce((acc, c) => acc + c.quantity, 0)} item
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan</span>
            </button>
          )}
        </div>

        {/* Customer Quick Form */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/60 space-y-2 text-xs shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <UserIcon className="w-3 h-3 text-slate-500" /> Pelanggan:
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama Pelanggan / Mandor"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs mt-0.5 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-500" /> No. HP / WA:
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0812-xxx"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs mt-0.5 outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" /> Alamat Kirim / Proyek:
            </label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Alamat Pengiriman Armada Truk / Lokasi Cor"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs mt-0.5 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6">
              <ShoppingCart className="w-12 h-12 mb-2 opacity-20 text-emerald-400" />
              <p className="text-xs font-semibold text-slate-400">Keranjang masih kosong</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Pilih material di sebelah kiri untuk menambahkan ke struk belanja.
              </p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={`${item.productId}-${item.selectedUnit}-${idx}`}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs space-y-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="font-bold text-white text-xs leading-tight">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                      {formatRupiah(item.unitPrice)} / {item.selectedUnit}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quantity & Item Subtotal Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(idx, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 1)}
                      className="w-12 text-center bg-slate-900 border border-slate-700 rounded-lg py-0.5 text-xs font-bold text-white outline-none"
                    />
                    <button
                      onClick={() => updateQuantity(idx, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="text-[11px] text-slate-400 font-medium pl-1">
                      {item.selectedUnit}
                    </span>
                  </div>

                  <div className="text-right font-bold text-white text-xs">
                    {formatRupiah(item.subtotal)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Trigger */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0">
          {/* Quick Adjustments: Ongkir Armada, Diskon, PPN */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Subtotal Material:</span>
              <span className="font-semibold text-slate-200">{formatRupiah(cartSubtotal)}</span>
            </div>

            {/* Ongkir Armada Selector */}
            <div className="flex justify-between items-center gap-2">
              <label className="text-[11px] text-slate-400 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-blue-400" /> Ongkir Armada:
              </label>
              <div className="flex items-center gap-1">
                <select
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-[11px] text-white outline-none"
                >
                  <option value={0}>Gratis / Ambil Sendiri</option>
                  <option value={50000}>Rp 50.000 (Pickup Dekat)</option>
                  <option value={100000}>Rp 100.000 (Colt Diesel)</option>
                  <option value={150000}>Rp 150.000 (Truk Jauh)</option>
                  <option value={250000}>Rp 250.000 (Tronton/Luar Kota)</option>
                </select>
              </div>
            </div>

            {/* Diskon Transaksi */}
            <div className="flex justify-between items-center gap-2">
              <label className="text-[11px] text-slate-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-400" /> Diskon Nota (Rp):
              </label>
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-24 text-right bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-[11px] text-white outline-none"
              />
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm">
              <span className="font-bold text-white">TOTAL AKHIR:</span>
              <span className="font-extrabold text-base text-emerald-400">
                {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleOpenCheckout}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 cursor-pointer"
          >
            <span>Bayar / Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* CHECKOUT MODAL (Payment Processing with Accurate Styles) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl my-8">
            
            {/* Checkout Header */}
            <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-white">Proses Pembayaran</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pelanggan: <span className="text-emerald-400 font-semibold">{customerName}</span> • Total: <span className="font-bold text-white">{formatRupiah(grandTotal)}</span>
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Payment Method Tabs */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TUNAI')}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'TUNAI'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-xs font-bold">TUNAI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'TRANSFER'
                      ? 'bg-blue-950/80 border-blue-500 text-blue-300 ring-2 ring-blue-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs font-bold">TRANSFER</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'QRIS'
                      ? 'bg-teal-950/80 border-teal-500 text-teal-300 ring-2 ring-teal-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-xs font-bold">QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('KASBON')}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'KASBON'
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300 ring-2 ring-rose-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="text-xs font-bold">KASBON</span>
                </button>
              </div>

              {/* TUNAI MODE DETAILS */}
              {paymentMethod === 'TUNAI' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      Uang Diterima (Rp):
                    </label>
                    <input
                      type="number"
                      value={cashPaid || ''}
                      onChange={(e) => setCashPaid(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-lg font-bold text-emerald-400 outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashPaid(grandTotal)}
                      className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300"
                    >
                      Uang Pas
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashPaid(50000)}
                      className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300"
                    >
                      50.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashPaid(100000)}
                      className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300"
                    >
                      100.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashPaid(200000)}
                      className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300"
                    >
                      200.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashPaid(500000)}
                      className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300"
                    >
                      500.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashPaid(1000000)}
                      className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300"
                    >
                      1.000.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashPaid(2000000)}
                      className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300"
                    >
                      2.000.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashPaid(5000000)}
                      className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300"
                    >
                      5.000.000
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-300">Kembalian:</span>
                    <span className={`text-base ${cashPaid >= grandTotal ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {cashPaid >= grandTotal ? formatRupiah(cashPaid - grandTotal) : 'Uang Kurang!'}
                    </span>
                  </div>
                </div>
              )}

              {/* TRANSFER MODE */}
              {paymentMethod === 'TRANSFER' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/40 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      Pilihan Rekening Bank Toko:
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Total: <strong className="text-emerald-400">{formatRupiah(grandTotal)}</strong>
                    </span>
                  </div>

                  {/* List of Store Bank Accounts */}
                  {activeSettings.bankAccounts && activeSettings.bankAccounts.length > 0 ? (
                    <div className="space-y-2">
                      {activeSettings.bankAccounts.map((bank) => (
                        <div
                          key={bank.id}
                          className={`p-3 rounded-xl border transition ${
                            bank.isDefault
                              ? 'bg-blue-950/30 border-blue-500/50 shadow-md'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-blue-600 text-white font-extrabold text-[10px] rounded tracking-wider">
                                {bank.bankName}
                              </span>
                              {bank.isDefault && (
                                <span className="text-[10px] text-emerald-400 font-semibold">
                                  (Rekening Utama)
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyBankNo(bank.accountNumber, bank.id)}
                              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-slate-800 hover:bg-slate-750 px-2 py-1 rounded-lg border border-slate-700 transition cursor-pointer"
                            >
                              {copiedBankId === bank.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Salin No. Rek</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-mono font-extrabold text-sm text-white tracking-wider">
                              {bank.accountNumber}
                            </span>
                            <span className="text-[11px] text-slate-300">
                              a.n <strong>{bank.holderName}</strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-700 font-mono text-emerald-400">
                      {activeSettings.bankAccount || 'BCA 8801-2345-678 a.n TB. Cincin Putih'}
                    </div>
                  )}

                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] flex items-center justify-between">
                    <span>Transaksi transfer langsung tercatat LUNAS.</span>
                    <span className="text-[10px] text-slate-400 italic">
                      *Ubah nomor rekening di menu Pengaturan
                    </span>
                  </div>
                </div>
              )}

              {/* QRIS MODE */}
              {paymentMethod === 'QRIS' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-3">
                  <div className="max-w-[180px] mx-auto bg-white p-3 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                    <div className="text-[9px] font-black text-slate-950 tracking-wider mb-1">
                      QRIS PEMBAYARAN
                    </div>
                    {activeSettings.qrisImageUrl ? (
                      <img
                        src={activeSettings.qrisImageUrl}
                        alt="QRIS Barcode"
                        className="w-32 h-32 object-contain rounded"
                      />
                    ) : (
                      <div className="w-32 h-32 flex items-center justify-center bg-slate-100 rounded border border-slate-300">
                        <QrCode className="w-28 h-28 text-slate-950" />
                      </div>
                    )}
                    <div className="text-[10px] font-extrabold text-slate-900 mt-1 uppercase truncate max-w-full">
                      {activeSettings.qrisMerchantName || activeSettings.storeName || 'TB. CINCIN PUTIH'}
                    </div>
                    {activeSettings.qrisNmid && (
                      <div className="text-[8px] text-slate-500 font-mono">
                        NMID: {activeSettings.qrisNmid}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-300 font-semibold">
                      Total Pembayaran: <span className="text-emerald-400 font-bold">{formatRupiah(grandTotal)}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {activeSettings.qrisInstruction || 'Scan dari BCA Mobile, Livin Mandiri, BRImo, BNI, GoPay, OVO, Dana, ShopeePay.'}
                    </p>
                  </div>
                </div>
              )}

              {/* KASBON / PIUTANG PELANGGAN MODE */}
              {paymentMethod === 'KASBON' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/40 space-y-3.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center gap-2">
                    <span className="text-sm">⚠️</span>
                    <span>Transaksi ini akan dicatat ke <strong>Buku Piutang Toko</strong> dan mencetak <strong>Nota Bon Kasbon</strong> resmi.</span>
                  </div>

                  {/* Customer Information within Kasbon Modal */}
                  <div className="space-y-2 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-300 font-bold flex items-center gap-1 text-[11px]">
                        <UserIcon className="w-3.5 h-3.5 text-amber-400" /> Nama Pelanggan / Mandor / Proyek *:
                      </label>
                      {customers && customers.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              const found = customers.find((c) => c.name === e.target.value);
                              if (found) {
                                setCustomerName(found.name);
                                if (found.phone) setCustomerPhone(found.phone);
                                if (found.address) setCustomerAddress(found.address);
                              } else {
                                setCustomerName(e.target.value);
                              }
                            }
                          }}
                          className="bg-slate-800 border border-slate-700 text-[10px] text-slate-300 rounded px-1.5 py-0.5 outline-none"
                        >
                          <option value="">-- Pilih dari Kontak Pelanggan --</option>
                          {customers.map((c: any) => (
                            <option key={c.id} value={c.name}>
                              {c.name} {c.phone ? `(${c.phone})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <input
                      type="text"
                      value={customerName === 'Pelanggan Umum' ? '' : customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ketik Nama Pelanggan (Wajib diisi)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-xs font-semibold text-white outline-none focus:border-amber-500"
                    />

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">No. HP / WA (Untuk kirim tagihan):</label>
                        <input
                          type="text"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="0812-xxxx-xxxx"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 px-2.5 text-[11px] text-white outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Alamat Kirim / Lokasi Proyek:</label>
                        <input
                          type="text"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="Lokasi Proyek / Cor"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 px-2.5 text-[11px] text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* DP & Due Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-300 font-medium text-[11px]">
                          Uang Muka / DP (Rp):
                        </label>
                        <button
                          type="button"
                          onClick={() => setKasbonDp(0)}
                          className="text-[10px] text-amber-400 hover:underline"
                        >
                          Tanpa DP (Rp 0)
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={grandTotal}
                        value={kasbonDp || ''}
                        onChange={(e) => setKasbonDp(Number(e.target.value) || 0)}
                        placeholder="0 (Jika belum ada DP)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm font-bold text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-medium block mb-1 text-[11px]">
                        Tanggal Jatuh Tempo:
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-xs font-semibold text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Quick DP Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 self-center mr-1">Preset DP:</span>
                    <button
                      type="button"
                      onClick={() => setKasbonDp(0)}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300"
                    >
                      DP Rp 0
                    </button>
                    {grandTotal >= 500000 && (
                      <button
                        type="button"
                        onClick={() => setKasbonDp(Math.round(grandTotal * 0.2 / 10000) * 10000)}
                        className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300"
                      >
                        DP 20%
                      </button>
                    )}
                    {grandTotal >= 200000 && (
                      <button
                        type="button"
                        onClick={() => setKasbonDp(Math.round(grandTotal * 0.5 / 10000) * 10000)}
                        className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300"
                      >
                        DP 50%
                      </button>
                    )}
                  </div>

                  {/* Sisa Piutang Calculation */}
                  <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center bg-rose-950/20 p-2 rounded-lg border border-rose-900/30">
                    <span className="text-slate-300 font-semibold text-xs">Sisa Hutang Kasbon Tercatat:</span>
                    <span className="font-extrabold text-base text-rose-400">
                      {formatRupiah(Math.max(0, grandTotal - kasbonDp))}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleProcessTransaction}
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Konfirmasi & Cetak Struk</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {lastTransaction && (
        <ReceiptModal
          transaction={lastTransaction}
          settings={activeSettings}
          onClose={() => setLastTransaction(null)}
        />
      )}

    </div>
  );
};
