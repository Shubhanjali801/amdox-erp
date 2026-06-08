// Excel export utility — uses browser download
export const downloadCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows    = data.map(row => Object.values(row).join(',')).join('\n');
  const blob    = new Blob([headers + '\n' + rows], { type: 'text/csv' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href = url; a.download = filename + '.csv'; a.click();
  URL.revokeObjectURL(url);
};
