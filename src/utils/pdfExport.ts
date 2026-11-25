import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

// Dimensi A4 pada 96 DPI: 210mm x 297mm ≈ 794px x 1122.52px
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1122.52;
const PAGE_TOP_PADDING_PX = 44;
const PAGE_BOTTOM_MARGIN_PX = 44;

/**
 * Menyisipkan jarak aman sebelum baris tabel atau blok konten yang berisiko terpotong
 * di batas halaman A4 agar tidak ada baris yang terbelah dua.
 */
function insertRowSafePageBreaks(container: HTMLElement): void {
  const containerRect = container.getBoundingClientRect();
  const blocks = Array.from(container.querySelectorAll<HTMLElement>('[data-pdf-avoid-break="true"]'));

  let currentPage = 0;

  for (const block of blocks) {
    // Refresh posisi setelah modifikasi DOM sebelumnya
    const rect = block.getBoundingClientRect();
    const top = rect.top - containerRect.top;
    const height = rect.height;
    const bottom = top + height;

    // Update currentPage jika blok sudah mulai di halaman berikutnya
    while (top >= (currentPage + 1) * A4_HEIGHT_PX) {
      currentPage++;
    }

    const usablePageBottom = (currentPage + 1) * A4_HEIGHT_PX - PAGE_BOTTOM_MARGIN_PX;

    // Hanya geser jika blok melewati batas bawah aman dan tingginya muat di 1 halaman
    if (bottom > usablePageBottom && height < A4_HEIGHT_PX - PAGE_TOP_PADDING_PX - PAGE_BOTTOM_MARGIN_PX) {
      const nextPageStart = (currentPage + 1) * A4_HEIGHT_PX + PAGE_TOP_PADDING_PX;
      const gap = Math.max(0, Math.ceil(nextPageStart - top));

      if (gap > 0) {
        if (block.tagName.toLowerCase() === 'tr') {
          const colCount = block.children.length || 5;
          const spacerRow = document.createElement('tr');
          spacerRow.setAttribute('aria-hidden', 'true');
          const spacerCell = document.createElement('td');
          spacerCell.colSpan = colCount;
          spacerCell.style.height = `${gap}px`;
          spacerCell.style.padding = '0';
          spacerCell.style.border = 'none';
          spacerCell.style.background = 'transparent';
          spacerRow.appendChild(spacerCell);
          block.parentNode?.insertBefore(spacerRow, block);
        } else {
          const existingMargin = Number.parseFloat(getComputedStyle(block).marginTop) || 0;
          block.style.marginTop = `${existingMargin + gap}px`;
        }
        currentPage++;
      }
    }
  }
}

/**
 * Mengonversi elemen pratinjau A4 menjadi file PDF berukuran A4 tajam dan identik dengan preview.
 */
export async function exportInvoiceToPdf(sourceElement: HTMLElement, filename: string): Promise<void> {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = `${A4_WIDTH_PX}px`;
  host.style.backgroundColor = '#ffffff';
  host.style.zIndex = '-1';
  host.style.pointerEvents = 'none';

  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.width = `${A4_WIDTH_PX}px`;
  clone.style.minHeight = `${Math.ceil(A4_HEIGHT_PX)}px`;
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.borderRadius = '0';
  clone.style.margin = '0';

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    // Tunggu font siap agar teks dirender tajam
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Pastikan tidak ada baris tabel atau blok penting yang terpotong antar halaman
    insertRowSafePageBreaks(clone);

    const totalHeightPx = Math.max(Math.ceil(A4_HEIGHT_PX), clone.scrollHeight);
    const scale = window.innerWidth < 1024 ? 2 : 3; // Skala 2 di layar mobile/tablet untuk menghindari batas ukuran canvas iPhone Safari

    const fullCanvas = await html2canvas(clone, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: A4_WIDTH_PX,
      height: totalHeightPx,
      windowWidth: A4_WIDTH_PX,
      logging: false,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const singlePageCanvasHeight = Math.round(A4_HEIGHT_PX * scale);
    const totalPages = Math.max(1, Math.ceil((totalHeightPx - 8) / A4_HEIGHT_PX));

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      if (pageIdx > 0) {
        pdf.addPage('a4', 'portrait');
      }

      const srcY = pageIdx * singlePageCanvasHeight;
      const remainingHeight = Math.max(0, fullCanvas.height - srcY);
      const sliceHeight = Math.min(singlePageCanvasHeight, remainingHeight);

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = fullCanvas.width;
      pageCanvas.height = singlePageCanvasHeight;

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        if (sliceHeight > 0) {
          ctx.drawImage(
            fullCanvas,
            0,
            srcY,
            fullCanvas.width,
            sliceHeight,
            0,
            0,
            fullCanvas.width,
            sliceHeight
          );
        }
      }

      const imgData = pageCanvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(host);
  }
}
