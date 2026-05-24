'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Plus, Minus, WashingMachine } from 'lucide-react'
import { toast } from 'sonner'

type LinenItem = {
  id: string
  name: string
  category: string
  available_quantity: number
  in_laundry: number
}

type LaundryItem = {
  itemId: string
  name: string
  category: string
  quantity: number
  maxQuantity: number
}

export function SendLaundryForm({ items }: { items: LinenItem[] }) {
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [laundryItems, setLaundryItems] = useState<LaundryItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  const addItem = (item: LinenItem) => {
    const existing = laundryItems.find((li) => li.itemId === item.id)
    if (existing) {
      if (existing.quantity < item.available_quantity) {
        setLaundryItems(
          laundryItems.map((li) =>
            li.itemId === item.id ? { ...li, quantity: li.quantity + 1 } : li
          )
        )
      }
    } else {
      setLaundryItems([
        ...laundryItems,
        {
          itemId: item.id,
          name: item.name,
          category: item.category,
          quantity: 1,
          maxQuantity: item.available_quantity,
        },
      ])
    }
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setLaundryItems(
      laundryItems
        .map((li) => {
          if (li.itemId === itemId) {
            const newQty = li.quantity + delta
            if (newQty <= 0) return null
            if (newQty > li.maxQuantity) return li
            return { ...li, quantity: newQty }
          }
          return li
        })
        .filter(Boolean) as LaundryItem[]
    )
  }

  const handleSubmit = async () => {
    if (!userId || laundryItems.length === 0) return
    setLoading(true)

    try {
      // Generate batch number
      const batchNumber = `L${Date.now().toString(36).toUpperCase()}`

      // Create laundry batch
      const { data: batch, error: batchError } = await supabase
        .from('laundry_batches')
        .insert({
          batch_number: batchNumber,
          status: 'sent',
          sent_by: userId,
          notes: notes || null,
        })
        .select()
        .single()

      if (batchError) throw batchError

      // Create batch items
      const batchItems = laundryItems.map((li) => ({
        batch_id: batch.id,
        linen_item_id: li.itemId,
        sent_quantity: li.quantity,
        received_quantity: 0,
        missing_quantity: 0,
      }))

      const { error: itemsError } = await supabase.from('laundry_batch_items').insert(batchItems)
      if (itemsError) throw itemsError

      // Update linen items (decrease available, increase in_laundry)
      for (const li of laundryItems) {
        const originalItem = items.find((i) => i.id === li.itemId)
        if (!originalItem) continue

        const { error: updateError } = await supabase
          .from('linen_items')
          .update({
            available_quantity: originalItem.available_quantity - li.quantity,
            in_laundry: originalItem.in_laundry + li.quantity,
          })
          .eq('id', li.itemId)

        if (updateError) throw updateError

        // Create transaction
        await supabase.from('transactions').insert({
          linen_item_id: li.itemId,
          type: 'send_laundry',
          quantity: li.quantity,
          notes: `ล็อต ${batchNumber}`,
          performed_by: userId,
        })
      }

      toast.success(`ส่งซักสำเร็จ - ล็อต ${batchNumber}`)
      setLaundryItems([])
      setNotes('')
      router.refresh()
    } catch (error) {
      console.error('Error sending laundry:', error)
      toast.error('เกิดข้อผิดพลาดในการส่งซัก')
    } finally {
      setLoading(false)
    }
  }

  const availableItems = items.filter((item) => item.available_quantity > 0)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>เลือกผ้าลินินที่จะส่งซัก</CardTitle>
          <CardDescription>คลิกเพื่อเพิ่มรายการลงในล็อตส่งซัก</CardDescription>
        </CardHeader>
        <CardContent>
          {availableItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">ไม่มีผ้าลินินที่พร้อมส่งซัก</p>
          ) : (
            <div className="grid gap-2">
              {availableItems.map((item) => {
                const addedItem = laundryItems.find((li) => li.itemId === item.id)
                const remaining = item.available_quantity - (addedItem?.quantity || 0)
                return (
                  <Button
                    key={item.id}
                    variant="outline"
                    className="h-auto justify-between p-3"
                    onClick={() => addItem(item)}
                    disabled={remaining <= 0}
                  >
                    <div className="text-left">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">คงเหลือ: {remaining}</p>
                      {addedItem && (
                        <p className="text-xs text-primary">เลือก: {addedItem.quantity}</p>
                      )}
                    </div>
                  </Button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการส่งซัก</CardTitle>
          <CardDescription>ตรวจสอบรายการก่อนส่งซัก</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {laundryItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              ยังไม่ได้เลือกรายการ
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รายการ</TableHead>
                    <TableHead className="text-center">จำนวน</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laundryItems.map((item) => (
                    <TableRow key={item.itemId}>
                      <TableCell>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {item.quantity}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.itemId, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.itemId, 1)}
                            disabled={item.quantity >= item.maxQuantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="space-y-2">
                <Label htmlFor="notes">หมายเหตุ (ไม่บังคับ)</Label>
                <Textarea
                  id="notes"
                  placeholder="เช่น ส่งร้าน ABC"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <p className="font-medium">
                  รวม: {laundryItems.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น
                </p>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <WashingMachine className="mr-2 h-4 w-4" />
                      ส่งซัก
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
