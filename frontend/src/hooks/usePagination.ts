import { useState } from 'react';
export function usePagination(totalItems: number, itemsPerPage = 20) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  return { page, setPage, totalPages, offset: (page - 1) * itemsPerPage, limit: itemsPerPage };
}
