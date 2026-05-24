import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportsCharts } from '@/components/reports-charts'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { th } from 'date-fns/locale'

async function checkAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return redirect('/auth/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return redirect('/dashboard')
  }
  
  return true
}

async function getReportsData() {
  const supabase = await createClient()
  
  // Get all transactions for the last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30)
  
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })
  
  // Get all linen items
  const { data: linenItems } = await supabase
    .from('linen_items')
    .select('*')
  
  // Get all laundry batches
  const { data: laundryBatches } = await supabase
    .from('laundry_batches')
    .select(`
      *,
      items:laundry_batch_items(*)
    `)
    .gte('created_at', thirtyDaysAgo.toISOString())
  
  // Calculate stats
  const totalItems = linenItems?.reduce((sum, item) => sum + item.total_quantity, 0) || 0
  const availableItems = linenItems?.reduce((sum, item) => sum + item.available_quantity, 0) || 0
  const inLaundry = linenItems?.reduce((sum, item) => sum + item.in_laundry, 0) || 0
  
  const totalWithdrawals = transactions
    ?.filter((tx) => tx.type === 'withdraw')
    .reduce((sum, tx) => sum + tx.quantity, 0) || 0
  
  const totalReceived = transactions
    ?.filter((tx) => tx.type === 'receive_new')
    .reduce((sum, tx) => sum + tx.quantity, 0) || 0
  
  const totalMissing = transactions
    ?.filter((tx) => tx.type === 'missing')
    .reduce((sum, tx) => sum + tx.quantity, 0) || 0
  
  const totalLaundrySent = transactions
    ?.filter((tx) => tx.type === 'send_laundry')
    .reduce((sum, tx) => sum + tx.quantity, 0) || 0
  
  // Group transactions by date for chart
  const transactionsByDate = transactions?.reduce((acc, tx) => {
    const date = format(new Date(tx.created_at), 'dd/MM')
    if (!acc[date]) {
      acc[date] = { date, withdraw: 0, receive: 0, laundry: 0 }
    }
    if (tx.type === 'withdraw') acc[date].withdraw += tx.quantity
    if (tx.type === 'receive_new' || tx.type === 'receive_laundry') acc[date].receive += tx.quantity
    if (tx.type === 'send_laundry') acc[date].laundry += tx.quantity
    return acc
  }, {} as Record<string, { date: string; withdraw: number; receive: number; laundry: number }>) || {}
  
  const chartData = Object.values(transactionsByDate)
  
  // Category breakdown
  const categoryBreakdown = linenItems?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { category: item.category, total: 0, available: 0, inLaundry: 0 }
    }
    acc[item.category].total += item.total_quantity
    acc[item.category].available += item.available_quantity
    acc[item.category].inLaundry += item.in_laundry
    return acc
  }, {} as Record<string, { category: string; total: number; available: number; inLaundry: number }>) || {}
  
  return {
    stats: {
      totalItems,
      availableItems,
      inLaundry,
      totalWithdrawals,
      totalReceived,
      totalMissing,
      totalLaundrySent,
    },
    chartData,
    categoryBreakdown: Object.values(categoryBreakdown),
  }
}

export default async function AdminReportsPage() {
  await checkAdminAccess()
  const reportsData = await getReportsData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">รายงาน</h1>
        <p className="text-muted-foreground">
          สรุปข้อมูลและสถิติ (30 วันล่าสุด)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>ผ้าลินินทั้งหมด</CardDescription>
            <CardTitle className="text-3xl">{reportsData.stats.totalItems.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              พร้อมใช้ {reportsData.stats.availableItems.toLocaleString()} | กำลังซัก {reportsData.stats.inLaundry.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>เบิกใช้งาน</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {reportsData.stats.totalWithdrawals.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">ชิ้น (30 วันล่าสุด)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>รับสต็อกใหม่</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {reportsData.stats.totalReceived.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">ชิ้น (30 วันล่าสุด)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>สูญหาย</CardDescription>
            <CardTitle className="text-3xl text-destructive">
              {reportsData.stats.totalMissing.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">ชิ้น (30 วันล่าสุด)</p>
          </CardContent>
        </Card>
      </div>

      <ReportsCharts 
        chartData={reportsData.chartData} 
        categoryBreakdown={reportsData.categoryBreakdown}
      />
    </div>
  )
}
