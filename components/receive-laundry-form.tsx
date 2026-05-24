'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, Package } from 'lucide-react'
import { toast } from 'sonner'

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
  sent_by_profile: { name: string } | null
  items: BatchItem[]
}

export function ReceiveLaundryForm({ batches }: { batches: Batch[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, Record<string, number>>>({})
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

  useEffect(() => {
    // Initialize received quantities with sent quantities
    const initial: Record<string, Record<string, number>> = {}
    batches.forEach((batch) => {
      initial[batch.id] = {}
      batch.items.forEach((item) => {
        initial[batch.id][item.id] = item.sent_quantity
      })
    })
    setReceivedQuantities(initial)
  }, [batches])

  const updateReceivedQuantity = (batchId: string, itemId: string, value: number) => {
    setReceivedQuantities((prev) => ({
      ...prev,
      [batchId]: {
        ...prev[batchId],
        [itemId]: value,
      },
    }))
  }

  const handleReceive = async (batch: Batch) => {
    if (!userId) return
    setLoading(batch.id)

    try {
      const quantities = receivedQuantities[batch.id] || {}
      let hasPartial = false
      let hasMissing = false

      // Update batch items and linen quantities
      for (const item of batch.items) {
        const receivedQty = quantities[item.id] ?? item.sent_quantity
        const missingQty = item.sent_quantity - receivedQty

        if (receivedQty < item.sent_quantity) {
          hasPartial = true
          if (missingQty > 0) hasMissing = true
        }

        // Update batch item
        const { error: updateItemError } = await supabase
          .from('laundry_batch_items')
          .update({
            received_quantity: receivedQty,
            missing_quantity: missingQty,
          })
          .eq('id', item.id)

        if (updateItemError) throw updateItemError

        // Get current linen item data
        const { data: linenItem } = await supabase
          .from('linen_items')
          .select('available_quantity, in_laundry, total_quantity')
          .eq('id', (item as any).linen_item_id || item.id)
          .single()

        if (linenItem) {
          // Update linen item: add received to available, subtract from in_laundry
          const { error: updateLinenError } = await supabase
            .from('linen_items')
            .update({
              available_quantity: linenItem.available_quantity + receivedQty,
              in_laundry: Math.max(0, linenItem.in_laundry - item.sent_quantity),
              total_quantity: missingQty > 0 ? linenItem.total_quantity - missingQty : linenItem.total_quantity,
            })
            .eq('id', (item as any).linen_item_id)

          if (updateLinenError) throw updateLinenError

          // Create receive transaction
          if (receivedQty > 0) {
            await supabase.from('transactions').insert({
              linen_item_id: (item as any).linen_item_id,
              type: 'receive_laundry',
              quantity: receivedQty,
              notes: `ล็อต ${batch.batch_number}`,
              performed_by: userId,
            })
          }

          // Create missing transaction if any
          if (missingQty > 0) {
            await supabase.from('transactions').insert({
              linen_item_id: (item as any).linen_item_id,
              type: 'missing',
              quantity: missingQty,
              notes: `หายจากล็อต ${batch.batch_number}`,
              performed_by: userId,
            })
          }
        }
      }

      // Update batch status
      const newStatus = hasPartial ? 'partial' : 'received'
      const { error: updateBatchError } = await supabase
        .from('laundry_batches')
        .update({
          status: newStatus,
          received_at: new Date().toISOString(),
          received_by: userId,
        })
        .eq('id', batch.id)

      if (updateBatchError) throw updateBatchError

      toast.success(
        hasMissing
          ? `รับคืนล็อต ${batch.batch_number} - มีรายการหาย`
          : `รับคืนล็อต ${batch.batch_number} สำเร็จ`
      )
      router.refresh()
    } catch (error) {
      console.error('Error receiving laundry:', error)
      toast.error('เกิดข้อผิดพลาดในการรับคืน')
    } finally {
      setLoading(null)
    }
  }

  if (batches.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium">ไม่มีล็อตที่รอรับคืน</p>
          <p className="text-sm text-muted-foreground">ล็อตที่ส่งซักไปแล้วจะแสดงที่นี่</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ล็อตที่รอรับคืน</CardTitle>
        <CardDescription>
          ตรวจสอบจำนวนที่ได้รับคืนและบันทึกหากมีรายการหาย
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {batches.map((batch) => (
            <AccordionItem key={batch.id} value={batch.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{batch.batch_number}</Badge>
                  <div className="text-left">
                    <p className="font-medium">
                      {batch.items.reduce((sum, item) => sum + item.sent_quantity, 0)} ชิ้น
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ส่งเมื่อ {format(new Date(batch.sent_at), 'dd MMM HH:mm', { locale: th })} โดย{' '}
                      {batch.sent_by_profile?.name}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>รายการ</TableHead>
                        <TableHead className="text-center">ส่งไป</TableHead>
                        <TableHead className="text-center">รับคืน</TableHead>
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
                          <TableCell className="text-center">{item.sent_quantity}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={item.sent_quantity}
                              className="w-20 text-center mx-auto"
                              value={receivedQuantities[batch.id]?.[item.id] ?? item.sent_quantity}
                              onChange={(e) =>
                                updateReceivedQuantity(
                                  batch.id,
                                  item.id,
                                  Math.min(item.sent_quantity, Math.max(0, parseInt(e.target.value) || 0))
                                )
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-end">
                    <Button onClick={() => handleReceive(batch)} disabled={loading === batch.id}>
                      {loading === batch.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          ยืนยันรับคืน
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
