'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EditItemDialog } from '@/components/edit-item-dialog'
import { DeleteItemDialog } from '@/components/delete-item-dialog'
import { Search, Package } from 'lucide-react'

type LinenItem = {
  id: string
  name: string
  category: string
  total_quantity: number
  available_quantity: number
  in_laundry: number
  minimum_stock: number
  image_url: string | null
}

export function InventoryTable({ items, isAdmin }: { items: LinenItem[]; isAdmin: boolean }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const categories = [...new Set(items.map((item) => item.category))]

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getStockStatus = (item: LinenItem) => {
    if (item.available_quantity === 0) {
      return { label: 'หมด', variant: 'destructive' as const }
    }
    if (item.available_quantity < item.minimum_stock) {
      return { label: 'ต่ำ', variant: 'secondary' as const }
    }
    return { label: 'ปกติ', variant: 'outline' as const }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อผ้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="หมวดหมู่" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Package className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium">ไม่พบรายการ</p>
          <p className="text-sm text-muted-foreground">
            {search || categoryFilter !== 'all'
              ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง'
              : 'เพิ่มผ้าใหม่เพื่อเริ่มต้น'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="text-right">ทั้งหมด</TableHead>
                <TableHead className="text-right">พร้อมใช้</TableHead>
                <TableHead className="text-right">กำลังซัก</TableHead>
                <TableHead>สถานะ</TableHead>
                {isAdmin && <TableHead className="text-right">จัดการ</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const status = getStockStatus(item)
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{item.total_quantity}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {item.available_quantity}
                    </TableCell>
                    <TableCell className="text-right">{item.in_laundry}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <EditItemDialog item={item} />
                          <DeleteItemDialog item={item} />
                        </div>
                      </TableCell>
                    )}
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
