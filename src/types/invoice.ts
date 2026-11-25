export type DiscountType = 'nominal' | 'percent';
export type PaymentMethod = 'bank' | 'ewallet';

export interface BusinessInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  logoBase64: string;
  paymentMethod: PaymentMethod;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface ClientInfo {
  name: string;
  address: string;
  contact: string;
}

export interface InvoiceDetails {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
}

export interface ServiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CalculationSettings {
  discountType: DiscountType;
  discountValue: number;
  ppnEnabled: boolean;
  notes: string;
}

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  afterDiscount: number;
  ppnAmount: number;
  grandTotal: number;
  terbilangText: string;
}

export interface ValidationErrors {
  clientName?: string;
  items?: string;
}
