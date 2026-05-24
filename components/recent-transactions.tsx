import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { ArrowDownRight, ArrowUpRight, WashingMachine, Package, AlertTriangle, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Transaction = {
  id: string
  type: string
  quantity: number
  notes: string | null
  created_at: string
  linen_item: { name: string } | null
  performed_by_profile: { name: string } | null
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  withdraw: { label: 'เบิก', icon: <ArrowDownRight className="h-3 w-3" />, variant: 'default' },
  return: { label: 'คืน', icon: <ArrowUpRight className="h-3 w-3" />, variant: 'secondary' },
  receive_new: { label: 'รับใหม่', icon: <Package className="h-3 w-3" />, variant: 'outline' },
  send_laundry: { label: 'ส่งซัก', icon: <WashingMachine className="h-3 w-3" />, variant: 'default' },
  receive_laundry: { label: 'รับคืน', icon: <RefreshCw className="h-3 w-3" />, variant: 'secondary' },
  missing: { label: 'หาย', icon: <AlertTriangle className="h-3 w-3" />, variant: 'destructive' },
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        ยังไม่มีธุรกรรม
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx) => {
        const config = typeConfig[tx.type] || { label: tx.type, icon: null, variant: 'default' as const }
        
        return (
          <div key={tx.id} className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {tx.linen_item?.name || 'ไม่ระบุ'}
              </p>
              <p className="text-xs text-muted-foreground">
                {tx.performed_by_profile?.name || 'ไม่ระบุ'} - {format(new Date(tx.created_at), 'dd MMM HH:mm', { locale: th })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {tx.type === 'withdraw' || tx.type === 'send_laundry' || tx.type === 'missing' ? '-' : '+'}
                {tx.quantity}
              </span>
              <Badge variant={config.variant} className="gap-1">
                {config.icon}
                {config.label}
              </Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}
