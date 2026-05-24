import { createClient } from '@/lib/supabase/server'
import { InventoryTable } from '@/components/inventory-table'
import { AddItemDialog } from '@/components/add-item-dialog'
import { WithdrawDialog } from '@/components/withdraw-dialog'
import { ReceiveStockDialog } from '@/components/receive-stock-dialog'

async function getInventory() {
  const supabase = await createClient()

  const { data: linenItems, error } = await supabase
    .from('linen_items')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching inventory:', error)
    return []
  }

  return linenItems || []
}

async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export default async function InventoryPage() {
  const [inventory, profile] = await Promise.all([getInventory(), getProfile()])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">คลังผ้า</h1>
          <p className="text-muted-foreground">จัดการสต็อกผ้าทั้งหมด</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <WithdrawDialog items={inventory} />
          <ReceiveStockDialog items={inventory} />
          {profile?.role === 'admin' && <AddItemDialog />}
        </div>
      </div>

      <InventoryTable items={inventory} isAdmin={profile?.role === 'admin'} />
    </div>
  )
}
