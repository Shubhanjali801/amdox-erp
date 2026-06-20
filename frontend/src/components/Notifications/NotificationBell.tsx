import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../../services/notificationService'

const typeIcon: Record<string, string> = { INFO: 'ℹ️', SUCCESS: '✅', WARNING: '⚠️', ERROR: '⛔' }

const NotificationBell: React.FC = () => {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  // Poll unread count every 30s
  const countQ = useQuery({
    queryKey: ['notif-unread'],
    queryFn: notificationService.unreadCount,
    refetchInterval: 30000,
  })
  const unread = countQ.data?.unread ?? 0

  // Load the list only when the dropdown is open
  const listQ = useQuery({
    queryKey: ['notif-list'],
    queryFn: () => notificationService.list({ limit: 10 }),
    enabled: open,
  })
  const items = listQ.data?.data ?? []

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['notif-unread'] })
    qc.invalidateQueries({ queryKey: ['notif-list'] })
  }

  const markRead = async (id: string) => { await notificationService.markRead(id); refresh() }
  const markAll  = async () => { await notificationService.markAllRead(); refresh() }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 text-gray-400 hover:text-white">
        🔔
        {unread > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <span className="text-white font-semibold text-sm">Notifications</span>
              {unread > 0 && <button onClick={markAll} className="text-xs text-blue-400 hover:underline">Mark all read</button>}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {listQ.isLoading ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">Loading…</div>
              ) : items.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">No notifications</div>
              ) : (
                items.map((n: any) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-gray-800 flex gap-3 ${n.isRead ? 'opacity-60' : 'bg-gray-700/30'}`}>
                    <span>{typeIcon[n.type] || 'ℹ️'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{n.title}</p>
                      <p className="text-xs text-gray-400 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    {!n.isRead && (
                      <button onClick={() => markRead(n.id)} className="text-[10px] text-blue-400 hover:underline self-start">read</button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
