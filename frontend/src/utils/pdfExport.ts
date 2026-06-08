// PDF export — triggers backend PDF generation endpoint
import api from '../services/api';
export const downloadPDF = async (endpoint: string, filename: string) => {
  const res = await api.get(endpoint, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const a   = document.createElement('a');
  a.href = url; a.download = filename + '.pdf'; a.click();
  URL.revokeObjectURL(url);
};
