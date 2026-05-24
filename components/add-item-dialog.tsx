'use client'

import { useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

export function AddItemDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [totalQuantity, setTotalQuantity] = useState('')
  const [minimumStock, setMinimumStock] = useState('10')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('linen_items').insert({
        name,
        category,
        total_quantity: parseInt(totalQuantity),
        available_quantity: parseInt(totalQuantity),
        in_laundry: 0,
        minimum_stock: parseInt(minimumStock),
      })

      if (error) throw error

      toast.success('เพิ่มผ้าลินินสำเร็จ')
      setOpen(false)
      setName('')
      setCategory('')
      setTotalQuantity('')
      setMinimumStock('10')
      router.refresh()
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('เกิดข้อผิดพลาดในการเพิ่มรายการ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มผ้าลินินใหม่
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มผ้าลินินใหม่</DialogTitle>
          <DialogDescription>กรอกข้อมูลผ้าลินินที่ต้องการเพิ่มในระบบ</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อผ้าลินิน</Label>
            <Input
              id="name"
              placeholder="เช่น ผ้าปูที่นอน ขาว"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">หมวดหมู่</Label>
            <Input
              id="category"
              placeholder="เช่น ผ้าปูที่นอน, ผ้าห่ม, ผ้าขนหนู"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalQuantity">จำนวนเริ่มต้น</Label>
              <Input
                id="totalQuantity"
                type="number"
                min="0"
                placeholder="0"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumStock">สต็อกขั้นต่ำ</Label>
              <Input
                id="minimumStock"
                type="number"
                min="0"
                placeholder="10"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                'เพิ่มรายการ'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
