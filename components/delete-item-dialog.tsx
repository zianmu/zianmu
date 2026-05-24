'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type LinenItem = {
  id: string
  name: string
}

export function DeleteItemDialog({ item }: { item: LinenItem }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('linen_items')
        .delete()
        .eq('id', item.id)

      if (error) throw error

      toast.success('ลบผ้าลินินสำเร็จ')
      router.refresh()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('เกิดข้อผิดพลาดในการลบรายการ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการลบ &quot;{item.name}&quot; หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังลบ...
              </>
            ) : (
              'ลบ'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
