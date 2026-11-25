import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Download, FilePlus2, Loader2 } from 'lucide-react';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import type {
  BusinessInfo,
  CalculationSettings,
  ClientInfo,
  InvoiceDetails,
  ServiceItem,
  ValidationErrors,
} from './types/invoice';
import {
  calculateTotals,
  generateInvoiceNumber,
  getTodayIsoDate,
  sanitizePdfFilename,
} from './utils/invoiceHelpers';
import { exportInvoiceToPdf } from './utils/pdfExport';
import {
  SAMPLE_BUSINESS_INFO,
  SAMPLE_CLIENT_INFO,
  SAMPLE_NOTES,
  createDefaultCalculation,
  createEmptyClientInfo,
  createEmptyServiceItem,
  createSampleItems,
  getInitialState,
  hasSavedBusinessInfo,
  incrementInvoiceCounter,
  saveBusinessInfo,
} from './utils/storage';

type MobileTab = 'form' | 'preview';

export default function App() {
  const initialState = useMemo(() => getInitialState(), []);
  const isReturningUser = useMemo(() => hasSavedBusinessInfo(), []);

  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(initialState.businessInfo);
  const [clientInfo, setClientInfo] = useState<ClientInfo>(initialState.clientInfo);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>(
    initialState.invoiceDetails
  );
  const [items, setItems] = useState<ServiceItem[]>(initialState.items);
  const [calculation, setCalculation] = useState<CalculationSettings>(initialState.calculation);

  const [mobileTab, setMobileTab] = useState<MobileTab>('form');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [pdfError, setPdfError] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const previewSheetRef = useRef<HTMLDivElement | null>(null);
  const hasInteractedBusiness = useRef<boolean>(false);

  // Simpan perubahan Info Bisnis ke localStorage secara otomatis
  useEffect(() => {
    if (!hasInteractedBusiness.current) return;
    saveBusinessInfo(businessInfo);
  }, [businessInfo]);

  const handleChangeBusiness = (next: BusinessInfo) => {
    hasInteractedBusiness.current = true;
    setBusinessInfo(next);
  };

  const handleChangeClient = (next: ClientInfo) => {
    setClientInfo(next);
    if (validationErrors.clientName && next.name.trim().length > 0) {
      setValidationErrors((prev) => ({ ...prev, clientName: undefined }));
    }
  };

  const handleChangeItems = (next: ServiceItem[]) => {
    setItems(next);
    if (validationErrors.items && next.some((item) => item.unitPrice > 0)) {
      setValidationErrors((prev) => ({ ...prev, items: undefined }));
    }
  };

  const totals = useMemo(() => calculateTotals(items, calculation), [items, calculation]);

  const handleNewInvoice = () => {
    saveBusinessInfo(businessInfo);
    const nextCounter = incrementInvoiceCounter();
    setClientInfo(createEmptyClientInfo());
    setItems([createEmptyServiceItem()]);
    setCalculation(createDefaultCalculation());
    setInvoiceDetails({
      invoiceNumber: generateInvoiceNumber(nextCounter),
      issueDate: getTodayIsoDate(),
      dueDate: '',
    });
    setValidationErrors({});
    setPdfError('');
  };

  const handleFillSampleData = () => {
    hasInteractedBusiness.current = true;
    setBusinessInfo({ ...SAMPLE_BUSINESS_INFO });
    setClientInfo({ ...SAMPLE_CLIENT_INFO });
    setItems(createSampleItems());
    setCalculation((prev) => ({
      ...prev,
      notes: SAMPLE_NOTES,
    }));
    setValidationErrors({});
    setPdfError('');
  };

  const validateBeforeDownload = (): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!clientInfo.name.trim()) {
      errors.clientName = 'Nama klien wajib diisi sebelum mengunduh PDF.';
    }
    const hasValidPricedItem = items.some((item) => item.unitPrice > 0);
    if (!hasValidPricedItem) {
      errors.items = 'Isi minimal 1 layanan dengan harga satuan lebih dari Rp 0.';
    }
    return errors;
  };

  const handleDownloadPdf = async () => {
    setPdfError('');
    const errors = validateBeforeDownload();
    if (errors.clientName || errors.items) {
      setValidationErrors(errors);
      if (mobileTab === 'preview') {
        setMobileTab('form');
      }
      return;
    }

    const sheetEl = previewSheetRef.current;
    if (!sheetEl) {
      setPdfError('Elemen preview invoice belum siap. Silakan coba lagi.');
      return;
    }

    setIsExporting(true);
    try {
      const filename = sanitizePdfFilename(invoiceDetails.invoiceNumber, clientInfo.name);
      await exportInvoiceToPdf(sheetEl, filename);
    } catch {
      setPdfError('Gagal membuat file PDF. Silakan periksa data lalu coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const hasValidationErrors = Boolean(validationErrors.clientName || validationErrors.items);
  const showSampleDataButton =
    !isReturningUser &&
    businessInfo.name === '' &&
    businessInfo.address === '' &&
    clientInfo.name === '' &&
    items.every((item) => item.description === '');

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Header / Toolbar Utama */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="text-lg font-bold tracking-tight text-[#1E3A5F] whitespace-nowrap shrink-0">
            Fakturisasi
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleNewInvoice}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Invoice Baru</span>
            </button>

            {/* Tombol Download PDF selalu terlihat di mobile */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex lg:hidden items-center gap-1.5 rounded-lg bg-[#1E3A5F] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#162C49] disabled:cursor-wait disabled:opacity-70 whitespace-nowrap shrink-0"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>{isExporting ? 'Memproses...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

        {/* Tab Mobile: Isi Data | Preview */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2 lg:hidden">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-200/70 p-1">
            <button
              type="button"
              onClick={() => setMobileTab('form')}
              className={`rounded-md py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                mobileTab === 'form'
                  ? 'bg-white text-[#1E3A5F] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Isi Data
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className={`rounded-md py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                mobileTab === 'preview'
                  ? 'bg-white text-[#1E3A5F] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Preview
            </button>
          </div>
        </div>
      </header>

      {/* Konten Utama: 2 Kolom Desktop */}
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">
        {/* Banner Validasi Inline (Mobile) */}
        {(hasValidationErrors || pdfError) && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 lg:hidden"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="space-y-1">
              {validationErrors.clientName && <p>{validationErrors.clientName}</p>}
              {validationErrors.items && <p>{validationErrors.items}</p>}
              {pdfError && <p>{pdfError}</p>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Kolom Kiri: Form (Scrollable) */}
          <div className={`lg:col-span-6 ${mobileTab === 'form' ? 'block' : 'hidden lg:block'}`}>
            <InvoiceForm
              businessInfo={businessInfo}
              onChangeBusiness={handleChangeBusiness}
              clientInfo={clientInfo}
              onChangeClient={handleChangeClient}
              invoiceDetails={invoiceDetails}
              onChangeDetails={setInvoiceDetails}
              items={items}
              onChangeItems={handleChangeItems}
              calculation={calculation}
              onChangeCalculation={setCalculation}
              validationErrors={validationErrors}
              showSampleDataButton={showSampleDataButton}
              onFillSampleData={handleFillSampleData}
            />
          </div>

          {/* Kolom Kanan: Live Preview Invoice A4 (Sticky) */}
          <div
            className={`lg:sticky lg:top-[76px] lg:col-span-6 ${
              mobileTab === 'preview' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Bar Kontrol di Atas Preview */}
            <div className="mb-4 hidden items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 lg:flex">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Preview Invoice A4</h2>
                <p className="text-xs text-slate-500">
                  Terbarui otomatis sesuai isian formulir
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A5F] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#162C49] disabled:cursor-wait disabled:opacity-70 whitespace-nowrap shrink-0"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{isExporting ? 'Menyiapkan PDF...' : 'Download PDF'}</span>
              </button>
            </div>

            {/* Banner Validasi Inline di atas Preview (Desktop) */}
            {(hasValidationErrors || pdfError) && (
              <div
                role="alert"
                className="mb-4 hidden items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 lg:flex"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <div className="space-y-1">
                  {validationErrors.clientName && <p>{validationErrors.clientName}</p>}
                  {validationErrors.items && <p>{validationErrors.items}</p>}
                  {pdfError && <p>{pdfError}</p>}
                </div>
              </div>
            )}

            {/* Area Scroll Preview untuk layar desktop pendek */}
            <div className="lg:max-h-[calc(100vh-168px)] lg:overflow-y-auto lg:pr-1">
              <InvoicePreview
                sheetRef={previewSheetRef}
                businessInfo={businessInfo}
                clientInfo={clientInfo}
                invoiceDetails={invoiceDetails}
                items={items}
                calculation={calculation}
                totals={totals}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
