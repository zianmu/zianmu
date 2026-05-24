import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersTable } from '@/components/users-table'

async function checkAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return redirect('/auth/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return redirect('/dashboard')
  }
  
  return true
}

async function getUsers() {
  const supabase = await createClient()
  
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching users:', error)
    return []
  }
  
  return users || []
}

export default async function AdminUsersPage() {
  await checkAdminAccess()
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">จัดการผู้ใช้</h1>
        <p className="text-muted-foreground">จัดการบัญชีผู้ใช้ในระบบ</p>
      </div>

      <UsersTable users={users} />
    </div>
  )
}
