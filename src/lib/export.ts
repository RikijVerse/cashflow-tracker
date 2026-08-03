function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

const escapeCell = (value: string | number): string => {
  const s = String(value ?? '')
  if (/[";\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * Export tabel ke file CSV (dipisah titik-koma agar rapi di Excel id-ID).
 */
export function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(';'))
    .join('\n')
  const blob = new Blob(['\ufeff' + csv], {
    type: 'text/csv;charset=utf-8;',
  })
  triggerDownload(blob, filename)
}

/**
 * Export tabel ke file PDF ringkas (jsPDF + autotable).
 * jsPDF diimpor dinamis agar tidak membebani bundle utama.
 */
export async function downloadPDF(
  filename: string,
  title: string,
  subtitle: string,
  head: string[],
  rows: (string | number)[][],
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(24, 24, 27)
  doc.text(title, 40, 44)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(113, 113, 122)
  doc.text(subtitle, 40, 62)

  doc.setDrawColor(228, 228, 231)
  doc.line(40, 74, pageWidth - 40, 74)

  autoTable(doc, {
    startY: 86,
    head: [head],
    body: rows,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 7,
      textColor: [39, 39, 42],
      lineColor: [228, 228, 231],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [250, 250, 250],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 40, right: 40 },
  })

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(161, 161, 170)
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      pageWidth - 40,
      doc.internal.pageSize.getHeight() - 24,
      { align: 'right' },
    )
  }

  doc.save(filename)
}
