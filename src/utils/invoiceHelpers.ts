import type { CalculationSettings, InvoiceTotals, ServiceItem } from '../types/invoice';

const NAMA_BULAN_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const KATA_BILANGAN = [
  '',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
  'sebelas',
];

/**
 * Memformat angka menjadi string pemisah ribuan bertitik tanpa desimal (contoh: 1500000 -> "1.500.000").
 */
export function formatNumberDots(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(Math.max(0, value)) : 0;
  return safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Mengambil nilai integer dari input string berformat titik ribuan.
 */
export function parseFormattedNumber(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Memformat angka menjadi format Rupiah Indonesia: "Rp 1.500.000".
 */
export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  if (safe < 0) {
    return `-Rp ${formatNumberDots(Math.abs(safe))}`;
  }
  return `Rp ${formatNumberDots(safe)}`;
}

/**
 * Memformat tanggal YYYY-MM-DD menjadi format Indonesia: "25 November 2026".
 */
export function formatTanggalIndonesia(isoDate: string): string {
  if (!isoDate) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return isoDate;
  const year = Number.parseInt(match[1], 10);
  const monthIndex = Number.parseInt(match[2], 10) - 1;
  const day = Number.parseInt(match[3], 10);
  const monthName = NAMA_BULAN_ID[monthIndex];
  if (!monthName || day < 1 || day > 31) return isoDate;
  return `${day} ${monthName} ${year}`;
}

function konversiAngkaKeKata(n: number): string {
  if (n === 0) return '';
  if (n < 12) {
    return KATA_BILANGAN[n];
  }
  if (n < 20) {
    return `${konversiAngkaKeKata(n - 10)} belas`;
  }
  if (n < 100) {
    const puluh = Math.floor(n / 10);
    const sisa = n % 10;
    return `${konversiAngkaKeKata(puluh)} puluh${sisa > 0 ? ` ${konversiAngkaKeKata(sisa)}` : ''}`;
  }
  if (n < 200) {
    const sisa = n - 100;
    return `seratus${sisa > 0 ? ` ${konversiAngkaKeKata(sisa)}` : ''}`;
  }
  if (n < 1000) {
    const ratus = Math.floor(n / 100);
    const sisa = n % 100;
    return `${konversiAngkaKeKata(ratus)} ratus${sisa > 0 ? ` ${konversiAngkaKeKata(sisa)}` : ''}`;
  }
  if (n < 2000) {
    const sisa = n - 1000;
    return `seribu${sisa > 0 ? ` ${konversiAngkaKeKata(sisa)}` : ''}`;
  }
  if (n < 1_000_000) {
    const ribu = Math.floor(n / 1000);
    const sisa = n % 1000;
    return `${konversiAngkaKeKata(ribu)} ribu${sisa > 0 ? ` ${konversiAngkaKeKata(sisa)}` : ''}`;
  }
  if (n < 1_000_000_000) {
    const juta = Math.floor(n / 1_000_000);
    const sisa = n % 1_000_000;
    return `${konversiAngkaKeKata(juta)} juta${sisa > 0 ? ` ${konversiAngkaKeKata(sisa)}` : ''}`;
  }
  if (n < 1_000_000_000_000) {
    const miliar = Math.floor(n / 1_000_000_000);
    const sisa = n % 1_000_000_000;
    return `${konversiAngkaKeKata(miliar)} miliar${sisa > 0 ? ` ${konversiAngkaKeKata(sisa)}` : ''}`;
  }
  const triliun = Math.floor(n / 1_000_000_000_000);
  const sisa = n % 1_000_000_000_000;
  return `${konversiAngkaKeKata(triliun)} triliun${sisa > 0 ? ` ${konversiAngkaKeKata(sisa)}` : ''}`;
}

/**
 * Mengubah nominal angka menjadi teks terbilang Bahasa Indonesia (contoh: 1500000 -> "Satu juta lima ratus ribu rupiah").
 */
export function terbilang(angka: number): string {
  const safe = Number.isFinite(angka) ? Math.round(Math.max(0, angka)) : 0;
  if (safe === 0) {
    return 'Nol rupiah';
  }
  const words = konversiAngkaKeKata(safe).replace(/\s+/g, ' ').trim();
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalized} rupiah`;
}

/**
 * Menghasilkan nomor invoice otomatis dengan format INV/YYYY/MM/001.
 */
export function generateInvoiceNumber(counter: number, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const safeCounter = Number.isFinite(counter) && counter > 0 ? Math.floor(counter) : 1;
  const sequence = String(safeCounter).padStart(3, '0');
  return `INV/${year}/${month}/${sequence}`;
}

/**
 * Mengembalikan tanggal lokal hari ini dalam format YYYY-MM-DD.
 */
export function getTodayIsoDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Menghitung subtotal, diskon, PPN 11%, grand total, dan terbilang.
 */
export function calculateTotals(
  items: ServiceItem[],
  calculation: CalculationSettings
): InvoiceTotals {
  const subtotal = items.reduce((sum, item) => {
    const qty = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 0;
    const price = Number.isFinite(item.unitPrice) && item.unitPrice > 0 ? item.unitPrice : 0;
    return sum + Math.round(qty * price);
  }, 0);

  let rawDiscount = 0;
  if (calculation.discountType === 'percent') {
    const pct = Math.min(100, Math.max(0, calculation.discountValue || 0));
    rawDiscount = Math.round((subtotal * pct) / 100);
  } else {
    rawDiscount = Math.round(Math.max(0, calculation.discountValue || 0));
  }

  const discountAmount = Math.min(subtotal, rawDiscount);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const ppnAmount = calculation.ppnEnabled ? Math.round(afterDiscount * 0.11) : 0;
  const grandTotal = afterDiscount + ppnAmount;

  return {
    subtotal,
    discountAmount,
    afterDiscount,
    ppnAmount,
    grandTotal,
    terbilangText: terbilang(grandTotal),
  };
}

/**
 * Menyusun nama file PDF: [nomor-invoice]-[nama-klien].pdf dengan '/' diganti '-'.
 */
export function sanitizePdfFilename(invoiceNumber: string, clientName: string): string {
  const cleanPart = (val: string, fallback: string) => {
    const replaced = val
      .trim()
      .replace(/\//g, '-')
      .replace(/[<>:"\\|?*]+/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return replaced || fallback;
  };

  const invPart = cleanPart(invoiceNumber, 'INVOICE');
  const clientPart = cleanPart(clientName, 'Klien');
  return `${invPart}-${clientPart}.pdf`;
}
