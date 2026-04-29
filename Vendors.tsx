export function printInvoice(elementId: string, title = 'Invoice', type: 'thermal' | 'a4' = 'thermal') {
  const originalTitle = document.title;
  document.title = title;

  let styleEl = document.getElementById('print-page-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'print-page-style';
    document.head.appendChild(styleEl);
  }

  if (type === 'thermal') {
    styleEl.innerHTML = `@media print { @page { size: 79mm 297mm; margin: 0; } }`;
  } else {
    styleEl.innerHTML = `@media print { @page { size: A4; margin: 10mm; } }`;
  }

  // Small delay to ensure title and styles are applied before the print dialog grabs it
  setTimeout(() => {
    window.print();
    document.title = originalTitle;
  }, 100);
}
