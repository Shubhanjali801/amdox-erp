export interface Vendor         { id: string; tenantId: string; vendorCode: string; name: string; status: string; email: string; country: string; rating: number; }
export interface PurchaseOrder  { id: string; tenantId: string; poNumber: string; vendorId: string; status: string; totalAmount: number; orderDate: string; }
export interface InventoryItem  { id: string; tenantId: string; sku: string; name: string; category: string; currentStock: number; reorderPoint: number; unitCost: number; }
export interface Forecast       { id: string; itemId: string; forecastDate: string; predictedQty: number; confidence: number; modelType: string; }
