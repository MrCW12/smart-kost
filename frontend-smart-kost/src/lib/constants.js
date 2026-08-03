export const ROOM_STATUS = {
  available: { label: 'Tersedia', color: 'bg-green-100 text-green-800' },
  occupied: { label: 'Terisi', color: 'bg-blue-100 text-blue-800' },
  checkout_process: { label: 'Proses Checkout', color: 'bg-yellow-100 text-yellow-800' },
  cleaning: { label: 'Dalam Pembersihan', color: 'bg-orange-100 text-orange-800' },
  ready_to_rent: { label: 'Siap Disewa', color: 'bg-cyan-100 text-cyan-800' },
  maintenance: { label: 'Maintenance', color: 'bg-red-100 text-red-800' },
}

export const INVOICE_STATUS = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  unpaid: { label: 'Belum Bayar', color: 'bg-yellow-100 text-yellow-800' },
  pending: { label: 'Menunggu Pembayaran', color: 'bg-blue-100 text-blue-800' },
  partial: { label: 'Bayar Sebagian', color: 'bg-orange-100 text-orange-800' },
  paid: { label: 'Lunas', color: 'bg-green-100 text-green-800' },
  overdue: { label: 'Jatuh Tempo', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800' },
}

export const PAYMENT_STATUS = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-800' },
}

export const TENANT_STATUS = {
  active: { label: 'Aktif', color: 'bg-green-100 text-green-800' },
  checked_out: { label: 'Sudah Checkout', color: 'bg-gray-100 text-gray-800' },
  blacklisted: { label: 'Blacklist', color: 'bg-red-100 text-red-800' },
}

export const TASK_STATUS = {
  waiting: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'Dikerjakan', color: 'bg-blue-100 text-blue-800' },
  done: { label: 'Selesai', color: 'bg-orange-100 text-orange-800' },
  verified: { label: 'Terverifikasi', color: 'bg-green-100 text-green-800' },
}

export const TASK_PRIORITY = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  urgent: 'Sangat Penting',
}

export const PAYMENT_METHODS = {
  cash: 'Tunai',
  bank_transfer: 'Transfer Bank',
  ewallet: 'E-Wallet',
  other: 'Lainnya',
}

export const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
