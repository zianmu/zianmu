'use client'

import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type LinenItem = {
  id: string
  name: string
  category: string
  total_quantity: number
  available_quantity: number
  in_laundry: number
}

export function DashboardCharts({ linenItems }: { linenItems: LinenItem[] }) {
  // Group by category
  const categoryData = linenItems.reduce((acc, item) => {
    const existing = acc.find((c) => c.category === item.category)
    if (existing) {
      existing.available += item.available_quantity
      existing.inLaundry += item.in_laundry
    } else {
      acc.push({
        category: item.category,
        available: item.available_quantity,
        inLaundry: item.in_laundry,
      })
    }
    return acc
  }, [] as { category: string; available: number; inLaundry: number }[])

  if (categoryData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        ยังไม่มีข้อมูลผ้าลินิน
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={categoryData}>
        <XAxis 
          dataKey="category" 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
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
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="inLaundry" 
          name="อยู่ระหว่างซัก" 
          fill="hsl(var(--chart-1))" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
