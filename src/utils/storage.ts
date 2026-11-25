import type { BusinessInfo, CalculationSettings, ClientInfo, ServiceItem } from '../types/invoice';
import { generateInvoiceNumber, getTodayIsoDate } from './invoiceHelpers';

const STORAGE_KEY_BUSINESS = 'buat_invoice_business_v1';
const STORAGE_KEY_COUNTER = 'buat_invoice_counter_v1';

export const SAMPLE_BUSINESS_INFO: BusinessInfo = {
  name: 'Studio Karsa Digital',
  address: 'Jl. Kemang Raya No. 42, Jakarta Selatan 12730',
  email: 'halo@studiokarsa.id',
  phone: '0812-8890-4410',
  logoBase64: '',
  paymentMethod: 'bank',
  bankName: 'Bank BCA',
  accountNumber: '5420891120',
  accountHolder: 'PT Karsa Digital Nusantara',
};

export const SAMPLE_CLIENT_INFO: ClientInfo = {
  name: 'PT Maju Bersama Sejahtera',
  address: 'Jl. Jend. Sudirman Kav. 52-53, Jakarta Pusat 12190',
  contact: 'finance@majubersama.co.id',
};

export const SAMPLE_NOTES = 'Pembayaran dilakukan maksimal 14 hari setelah invoice diterima.';

export function createSampleItems(): ServiceItem[] {
  return [
    {
      id: crypto.randomUUID(),
      description: 'Desain & Pengembangan Website Perusahaan',
      quantity: 1,
      unitPrice: 4500000,
    },
    {
      id: crypto.randomUUID(),
      description: 'Integrasi Formulir & Optimasi Kecepatan',
      quantity: 1,
      unitPrice: 1500000,
    },
  ];
}

export function createEmptyBusinessInfo(): BusinessInfo {
  return {
    name: '',
    address: '',
    email: '',
    phone: '',
    logoBase64: '',
    paymentMethod: 'bank',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  };
}

export function createEmptyClientInfo(): ClientInfo {
  return {
    name: '',
    address: '',
    contact: '',
  };
}

export function createEmptyServiceItem(): ServiceItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unitPrice: 0,
  };
}

export function createDefaultCalculation(): CalculationSettings {
  return {
    discountType: 'nominal',
    discountValue: 0,
    ppnEnabled: false,
    notes: '',
  };
}

export function hasSavedBusinessInfo(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_BUSINESS) !== null;
  } catch {
    return false;
  }
}

export function loadBusinessInfo(): BusinessInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BUSINESS);
    if (!raw) return createEmptyBusinessInfo();
    const parsed = JSON.parse(raw) as Partial<BusinessInfo>;
    return {
      name: parsed.name ?? '',
      address: parsed.address ?? '',
      email: parsed.email ?? '',
      phone: parsed.phone ?? '',
      logoBase64: parsed.logoBase64 ?? '',
      paymentMethod: parsed.paymentMethod === 'ewallet' ? 'ewallet' : 'bank',
      bankName: parsed.bankName ?? '',
      accountNumber: parsed.accountNumber ?? '',
      accountHolder: parsed.accountHolder ?? '',
    };
  } catch {
    return createEmptyBusinessInfo();
  }
}

export function saveBusinessInfo(info: BusinessInfo): void {
  try {
    localStorage.setItem(STORAGE_KEY_BUSINESS, JSON.stringify(info));
  } catch {
    // Abaikan jika penyimpanan penuh atau tidak tersedia
  }
}

export function loadInvoiceCounter(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COUNTER);
    if (!raw) return 1;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
  } catch {
    return 1;
  }
}

export function saveInvoiceCounter(counter: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_COUNTER, String(Math.max(1, Math.floor(counter))));
  } catch {
    // Abaikan jika penyimpanan tidak tersedia
  }
}

export function incrementInvoiceCounter(): number {
  const next = loadInvoiceCounter() + 1;
  saveInvoiceCounter(next);
  return next;
}

export function getInitialState() {
  const businessInfo = loadBusinessInfo();
  const counter = loadInvoiceCounter();
  const today = getTodayIsoDate();

  return {
    businessInfo,
    clientInfo: createEmptyClientInfo(),
    invoiceDetails: {
      invoiceNumber: generateInvoiceNumber(counter),
      issueDate: today,
      dueDate: '',
    },
    items: [createEmptyServiceItem()],
    calculation: createDefaultCalculation(),
  };
}
