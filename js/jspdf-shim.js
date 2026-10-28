/**
 * jsPDF Module Shim for Teacher's Path
 * Exposes window.jsPDF / window.jspdf.jsPDF as ES Module
 */
const resolvedJsPDF = (typeof window !== 'undefined' && (
  window.jsPDF || 
  (window.jspdf && window.jspdf.jsPDF) || 
  (window.html2pdf && window.html2pdf.jsPDF)
)) || null;

export const jsPDF = resolvedJsPDF;
export default resolvedJsPDF;
