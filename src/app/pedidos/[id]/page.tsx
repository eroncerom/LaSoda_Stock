import { fetchOrderById } from '@/lib/api'
import OrderDetailClient from './OrderDetailClient'
import { notFound } from 'next/navigation'
import { use } from 'react'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await fetchOrderById(id)

  if (!order) {
    notFound()
  }

  return <OrderDetailClient order={order} />
}
