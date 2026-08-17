// ESC/POS Thermal Printing Helper for 58mm & 80mm Bluetooth & USB Printers
import { SaleTransaction, StoreSettings } from '../types';
import { formatRupiah, formatIndonesianDate, formatDateOnly } from './format';

// ESC/POS Command Constants
const ESC = 0x1b;
const GS = 0x1d;

export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  // Initialize printer
  init(): this {
    this.buffer.push(ESC, 0x40); // ESC @
    return this;
  }

  // Set text alignment: 0=Left, 1=Center, 2=Right
  align(align: 0 | 1 | 2): this {
    this.buffer.push(ESC, 0x61, align);
    return this;
  }

  // Bold text
  bold(enable: boolean): this {
    this.buffer.push(ESC, 0x45, enable ? 1 : 0);
    return this;
  }

  // Double height & width
  doubleSize(enable: boolean): this {
    this.buffer.push(GS, 0x21, enable ? 0x11 : 0x00);
    return this;
  }

  // Add line feed
  feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  // Add text (Clean ASCII encoded for ESC/POS Thermal Printers)
  text(str: string): this {
    // Clean string from non-breaking spaces and common unicode symbols
    const cleaned = str
      .replace(/[\u00A0\u202F\u1680\u2000-\u200B\u2028\u2029\u205F\u3000]/g, ' ')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...');

    for (let i = 0; i < cleaned.length; i++) {
      const code = cleaned.charCodeAt(i);
      if (code === 0x0a) {
        this.buffer.push(0x0a);
      } else if (code >= 32 && code < 127) {
        this.buffer.push(code);
      } else if (code === 0x09) {
        this.buffer.push(0x20, 0x20); // tab to spaces
      } else if (code === 160) {
        this.buffer.push(0x20); // non-breaking space fallback
      } else if (code < 32) {
        // control characters - ignore or space
      } else {
        // for characters > 127, replace with standard space or drop
        this.buffer.push(0x20);
      }
    }
    return this;
  }

  textLine(str: string = ''): this {
    this.text(str);
    this.feed(1);
    return this;
  }

  // Wrap long text cleanly by word boundaries so words are not broken
  textWrapped(str: string = '', width: number = 32): this {
    if (!str) return this;
    const words = str.split(' ');
    let currentLine = '';
    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
      } else if (currentLine.length + 1 + word.length <= width) {
        currentLine += ' ' + word;
      } else {
        this.textLine(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      this.textLine(currentLine);
    }
    return this;
  }

  // Add divider line for 32 columns (58mm) or 48 columns (80mm)
  divider(char: string = '-', width: number = 32): this {
    this.textLine(char.repeat(width));
    return this;
  }

  // Print two-column aligned row (Left text and Right text)
  twoColumn(left: string, right: string, width: number = 32): this {
    const spaceCount = Math.max(1, width - left.length - right.length);
    const line = left + ' '.repeat(spaceCount) + right;
    this.textLine(line.substring(0, width));
    return this;
  }

  // Cut paper
  cut(): this {
    this.feed(3);
    this.buffer.push(GS, 0x56, 0x41, 0x00); // Full cut
    return this;
  }

  // Get raw Uint8Array
  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  // Get base64 string for RawBT URL scheme
  toBase64(): string {
    const bytes = this.getBytes();
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Generate complete ESC/POS receipt byte data
export function generateEscPosReceipt(
  transaction: SaleTransaction,
  settings: StoreSettings,
  paperWidth: 58 | 80 = 58
): Uint8Array {
  const colWidth = paperWidth === 80 ? 48 : 32;
  const builder = new EscPosBuilder();
  const isKasbon = transaction.paymentMethod === 'KASBON';

  // Store Header (Centered)
  builder.align(1);
  builder.doubleSize(true);
  builder.bold(true);
  builder.textLine(settings.storeName || 'TB. CINCIN PUTIH');
  builder.doubleSize(false);
  builder.bold(false);

  if (settings.tagline) builder.textWrapped(settings.tagline, colWidth);
  if (settings.address) builder.textWrapped(settings.address, colWidth);
  if (settings.phone) builder.textWrapped(`Telp: ${settings.phone}`, colWidth);

  if (isKasbon) {
    builder.feed(1);
    builder.bold(true);
    builder.textLine('*** NOTA BON KASBON / HUTANG ***');
    builder.bold(false);
  }

  builder.divider('=', colWidth);

  // Metadata (Left Aligned)
  builder.align(0);
  builder.twoColumn('No. Faktur:', transaction.invoiceNo, colWidth);
  builder.twoColumn('Tanggal:', formatDateOnly(transaction.date), colWidth);
  builder.twoColumn('Kasir:', transaction.cashierName || 'Kasir', colWidth);
  builder.twoColumn('Pelanggan:', transaction.customerName, colWidth);
  if (transaction.customerPhone) {
    builder.twoColumn('No. HP:', transaction.customerPhone, colWidth);
  }

  builder.divider('-', colWidth);

  // Items Header
  builder.bold(true);
  builder.twoColumn('MATERIAL / ITEM', 'SUBTOTAL', colWidth);
  builder.bold(false);
  builder.divider('-', colWidth);

  // Items List
  transaction.items.forEach((item) => {
    builder.bold(true);
    builder.textLine(item.productName);
    builder.bold(false);

    const qtyPrice = `${item.quantity} ${item.unit} x ${formatRupiah(item.unitPrice)}`;
    const subtotal = formatRupiah(item.subtotal);
    builder.twoColumn(` ${qtyPrice}`, subtotal, colWidth);
  });

  builder.divider('-', colWidth);

  // Subtotal & Totals
  builder.twoColumn('Subtotal:', formatRupiah(transaction.subtotal), colWidth);
  if (transaction.discountAmount > 0) {
    builder.twoColumn('Diskon:', `-${formatRupiah(transaction.discountAmount)}`, colWidth);
  }
  if (transaction.deliveryFee > 0) {
    builder.twoColumn('Ongkir:', formatRupiah(transaction.deliveryFee), colWidth);
  }

  builder.bold(true);
  builder.divider('=', colWidth);
  builder.twoColumn('TOTAL:', formatRupiah(transaction.grandTotal), colWidth);
  builder.bold(false);
  builder.divider('-', colWidth);

  // Payment Info
  if (isKasbon) {
    builder.twoColumn('Metode:', 'KASBON / TEMPO', colWidth);
    builder.twoColumn('DP Masuk:', formatRupiah(transaction.paidAmount), colWidth);
    builder.bold(true);
    builder.twoColumn('SISA KASBON:', formatRupiah(transaction.remainingAmount), colWidth);
    builder.bold(false);
    if (transaction.dueDate) {
      builder.twoColumn('Jatuh Tempo:', formatDateOnly(transaction.dueDate), colWidth);
    }

    // Signature Area
    builder.feed(1);
    builder.align(1);
    builder.textLine('Ttd Penerima         Ttd Kasir');
    builder.feed(2);
    builder.textLine('( ............. )   ( ............. )');
  } else {
    builder.twoColumn('Metode Bayar:', transaction.paymentMethod, colWidth);
    builder.twoColumn('Tunai Diterima:', formatRupiah(transaction.cashPaid), colWidth);
    builder.bold(true);
    builder.twoColumn('Kembalian:', formatRupiah(transaction.changeDue), colWidth);
    builder.bold(false);
  }

  builder.divider('-', colWidth);

  // Footer
  builder.align(1);
  const footerText = settings.receiptFooter || settings.footerNote;
  if (footerText) {
    builder.textWrapped(footerText, colWidth);
  }
  if (settings.bankAccounts && settings.bankAccounts.length > 0) {
    settings.bankAccounts.forEach((b) => {
      builder.textWrapped(`Rek ${b.bankName}: ${b.accountNumber} a.n ${b.holderName}`, colWidth);
    });
  } else if (settings.bankAccount) {
    builder.textWrapped(`Rek: ${settings.bankAccount}`, colWidth);
  }
  builder.textLine('*** TERIMA KASIH ***');
  builder.cut();

  return builder.getBytes();
}

// Print via Web Bluetooth API (Connects directly to Bluetooth POS Printers)
export async function printBluetoothEscPos(
  data: Uint8Array,
  onStatusUpdate?: (status: string) => void
): Promise<boolean> {
  const nav = navigator as any;
  if (!nav.bluetooth) {
    throw new Error('Browser Anda belum mendukung Web Bluetooth. Gunakan Chrome di HP Android / Laptop.');
  }

  onStatusUpdate?.('Mencari printer Bluetooth...');

  // Standard POS Bluetooth Printer UUIDs
  const device = await nav.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      '000018f0-0000-1000-8000-00805f9b34fb',
      'e7810a01-73ae-499d-8c15-faa9aef0c3f2',
      '49535343-fe7d-4ae5-8fa9-9fafd205e455',
      '0000ff00-0000-1000-8000-00805f9b34fb',
      '0000ae30-0000-1000-8000-00805f9b34fb',
      '0000af30-0000-1000-8000-00805f9b34fb',
    ],
  });

  if (!device.gatt) {
    throw new Error('GATT server tidak ditemukan pada perangkat Bluetooth ini.');
  }

  onStatusUpdate?.(`Menghubungkan ke ${device.name || 'Printer'}...`);
  const server = await device.gatt.connect();

  onStatusUpdate?.('Mencari layanan cetak...');
  // Find valid printing service
  const services = await server.getPrimaryServices();
  let writeCharacteristic: any = null;

  for (const service of services) {
    try {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          writeCharacteristic = char;
          break;
        }
      }
      if (writeCharacteristic) break;
    } catch {
      continue;
    }
  }

  if (!writeCharacteristic) {
    throw new Error('Karakteristik cetak printer Bluetooth tidak ditemukan.');
  }

  onStatusUpdate?.('Mengirim data struk ke printer...');

  // Write in 128-byte chunks to avoid Bluetooth buffer overflow
  const chunkSize = 128;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    if (writeCharacteristic.properties.writeWithoutResponse) {
      await writeCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await writeCharacteristic.writeValue(chunk);
    }
    // Tiny delay between chunks
    await new Promise((resolve) => setTimeout(resolve, 30));
  }

  onStatusUpdate?.('Struk berhasil dicetak!');
  device.gatt.disconnect();
  return true;
}

// Print via RawBT (Android Intent / URL Scheme)
export function printViaRawBT(transaction: SaleTransaction, settings: StoreSettings): void {
  const bytes = generateEscPosReceipt(transaction, settings, 58);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binary);
  const rawbtUrl = `rawbt:data:application/octet-stream;base64,${base64}`;
  window.location.href = rawbtUrl;
}
