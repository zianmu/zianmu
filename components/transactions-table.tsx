'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowDownRight,
  ArrowUpRight,
  WashingMachine,
  Package,
  AlertTriangle,
  RefreshCw,
  Search,
  ClipboardList,
} from 'lucide-react'

type Transaction = {
  id: string
  type: string
  quantity: number
  notes: string | null
  created_at: string
  linen_item: { id: string; name: string; category: string } | null
  performed_by_profile: { id: string; name: string } | null
}

const typeConfig: Record<
  string,
  { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  withdraw: { label: 'เบิก', icon: <ArrowDownRight className="h-3 w-3" />, variant: 'default' },
  return: { label: 'คืน', icon: <ArrowUpRight className="h-3 w-3" />, variant: 'secondary' },
  receive_new: { label: 'รับใหม่', icon: <Package className="h-3 w-3" />, variant: 'outline' },
  send_laundry: { label: 'ส่งซัก', icon: <WashingMachine className="h-3 w-3" />, variant: 'default' },
  receive_laundry: { label: 'รับคืนจากซัก', icon: <RefreshCw className="h-3 w-3" />, variant: 'secondary' },
  missing: { label: 'หาย', icon: <AlertTriangle className="h-3 w-3" />, variant: 'destructive' },
}

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.linen_item?.name.toLowerCase().includes(search.toLowerCase()) ||
      tx.performed_by_profile?.name.toLowerCase().includes(search.toLowerCase()) ||
      tx.notes?.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || tx.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาตามชื่อผ้าลินิน, ผู้ดำเนินการ, หมายเหตุ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="ประเภท" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            {Object.entries(typeConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium">ไม่พบรายการธุรกรรม</p>
          <p className="text-sm text-muted-foreground">
            {search || typeFilter !== 'all'
              ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง'
              : 'ยังไม่มีธุรกรรมในระบบ'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่/เวลา</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>ผ้าลินิน</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead>ผู้ดำเนินการ</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => {
                const config = typeConfig[tx.type] || {
                  label: tx.type,
                  icon: null,
                  variant: 'default' as const,
                }
                const isNegative = ['withdraw', 'send_laundry', 'missing'].includes(tx.type)

                return (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(tx.created_at), 'dd MMM yyyy HH:mm', { locale: th })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant} className="gap-1">
                        {config.icon}
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tx.linen_item?.name || 'ไม่ระบุ'}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.linen_item?.category || ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={isNegative ? 'text-destructive' : 'text-green-600'}>
                        {isNegative ? '-' : '+'}
                        {tx.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{tx.performed_by_profile?.name || 'ไม่ระบุ'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {tx.notes || '-'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
