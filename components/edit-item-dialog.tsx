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
import { Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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

export function EditItemDialog({ item }: { item: LinenItem }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(item.name)
  const [category, setCategory] = useState(item.category)
  const [minimumStock, setMinimumStock] = useState(item.minimum_stock.toString())
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('linen_items')
        .update({
          name,
          category,
          minimum_stock: parseInt(minimumStock),
        })
        .eq('id', item.id)

      if (error) throw error

      toast.success('แก้ไขข้อมูลสำเร็จ')
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>แก้ไขข้อมูลผ้า</DialogTitle>
          <DialogDescription>แก้ไขข้อมูลผ้า {item.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">ชื่อผ้า</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-category">หมวดหมู่</Label>
            <Input
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-minimumStock">สต็อกขั้นต่ำ</Label>
            <Input
              id="edit-minimumStock"
              type="number"
              min="0"
              value={minimumStock}
              onChange={(e) => setMinimumStock(e.target.value)}
              required
            />
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
                'บันทึก'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
