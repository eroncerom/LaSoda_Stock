import { getOrdersServer, getDashboardStatsServer, getCurrentRole } from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const [role, orders, stats] = await Promise.all([
    getCurrentRole(),
    getOrdersServer(),
    getDashboardStatsServer()
  ])

  return (
    <div style={{ padding: 20, color: 'white', background: 'black', fontFamily: 'monospace' }}>
      <h1>Debug Actions</h1>
      <pre>Role: {JSON.stringify(role, null, 2)}</pre>
      <pre>Orders count: {orders.length}</pre>
      <pre>Stats: {JSON.stringify(stats, null, 2)}</pre>
      <h2>Orders Snippet:</h2>
      <pre>{JSON.stringify(orders.slice(0, 2), null, 2)}</pre>
    </div>
  )
}
