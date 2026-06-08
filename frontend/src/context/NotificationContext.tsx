import React, { createContext, useContext, useState, ReactNode } from 'react';
interface NotifContextType { unreadCount: number; setUnreadCount: (n: number) => void; }
const NotifContext = createContext<NotifContextType | undefined>(undefined);
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  return <NotifContext.Provider value={{ unreadCount, setUnreadCount }}>{children}</NotifContext.Provider>;
};
export const useNotifContext = () => { const ctx = useContext(NotifContext); if (!ctx) throw new Error('outside NotificationProvider'); return ctx; };
