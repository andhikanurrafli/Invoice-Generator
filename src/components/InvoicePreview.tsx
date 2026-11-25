import React, { useEffect, useRef, useState } from 'react';
import type {
  BusinessInfo,
  CalculationSettings,
  ClientInfo,
  InvoiceDetails,
  InvoiceTotals,
  ServiceItem,
} from '../types/invoice';
import { formatRupiah, formatTanggalIndonesia } from '../utils/invoiceHelpers';

interface InvoicePreviewProps {
  sheetRef: React.RefObject<HTMLDivElement | null>;
  businessInfo: BusinessInfo;
  clientInfo: ClientInfo;
  invoiceDetails: InvoiceDetails;
  items: ServiceItem[];
  calculation: CalculationSettings;
  totals: InvoiceTotals;
}

const A4_WIDTH_PX = 794;
const A4_MIN_HEIGHT_PX = 1123;

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  sheetRef,
  businessInfo,
  clientInfo,
  invoiceDetails,
  items,
  calculation,
  totals,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.72);
  const [sheetHeight, setSheetHeight] = useState<number>(A4_MIN_HEIGHT_PX);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateScale = () => {
      const availableWidth = wrapper.clientWidth;
      if (availableWidth > 0) {
        const nextScale = Math.min(1, availableWidth / A4_WIDTH_PX);
        setScale(nextScale);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const updateHeight = () => {
      setSheetHeight(Math.max(A4_MIN_HEIGHT_PX, sheet.scrollHeight));
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [sheetRef, businessInfo, clientInfo, invoiceDetails, items, calculation, totals]);

  const hasPaymentInfo =
    businessInfo.bankName.trim() !== '' ||
    businessInfo.accountNumber.trim() !== '' ||
    businessInfo.accountHolder.trim() !== '';

  const formattedIssueDate = formatTanggalIndonesia(invoiceDetails.issueDate);
  const formattedDueDate = formatTanggalIndonesia(invoiceDetails.dueDate);

  return (
    <div ref={wrapperRef} className="w-full overflow-hidden">
      <div
        className="mx-auto origin-top-left"
        style={{
          width: `${Math.round(A4_WIDTH_PX * scale)}px`,
          height: `${Math.round(sheetHeight * scale)}px`,
        }}
      >
        {/* Lembar A4 portrait sesungguhnya (794px = 210mm @ 96dpi) */}
        <div
          ref={sheetRef}
          style={{
            width: `${A4_WIDTH_PX}px`,
            minHeight: `${A4_MIN_HEIGHT_PX}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            backgroundColor: '#ffffff',
            color: '#0f172a',
          }}
          className="flex flex-col justify-between border border-[#e2e8f0] p-[48px] shadow-sm"
        >
          <div>
            {/* Header: Logo + Nama Bisnis di kiri, INVOICE + Nomor Invoice di kanan */}
            <div
              data-pdf-avoid-break="true"
              className="flex items-start justify-between gap-8 border-b border-[#e2e8f0] pb-6"
            >
              <div className="flex items-center gap-4">
                {businessInfo.logoBase64 && (
                  <img
                    src={businessInfo.logoBase64}
                    alt="Logo Bisnis"
                    className="h-14 max-w-[140px] object-contain"
                  />
                )}
                <div>
                  <h1 className="text-[20px] font-bold tracking-tight text-[#0f172a]">
                    {businessInfo.name.trim() || 'Nama Bisnis Anda'}
                  </h1>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[30px] font-bold leading-none tracking-tight text-[#1E3A5F]">
                  INVOICE
                </div>
                <div className="mt-2 text-[13px] font-medium text-[#475569] tabular-nums">
                  {invoiceDetails.invoiceNumber.trim() || 'INV/YYYY/MM/001'}
                </div>
              </div>
            </div>

            {/* Info Bisnis, Info Klien, Tanggal Terbit, Jatuh Tempo */}
            <div
              data-pdf-avoid-break="true"
              className="mt-7 grid grid-cols-12 gap-6 border-b border-[#e2e8f0] pb-7"
            >
              {/* Info Bisnis */}
              <div className="col-span-5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Dari
                </div>
                <div className="mt-1.5 text-[13px] font-semibold text-[#0f172a]">
                  {businessInfo.name.trim() || 'Nama Bisnis Anda'}
                </div>
                {businessInfo.address.trim() && (
                  <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-[#475569]">
                    {businessInfo.address}
                  </p>
                )}
                <div className="mt-1.5 space-y-0.5 text-[12px] text-[#475569]">
                  {businessInfo.email.trim() && <div>{businessInfo.email}</div>}
                  {businessInfo.phone.trim() && (
                    <div className="tabular-nums">{businessInfo.phone}</div>
                  )}
                </div>
              </div>

              {/* Info Klien */}
              <div className="col-span-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  Ditagihkan Kepada
                </div>
                <div
                  className={`mt-1.5 text-[13px] font-semibold ${
                    clientInfo.name.trim() ? 'text-[#0f172a]' : 'italic text-[#94a3b8]'
                  }`}
                >
                  {clientInfo.name.trim() || 'Nama Klien'}
                </div>
                {clientInfo.address.trim() && (
                  <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-[#475569]">
                    {clientInfo.address}
                  </p>
                )}
                {clientInfo.contact.trim() && (
                  <div className="mt-1.5 text-[12px] text-[#475569]">{clientInfo.contact}</div>
                )}
              </div>

              {/* Tanggal Terbit & Jatuh Tempo */}
              <div className="col-span-3 text-right">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                    Tanggal Terbit
                  </div>
                  <div className="mt-1 text-[12.5px] font-medium text-[#0f172a] tabular-nums">
                    {formattedIssueDate || '-'}
                  </div>
                </div>

                {formattedDueDate && (
                  <div className="mt-3.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                      Jatuh Tempo
                    </div>
                    <div className="mt-1 text-[12.5px] font-medium text-[#0f172a] tabular-nums">
                      {formattedDueDate}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabel Layanan */}
            <div className="mt-7">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr
                    data-pdf-avoid-break="true"
                    className="border-y border-[#cbd5e1] bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-[#1E3A5F]"
                  >
                    <th className="w-[46px] px-3 py-3 text-center">No</th>
                    <th className="px-3 py-3">Deskripsi</th>
                    <th className="w-[68px] px-3 py-3 text-right">Qty</th>
                    <th className="w-[140px] px-3 py-3 text-right">Harga Satuan</th>
                    <th className="w-[150px] px-3 py-3 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const qty = Math.max(0, item.quantity || 0);
                    const price = Math.max(0, item.unitPrice || 0);
                    const lineTotal = Math.round(qty * price);

                    return (
                      <tr
                        key={item.id}
                        data-pdf-avoid-break="true"
                        className="border-b border-[#e2e8f0] text-[12.5px] text-[#0f172a]"
                      >
                        <td className="px-3 py-3.5 text-center align-top text-[#64748b] tabular-nums">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3.5 align-top">
                          <span
                            className={
                              item.description.trim()
                                ? 'font-medium text-[#0f172a]'
                                : 'italic text-[#94a3b8]'
                            }
                          >
                            {item.description.trim() || 'Deskripsi layanan'}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-right align-top tabular-nums">{qty}</td>
                        <td className="px-3 py-3.5 text-right align-top tabular-nums">
                          {formatRupiah(price)}
                        </td>
                        <td className="px-3 py-3.5 text-right align-top font-medium tabular-nums">
                          {formatRupiah(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Ringkasan & Terbilang */}
            <div data-pdf-avoid-break="true" className="mt-6 flex flex-col items-end">
              <div className="w-[310px] space-y-2 text-[12.5px]">
                <div className="flex items-center justify-between text-[#475569]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#0f172a] tabular-nums">
                    {formatRupiah(totals.subtotal)}
                  </span>
                </div>

                {totals.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-[#475569]">
                    <span>
                      Diskon
                      {calculation.discountType === 'percent' && calculation.discountValue > 0
                        ? ` (${calculation.discountValue}%)`
                        : ''}
                    </span>
                    <span className="font-medium text-[#0f172a] tabular-nums">
                      -{formatRupiah(totals.discountAmount)}
                    </span>
                  </div>
                )}

                {calculation.ppnEnabled && (
                  <div className="flex items-center justify-between text-[#475569]">
                    <span>PPN 11%</span>
                    <span className="font-medium text-[#0f172a] tabular-nums">
                      {formatRupiah(totals.ppnAmount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-b border-[#1E3A5F] py-2.5 text-[15px] font-bold text-[#1E3A5F]">
                  <span>TOTAL</span>
                  <span className="tabular-nums">{formatRupiah(totals.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Terbilang */}
            <div
              data-pdf-avoid-break="true"
              className="mt-5 rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5 text-[12px]"
            >
              <span className="font-semibold text-[#1E3A5F]">Terbilang: </span>
              <span className="italic text-[#334155]">{totals.terbilangText}</span>
            </div>

            {/* Blok Info Pembayaran & Catatan */}
            {(hasPaymentInfo || calculation.notes.trim() !== '') && (
              <div
                data-pdf-avoid-break="true"
                className="mt-7 grid grid-cols-12 gap-6 border-t border-[#e2e8f0] pt-6 text-[12px]"
              >
                {hasPaymentInfo && (
                  <div className={calculation.notes.trim() ? 'col-span-6' : 'col-span-12'}>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1E3A5F]">
                      Info Pembayaran
                    </div>
                    <div className="mt-2 space-y-1 text-[#334155]">
                      <div>
                        <span className="text-[#64748b]">Metode: </span>
                        <span className="font-medium text-[#0f172a]">
                          {businessInfo.paymentMethod === 'ewallet'
                            ? 'E-Wallet'
                            : 'Transfer Bank'}
                        </span>
                      </div>
                      {businessInfo.bankName.trim() && (
                        <div>
                          <span className="text-[#64748b]">Bank / E-Wallet: </span>
                          <span className="font-medium text-[#0f172a]">
                            {businessInfo.bankName}
                          </span>
                        </div>
                      )}
                      {businessInfo.accountNumber.trim() && (
                        <div>
                          <span className="text-[#64748b]">No. Rekening / Akun: </span>
                          <span className="font-semibold text-[#0f172a] tabular-nums">
                            {businessInfo.accountNumber}
                          </span>
                        </div>
                      )}
                      {businessInfo.accountHolder.trim() && (
                        <div>
                          <span className="text-[#64748b]">Atas Nama: </span>
                          <span className="font-medium text-[#0f172a]">
                            {businessInfo.accountHolder}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {calculation.notes.trim() !== '' && (
                  <div className={hasPaymentInfo ? 'col-span-6' : 'col-span-12'}>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1E3A5F]">
                      Catatan
                    </div>
                    <p className="mt-2 whitespace-pre-line leading-relaxed text-[#475569]">
                      {calculation.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            data-pdf-avoid-break="true"
            className="mt-10 border-t border-[#e2e8f0] pt-4 text-center text-[11.5px] text-[#64748b]"
          >
            Terima kasih atas kepercayaan Anda.
          </div>
        </div>
      </div>
    </div>
  );
};
