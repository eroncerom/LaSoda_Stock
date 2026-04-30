import { getUsersServer } from '@/app/actions'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const users = await getUsersServer()

  return <UsersClient initialUsers={users} />
}
