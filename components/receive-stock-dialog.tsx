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
import { Package, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type LinenItem = {
  id: string
  name: string
  category: string
  total_quantity: number
  available_quantity: number
}

export function ReceiveStockDialog({ items }: { items: LinenItem[] }) {
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

      // Update linen item quantity
      const { error: updateError } = await supabase
        .from('linen_items')
        .update({
          total_quantity: (selectedItemData?.total_quantity || 0) + qty,
          available_quantity: (selectedItemData?.available_quantity || 0) + qty,
        })
        .eq('id', selectedItem)

      if (updateError) throw updateError

      // Create transaction record
      const { error: txError } = await supabase.from('transactions').insert({
        linen_item_id: selectedItem,
        type: 'receive_new',
        quantity: qty,
        notes: notes || null,
        performed_by: userId,
      })

      if (txError) throw txError

      toast.success('รับสต็อกใหม่สำเร็จ')
      setOpen(false)
      setSelectedItem('')
      setQuantity('')
      setNotes('')
      router.refresh()
    } catch (error) {
      console.error('Error receiving stock:', error)
      toast.error('เกิดข้อผิดพลาดในการรับสต็อก')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Package className="mr-2 h-4 w-4" />
          รับสต็อกใหม่
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>รับสต็อกใหม่</DialogTitle>
          <DialogDescription>เพิ่มจำนวนผ้าลินินจากการรับของใหม่</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item">เลือกผ้าลินิน</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกผ้าลินิน" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">จำนวนที่รับ</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            {selectedItemData && (
              <p className="text-xs text-muted-foreground">
                สต็อกปัจจุบัน: {selectedItemData.total_quantity} ชิ้น
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ (ไม่บังคับ)</Label>
            <Textarea
              id="notes"
              placeholder="เช่น รับจากซัพพลายเออร์ ABC"
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
                'ยืนยันการรับสต็อก'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
