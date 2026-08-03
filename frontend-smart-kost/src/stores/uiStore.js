import { create } from 'zustand'

const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectedOwnerId: localStorage.getItem('selectedOwnerId') || null,
  setSelectedOwnerId: (id) => {
    localStorage.setItem('selectedOwnerId', id || '')
    set({ selectedOwnerId: id })
  },
}))

export default useUIStore
