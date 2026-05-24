import { createClient } from '@/lib/supabase/server'
import { TransactionsTable } from '@/components/transactions-table'

async function getTransactions() {
  const supabase = await createClient()

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      linen_item:linen_items(id, name, category),
      performed_by_profile:profiles(id, name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }

  return transactions || []
}

export default async function TransactionsPage() {
  const transactions = await getTransactions()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ประวัติธุรกรรม</h1>
        <p className="text-muted-foreground">รายการธุรกรรมทั้งหมดของผ้า</p>
      </div>

      <TransactionsTable transactions={transactions} />
    </div>
  )
}
