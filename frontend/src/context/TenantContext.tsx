import React, { createContext, useContext, useState, ReactNode } from 'react';
interface TenantContextType { tenantId: string | null; tenantName: string | null; setTenant: (id: string, name: string) => void; }
const TenantContext = createContext<TenantContextType | undefined>(undefined);
export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenantId,   setTenantId]   = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const setTenant = (id: string, name: string) => { setTenantId(id); setTenantName(name); };
  return <TenantContext.Provider value={{ tenantId, tenantName, setTenant }}>{children}</TenantContext.Provider>;
};
export const useTenantContext = () => { const ctx = useContext(TenantContext); if (!ctx) throw new Error('useTenantContext outside TenantProvider'); return ctx; };
