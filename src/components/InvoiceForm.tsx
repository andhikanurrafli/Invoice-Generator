import React, { useRef, useState } from 'react';
import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import type {
  BusinessInfo,
  CalculationSettings,
  ClientInfo,
  InvoiceDetails,
  ServiceItem,
  ValidationErrors,
} from '../types/invoice';
import { formatNumberDots, formatRupiah, parseFormattedNumber } from '../utils/invoiceHelpers';

interface InvoiceFormProps {
  businessInfo: BusinessInfo;
  onChangeBusiness: (next: BusinessInfo) => void;
  clientInfo: ClientInfo;
  onChangeClient: (next: ClientInfo) => void;
  invoiceDetails: InvoiceDetails;
  onChangeDetails: (next: InvoiceDetails) => void;
  items: ServiceItem[];
  onChangeItems: (next: ServiceItem[]) => void;
  calculation: CalculationSettings;
  onChangeCalculation: (next: CalculationSettings) => void;
  validationErrors: ValidationErrors;
  showSampleDataButton: boolean;
  onFillSampleData: () => void;
}

const MAX_LOGO_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB agar aman di localStorage

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  businessInfo,
  onChangeBusiness,
  clientInfo,
  onChangeClient,
  invoiceDetails,
  onChangeDetails,
  items,
  onChangeItems,
  calculation,
  onChangeCalculation,
  validationErrors,
  showSampleDataButton,
  onFillSampleData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string>('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Format berkas harus berupa gambar (PNG, JPG, atau SVG).');
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setLogoError('Ukuran logo maksimal 1,5 MB agar tersimpan di browser.');
      return;
    }

    setLogoError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChangeBusiness({ ...businessInfo, logoBase64: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoError('');
    onChangeBusiness({ ...businessInfo, logoBase64: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddRow = () => {
    onChangeItems([
      ...items,
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (items.length <= 1) return;
    onChangeItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateRow = (id: string, patch: Partial<ServiceItem>) => {
    onChangeItems(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15';

  const labelClass = 'block text-xs font-medium text-slate-700 mb-1.5';

  return (
    <div className="space-y-6 pb-10">
      {showSampleDataButton && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onFillSampleData}
            className="text-xs font-medium text-[#1E3A5F] transition-colors hover:text-[#162C49] hover:underline"
          >
            Isi contoh data
          </button>
        </div>
      )}

      {/* 1. Info Bisnis Saya */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-slate-100 pb-3.5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">1. Info Bisnis Saya</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Tersimpan otomatis di browser Anda untuk invoice berikutnya.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Upload Logo */}
          <div>
            <span className={labelClass}>Logo Bisnis (Opsional)</span>
            <div className="flex flex-wrap items-center gap-4">
              {businessInfo.logoBase64 ? (
                <div className="relative flex h-16 w-28 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <img
                    src={businessInfo.logoBase64}
                    alt="Logo bisnis"
                    className="max-h-full max-w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    aria-label="Hapus logo"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#1E3A5F] hover:bg-slate-100"
                >
                  <ImagePlus className="h-4 w-4 text-slate-500" />
                  <span>Unggah Logo (PNG / JPG)</span>
                </button>
              )}

              {businessInfo.logoBase64 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-[#1E3A5F] hover:underline"
                >
                  Ganti logo
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
            {logoError && <p className="mt-1.5 text-xs text-red-600">{logoError}</p>}
          </div>

          <div>
            <label htmlFor="biz-name" className={labelClass}>
              Nama Bisnis / Pengirim
            </label>
            <input
              id="biz-name"
              type="text"
              value={businessInfo.name}
              onChange={(e) => onChangeBusiness({ ...businessInfo, name: e.target.value })}
              placeholder="Contoh: Studio Karsa Digital"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="biz-address" className={labelClass}>
              Alamat Bisnis
            </label>
            <textarea
              id="biz-address"
              rows={2}
              value={businessInfo.address}
              onChange={(e) => onChangeBusiness({ ...businessInfo, address: e.target.value })}
              placeholder="Contoh: Jl. Kemang Raya No. 42, Jakarta Selatan 12730"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="biz-email" className={labelClass}>
                Email Bisnis
              </label>
              <input
                id="biz-email"
                type="email"
                value={businessInfo.email}
                onChange={(e) => onChangeBusiness({ ...businessInfo, email: e.target.value })}
                placeholder="halo@studiokarsa.id"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="biz-phone" className={labelClass}>
                Nomor Telepon
              </label>
              <input
                id="biz-phone"
                type="text"
                value={businessInfo.phone}
                onChange={(e) => onChangeBusiness({ ...businessInfo, phone: e.target.value })}
                placeholder="0812-8890-4410"
                className={inputClass}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Info Pembayaran
              </h3>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => onChangeBusiness({ ...businessInfo, paymentMethod: 'bank' })}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    businessInfo.paymentMethod === 'bank'
                      ? 'bg-white text-[#1E3A5F] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Transfer Bank
                </button>
                <button
                  type="button"
                  onClick={() => onChangeBusiness({ ...businessInfo, paymentMethod: 'ewallet' })}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    businessInfo.paymentMethod === 'ewallet'
                      ? 'bg-white text-[#1E3A5F] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  E-Wallet
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="biz-bank" className={labelClass}>
                  Nama Bank / E-Wallet
                </label>
                <input
                  id="biz-bank"
                  type="text"
                  value={businessInfo.bankName}
                  onChange={(e) => onChangeBusiness({ ...businessInfo, bankName: e.target.value })}
                  placeholder={
                    businessInfo.paymentMethod === 'ewallet'
                      ? 'Contoh: GoPay / OVO / DANA'
                      : 'Contoh: Bank BCA'
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="biz-rek" className={labelClass}>
                  Nomor Rekening / Akun
                </label>
                <input
                  id="biz-rek"
                  type="text"
                  value={businessInfo.accountNumber}
                  onChange={(e) =>
                    onChangeBusiness({ ...businessInfo, accountNumber: e.target.value })
                  }
                  placeholder={
                    businessInfo.paymentMethod === 'ewallet' ? '0812-8890-4410' : '5420891120'
                  }
                  className={`${inputClass} tabular-nums`}
                />
              </div>
              <div>
                <label htmlFor="biz-holder" className={labelClass}>
                  Atas Nama
                </label>
                <input
                  id="biz-holder"
                  type="text"
                  value={businessInfo.accountHolder}
                  onChange={(e) =>
                    onChangeBusiness({ ...businessInfo, accountHolder: e.target.value })
                  }
                  placeholder="Contoh: PT Karsa Digital Nusantara"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Info Klien */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5 border-b border-slate-100 pb-3.5">
          <h2 className="text-base font-semibold text-slate-900">2. Info Klien</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Penerima tagihan yang akan ditampilkan pada dokumen invoice.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="client-name" className={labelClass}>
              Nama Klien <span className="text-red-600">*</span>
            </label>
            <input
              id="client-name"
              type="text"
              value={clientInfo.name}
              onChange={(e) => onChangeClient({ ...clientInfo, name: e.target.value })}
              placeholder="Contoh: PT Maju Bersama Sejahtera"
              className={`${inputClass} ${
                validationErrors.clientName
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
                  : ''
              }`}
            />
            {validationErrors.clientName && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {validationErrors.clientName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="client-address" className={labelClass}>
              Alamat Klien
            </label>
            <textarea
              id="client-address"
              rows={2}
              value={clientInfo.address}
              onChange={(e) => onChangeClient({ ...clientInfo, address: e.target.value })}
              placeholder="Contoh: Jl. Jend. Sudirman Kav. 52-53, Jakarta Pusat 12190"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="client-contact" className={labelClass}>
              Email atau Nomor Telepon Klien
            </label>
            <input
              id="client-contact"
              type="text"
              value={clientInfo.contact}
              onChange={(e) => onChangeClient({ ...clientInfo, contact: e.target.value })}
              placeholder="finance@majubersama.co.id"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* 3. Detail Invoice */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5 border-b border-slate-100 pb-3.5">
          <h2 className="text-base font-semibold text-slate-900">3. Detail Invoice</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="inv-number" className={labelClass}>
              Nomor Invoice
            </label>
            <input
              id="inv-number"
              type="text"
              value={invoiceDetails.invoiceNumber}
              onChange={(e) =>
                onChangeDetails({ ...invoiceDetails, invoiceNumber: e.target.value })
              }
              placeholder="INV/2026/11/001"
              className={`${inputClass} tabular-nums font-medium`}
            />
          </div>

          <div>
            <label htmlFor="inv-issue-date" className={labelClass}>
              Tanggal Terbit
            </label>
            <input
              id="inv-issue-date"
              type="date"
              value={invoiceDetails.issueDate}
              onChange={(e) =>
                onChangeDetails({ ...invoiceDetails, issueDate: e.target.value })
              }
              className={inputClass}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="inv-due-date" className="text-xs font-medium text-slate-700">
                Jatuh Tempo (Opsional)
              </label>
              {invoiceDetails.dueDate && (
                <button
                  type="button"
                  onClick={() => onChangeDetails({ ...invoiceDetails, dueDate: '' })}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                >
                  Hapus
                </button>
              )}
            </div>
            <input
              id="inv-due-date"
              type="date"
              value={invoiceDetails.dueDate}
              onChange={(e) => onChangeDetails({ ...invoiceDetails, dueDate: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* 4. Daftar Layanan */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">4. Daftar Layanan</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Minimal 1 baris layanan dengan harga lebih dari Rp 0.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E3A5F]/20 bg-[#1E3A5F]/5 px-3 py-2 text-xs font-semibold text-[#1E3A5F] transition-colors hover:bg-[#1E3A5F]/10 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Baris</span>
          </button>
        </div>

        {validationErrors.items && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
            {validationErrors.items}
          </div>
        )}

        <div className="space-y-3">
          {items.map((item, idx) => {
            const rowSubtotal = Math.round(
              Math.max(0, item.quantity || 0) * Math.max(0, item.unitPrice || 0)
            );
            const canDelete = items.length > 1;

            return (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 transition-colors focus-within:border-slate-300"
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 tabular-nums">
                    Item #{idx + 1}
                  </span>
                  <button
                    type="button"
                    disabled={!canDelete}
                    onClick={() => handleRemoveRow(item.id)}
                    aria-label={`Hapus baris ${idx + 1}`}
                    title={canDelete ? 'Hapus baris' : 'Minimal 1 baris harus ada'}
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                      canDelete
                        ? 'text-slate-500 hover:bg-red-50 hover:text-red-600'
                        : 'cursor-not-allowed text-slate-300'
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-6">
                    <label htmlFor={`item-desc-${item.id}`} className={labelClass}>
                      Nama Layanan / Deskripsi
                    </label>
                    <input
                      id={`item-desc-${item.id}`}
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateRow(item.id, { description: e.target.value })}
                      placeholder="Contoh: Desain UI/UX Aplikasi"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:col-span-6 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <label htmlFor={`item-qty-${item.id}`} className={labelClass}>
                        Qty
                      </label>
                      <input
                        id={`item-qty-${item.id}`}
                        type="number"
                        min={1}
                        step={1}
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={(e) => {
                          const val = Number.parseInt(e.target.value, 10);
                          handleUpdateRow(item.id, {
                            quantity: Number.isFinite(val) && val > 0 ? val : 0,
                          });
                        }}
                        onBlur={() => {
                          if (item.quantity <= 0) {
                            handleUpdateRow(item.id, { quantity: 1 });
                          }
                        }}
                        className={`${inputClass} tabular-nums`}
                      />
                    </div>

                    <div className="sm:col-span-8">
                      <label htmlFor={`item-price-${item.id}`} className={labelClass}>
                        Harga Satuan (Rp)
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                          Rp
                        </span>
                        <input
                          id={`item-price-${item.id}`}
                          type="text"
                          inputMode="numeric"
                          value={item.unitPrice > 0 ? formatNumberDots(item.unitPrice) : ''}
                          onChange={(e) =>
                            handleUpdateRow(item.id, {
                              unitPrice: parseFormattedNumber(e.target.value),
                            })
                          }
                          placeholder="0"
                          className={`${inputClass} pl-9 text-right tabular-nums`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-slate-200/70 pt-2 text-xs">
                  <span className="text-slate-500">Subtotal baris:</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatRupiah(rowSubtotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-[#1E3A5F] hover:bg-slate-50 hover:text-[#1E3A5F]"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Baris</span>
        </button>
      </section>

      {/* 5. Kalkulasi */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5 border-b border-slate-100 pb-3.5">
          <h2 className="text-base font-semibold text-slate-900">5. Kalkulasi</h2>
        </div>

        <div className="space-y-5">
          {/* Diskon */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-4">
              <label htmlFor="calc-discount" className="text-xs font-medium text-slate-700">
                Diskon (Opsional)
              </label>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() =>
                    onChangeCalculation({
                      ...calculation,
                      discountType: 'nominal',
                      discountValue: 0,
                    })
                  }
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    calculation.discountType === 'nominal'
                      ? 'bg-white text-[#1E3A5F] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Nominal (Rp)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChangeCalculation({
                      ...calculation,
                      discountType: 'percent',
                      discountValue: 0,
                    })
                  }
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    calculation.discountType === 'percent'
                      ? 'bg-white text-[#1E3A5F] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Persen (%)
                </button>
              </div>
            </div>

            {calculation.discountType === 'nominal' ? (
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  Rp
                </span>
                <input
                  id="calc-discount"
                  type="text"
                  inputMode="numeric"
                  value={calculation.discountValue > 0 ? formatNumberDots(calculation.discountValue) : ''}
                  onChange={(e) =>
                    onChangeCalculation({
                      ...calculation,
                      discountValue: parseFormattedNumber(e.target.value),
                    })
                  }
                  placeholder="0"
                  className={`${inputClass} pl-10 text-right tabular-nums`}
                />
              </div>
            ) : (
              <div className="relative">
                <input
                  id="calc-discount"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={calculation.discountValue === 0 ? '' : calculation.discountValue}
                  onChange={(e) => {
                    const raw = Number.parseFloat(e.target.value);
                    const clamped = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
                    onChangeCalculation({
                      ...calculation,
                      discountValue: clamped,
                    });
                  }}
                  placeholder="0"
                  className={`${inputClass} pr-10 text-right tabular-nums`}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  %
                </span>
              </div>
            )}
          </div>

          {/* Toggle PPN 11% */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div>
              <span className="block text-sm font-medium text-slate-900">PPN 11%</span>
              <span className="block text-xs text-slate-500">
                Tambahkan pajak pertambahan nilai 11% ke total tagihan.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={calculation.ppnEnabled}
              aria-label="Aktifkan PPN 11%"
              onClick={() =>
                onChangeCalculation({
                  ...calculation,
                  ppnEnabled: !calculation.ppnEnabled,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 ${
                calculation.ppnEnabled ? 'bg-[#1E3A5F]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  calculation.ppnEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label htmlFor="calc-notes" className={labelClass}>
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              id="calc-notes"
              rows={3}
              value={calculation.notes}
              onChange={(e) => onChangeCalculation({ ...calculation, notes: e.target.value })}
              placeholder="Contoh: Pembayaran dilakukan maksimal 14 hari setelah invoice diterima."
              className={inputClass}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
