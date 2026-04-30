'use client'

import { createContext, useContext, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const SidebarContext = createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggle: () => void
}>({
  isOpen: false,
  setIsOpen: () => {},
  toggle: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export function Providers({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => setIsOpen(!isOpen)

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarContext.Provider value={{ isOpen, setIsOpen, toggle }}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </SidebarContext.Provider>
    </QueryClientProvider>
  )
}
