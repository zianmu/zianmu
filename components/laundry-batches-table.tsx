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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Search, WashingMachine, Eye } from 'lucide-react'

type BatchItem = {
  id: string
  sent_quantity: number
  received_quantity: number
  missing_quantity: number
  linen_item: { name: string; category: string } | null
}

type Batch = {
  id: string
  batch_number: string
  status: string
  sent_at: string
  received_at: string | null
  notes: string | null
  sent_by_profile: { name: string } | null
  received_by_profile: { name: string } | null
  items: BatchItem[]
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  sent: { label: 'รอรับคืน', variant: 'default' },
  received: { label: 'รับคืนแล้ว', variant: 'secondary' },
  partial: { label: 'รับคืนไม่ครบ', variant: 'destructive' },
}

export function LaundryBatchesTable({ batches }: { batches: Batch[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.batch_number.toLowerCase().includes(search.toLowerCase()) ||
      batch.sent_by_profile?.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาตามหมายเลขล็อต, ผู้ส่ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            {Object.entries(statusConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <WashingMachine className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium">ไม่พบล็อตส่งซัก</p>
          <p className="text-sm text-muted-foreground">
            {search || statusFilter !== 'all'
              ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง'
              : 'ยังไม่มีประวัติการส่งซัก'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ล็อต</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead>ส่งเมื่อ</TableHead>
                <TableHead>รับเมื่อ</TableHead>
                <TableHead>ผู้ส่ง</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => {
                const status = statusConfig[batch.status] || {
                  label: batch.status,
                  variant: 'default' as const,
                }
                const totalSent = batch.items.reduce((sum, item) => sum + item.sent_quantity, 0)
                const totalReceived = batch.items.reduce((sum, item) => sum + item.received_quantity, 0)
                const totalMissing = batch.items.reduce((sum, item) => sum + item.missing_quantity, 0)

                return (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono font-medium">{batch.batch_number}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {batch.status === 'sent' ? (
                        <span>{totalSent} ชิ้น</span>
                      ) : (
                        <div>
                          <span className="text-green-600">{totalReceived}</span>
                          {totalMissing > 0 && (
                            <span className="text-destructive"> / -{totalMissing}</span>
                          )}
                          <span className="text-muted-foreground"> / {totalSent}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(batch.sent_at), 'dd MMM HH:mm', { locale: th })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {batch.received_at
                        ? format(new Date(batch.received_at), 'dd MMM HH:mm', { locale: th })
                        : '-'}
                    </TableCell>
                    <TableCell>{batch.sent_by_profile?.name || '-'}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>รายละเอียดล็อต {batch.batch_number}</DialogTitle>
                            <DialogDescription>
                              {batch.notes || 'ไม่มีหมายเหตุ'}
                            </DialogDescription>
                          </DialogHeader>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>รายการ</TableHead>
                                <TableHead className="text-right">ส่งไป</TableHead>
                                <TableHead className="text-right">รับคืน</TableHead>
                                <TableHead className="text-right">หาย</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {batch.items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <p className="font-medium">{item.linen_item?.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.linen_item?.category}
                                    </p>
                                  </TableCell>
                                  <TableCell className="text-right">{item.sent_quantity}</TableCell>
                                  <TableCell className="text-right">
                                    {batch.status === 'sent' ? '-' : item.received_quantity}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {batch.status === 'sent' ? (
                                      '-'
                                    ) : item.missing_quantity > 0 ? (
                                      <span className="text-destructive">{item.missing_quantity}</span>
                                    ) : (
                                      '0'
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </DialogContent>
                      </Dialog>
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
