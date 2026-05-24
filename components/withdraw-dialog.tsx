'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowDownRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type LinenItem = {
  id: string
  name: string
  category: string
  available_quantity: number
}

export function WithdrawDialog({ items }: { items: LinenItem[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
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

  const selectedItemData = items.find((item) => item.id === selectedItem)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      toast.error('กรุณาเข้าสู่ระบบก่อน')
      return
    }
    setLoading(true)

    try {
      const qty = parseInt(quantity)
      
      if (!selectedItemData || qty > selectedItemData.available_quantity) {
        toast.error('จำนวนเกินสต็อกที่มี')
        setLoading(false)
        return
      }

      // Update linen item quantity
      const { error: updateError } = await supabase
        .from('linen_items')
        .update({
          available_quantity: selectedItemData.available_quantity - qty,
          total_quantity: selectedItemData.available_quantity - qty + (items.find(i => i.id === selectedItem) as any)?.in_laundry || 0,
        })
        .eq('id', selectedItem)

      if (updateError) throw updateError

      // Create transaction record
      const { error: txError } = await supabase.from('transactions').insert({
        linen_item_id: selectedItem,
        type: 'withdraw',
        quantity: qty,
        notes: notes || null,
        performed_by: userId,
      })

      if (txError) throw txError

      toast.success('เบิกผ้าลินินสำเร็จ')
      setOpen(false)
      setSelectedItem('')
      setQuantity('')
      setNotes('')
      router.refresh()
    } catch (error) {
      console.error('Error withdrawing item:', error)
      toast.error('เกิดข้อผิดพลาดในการเบิกผ้าลินิน')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowDownRight className="mr-2 h-4 w-4" />
          เบิกผ้าลินิน
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เบิกผ้าลินิน</DialogTitle>
          <DialogDescription>เลือกผ้าลินินและจำนวนที่ต้องการเบิก</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item">เลือกผ้าลินิน</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกผ้าลินิน" />
              </SelectTrigger>
              <SelectContent>
                {items.filter(item => item.available_quantity > 0).map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.category}) - คงเหลือ {item.available_quantity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">จำนวน</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={selectedItemData?.available_quantity || 0}
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            {selectedItemData && (
              <p className="text-xs text-muted-foreground">
                คงเหลือ: {selectedItemData.available_quantity} ชิ้น
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ (ไม่บังคับ)</Label>
            <Textarea
              id="notes"
              placeholder="เช่น เบิกให้วอร์ด 3A"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading || !selectedItem || !quantity}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                'ยืนยันการเบิก'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
