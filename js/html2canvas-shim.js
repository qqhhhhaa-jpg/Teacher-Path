/**
 * html2canvas Module Shim for Teacher's Path
 * Exposes window.html2canvas as ES Module
 */
const resolvedHtml2canvas = (typeof window !== 'undefined' && (
  window.html2canvas || 
  (window.html2pdf && window.html2pdf.html2canvas)
)) || null;

export const html2canvas = resolvedHtml2canvas;
export default resolvedHtml2canvas;
