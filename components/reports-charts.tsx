'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  Pie,
  PieChart,
} from 'recharts'

type ChartData = {
  date: string
  withdraw: number
  receive: number
  laundry: number
}

type CategoryData = {
  category: string
  total: number
  available: number
  inLaundry: number
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function ReportsCharts({
  chartData,
  categoryBreakdown,
}: {
  chartData: ChartData[]
  categoryBreakdown: CategoryData[]
}) {
  const pieData = categoryBreakdown.map((item) => ({
    name: item.category,
    value: item.total,
  }))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>กิจกรรมรายวัน</CardTitle>
          <CardDescription>จำนวนการเบิก, รับ และส่งซักผ้าลินินในแต่ละวัน</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              ไม่มีข้อมูลในช่วงเวลานี้
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="withdraw"
                  name="เบิก"
                  stroke="hsl(var(--chart-5))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="receive"
                  name="รับ"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="laundry"
                  name="ส่งซัก"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>สัดส่วนตามหมวดหมู่</CardTitle>
          <CardDescription>จำนวนผ้าลินินทั้งหมดแยกตามหมวดหมู่</CardDescription>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              ไม่มีข้อมูล
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>สถานะตามหมวดหมู่</CardTitle>
          <CardDescription>พร้อมใช้งาน vs กำลังซัก</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryBreakdown.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              ไม่มีข้อมูล
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryBreakdown} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="available"
                  name="พร้อมใช้งาน"
                  fill="hsl(var(--chart-2))"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="inLaundry"
                  name="กำลังซัก"
                  fill="hsl(var(--chart-1))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
