import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SendLaundryForm } from '@/components/send-laundry-form'
import { ReceiveLaundryForm } from '@/components/receive-laundry-form'
import { LaundryBatchesTable } from '@/components/laundry-batches-table'

async function getData() {
  const supabase = await createClient()
  
  const [linenItemsResult, batchesResult] = await Promise.all([
    supabase.from('linen_items').select('*').order('category').order('name'),
    supabase
      .from('laundry_batches')
      .select(`
        *,
        sent_by_profile:profiles!laundry_batches_sent_by_fkey(name),
        received_by_profile:profiles!laundry_batches_received_by_fkey(name),
        items:laundry_batch_items(
          *,
          linen_item:linen_items(name, category)
        )
      `)
      .order('created_at', { ascending: false }),
  ])

  return {
    linenItems: linenItemsResult.data || [],
    batches: batchesResult.data || [],
  }
}

export default async function LaundryPage() {
  const { linenItems, batches } = await getData()
  const pendingBatches = batches.filter((b) => b.status === 'sent')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ส่ง/รับซักผ้า</h1>
        <p className="text-muted-foreground">จัดการการส่งและรับผ้าลินินจากร้านซัก</p>
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send">ส่งซัก</TabsTrigger>
          <TabsTrigger value="receive">
            รับคืน
            {pendingBatches.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {pendingBatches.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">ประวัติ</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <SendLaundryForm items={linenItems} />
        </TabsContent>

        <TabsContent value="receive" className="space-y-4">
          <ReceiveLaundryForm batches={pendingBatches} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <LaundryBatchesTable batches={batches} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
