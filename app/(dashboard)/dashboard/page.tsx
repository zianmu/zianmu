import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ArrowDownRight, ArrowUpRight, WashingMachine, AlertTriangle } from 'lucide-react'
import { DashboardCharts } from '@/components/dashboard-charts'
import { RecentTransactions } from '@/components/recent-transactions'

async function getDashboardStats() {
  const supabase = await createClient()
  
  // Get linen items stats
  const { data: linenItems } = await supabase
    .from('linen_items')
    .select('*')
  
  const totalItems = linenItems?.reduce((sum, item) => sum + item.total_quantity, 0) || 0
  const availableItems = linenItems?.reduce((sum, item) => sum + item.available_quantity, 0) || 0
  const inLaundry = linenItems?.reduce((sum, item) => sum + item.in_laundry, 0) || 0
  const lowStockItems = linenItems?.filter(item => item.available_quantity < item.minimum_stock) || []
  
  // Get pending laundry batches
  const { data: pendingBatches } = await supabase
    .from('laundry_batches')
    .select('*')
    .eq('status', 'sent')
  
  // Get recent transactions
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select(`
      *,
      linen_item:linen_items(name),
      performed_by_profile:profiles(name)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  return {
    totalItems,
    availableItems,
    inLaundry,
    lowStockCount: lowStockItems.length,
    lowStockItems,
    pendingBatchesCount: pendingBatches?.length || 0,
    recentTransactions: recentTransactions || [],
    linenItems: linenItems || [],
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">แดชบอร์ด</h1>
        <p className="text-muted-foreground">ภาพรวมระบบจัดการผ้าลินิน</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ผ้าลินินทั้งหมด</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">ชิ้น</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">พร้อมใช้งาน</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.availableItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">ชิ้น</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อยู่ระหว่างซัก</CardTitle>
            <WashingMachine className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inLaundry.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">ชิ้น ({stats.pendingBatchesCount} ล็อต)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สต็อกต่ำ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">รายการต้องเติม</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>สรุปผ้าลินินตามประเภท</CardTitle>
            <CardDescription>จำนวนผ้าลินินแยกตามประเภทและสถานะ</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardCharts linenItems={stats.linenItems} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>ธุรกรรมล่าสุด</CardTitle>
            <CardDescription>10 รายการล่าสุด</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={stats.recentTransactions} />
          </CardContent>
        </Card>
      </div>

      {stats.lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              รายการที่ต้องเติมสต็อก
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {stats.lowStockItems.map((item) => (
                <div key={item.id} className="rounded-md bg-white p-3 shadow-sm">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    คงเหลือ: <span className="text-orange-600 font-semibold">{item.available_quantity}</span> / ขั้นต่ำ: {item.minimum_stock}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
