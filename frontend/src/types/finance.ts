export interface Account       { id: string; tenantId: string; code: string; name: string; type: string; balance: number; }
export interface JournalEntry  { id: string; tenantId: string; entryNumber: string; entryDate: string; description: string; status: string; totalDebit: number; totalCredit: number; }
export interface Invoice        { id: string; tenantId: string; invoiceNumber: string; type: 'PAYABLE'|'RECEIVABLE'; status: string; totalAmount: number; paidAmount: number; dueDate: string; }
export interface Payment        { id: string; invoiceId: string; paymentDate: string; amount: number; method: string; }
