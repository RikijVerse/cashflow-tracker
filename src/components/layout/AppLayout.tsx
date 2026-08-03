import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { BottomNav } from './BottomNav'
import { TransactionModal } from '../transactions/TransactionModal'
import { Toaster } from '../ui/Toaster'
import { emitRefresh } from '../../lib/events'

const SIDEBAR_KEY = 'arus-kas:sidebar-collapsed'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  const toggleCollapse = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, c ? '0' : '1')
      } catch {
        /* noop */
      }
      return !c
    })
  }

  return (
    <div className="min-h-dvh bg-bg">
      <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />

      <div className={['transition-[margin] duration-200', collapsed ? 'lg:ml-[76px]' : 'lg:ml-64'].join(' ')}>
        <Topbar onAdd={() => setQuickAddOpen(true)} />

        <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav onAdd={() => setQuickAddOpen(true)} />

      <TransactionModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSaved={() => {
          setQuickAddOpen(false)
          emitRefresh()
        }}
      />

      <Toaster />
    </div>
  )
}
