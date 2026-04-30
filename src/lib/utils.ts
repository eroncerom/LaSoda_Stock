import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export const SUPABASE_STORAGE_URL =
  'https://cvjsncprlmtddhspwnlt.supabase.co/storage/v1/object/public/web-assets/'

export function getImageUrl(storagePath: string | null, publicUrl: string | null): string {
  if (publicUrl) return publicUrl
  if (storagePath) return `${SUPABASE_STORAGE_URL}${storagePath}`
  return '/placeholder-product.png'
}

export const ORDER_STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  shipped: { label: 'Enviado', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  delivered: { label: 'Entregado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
} as const
