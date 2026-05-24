'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Users, MoreHorizontal, ShieldCheck, Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type User = {
  id: string
  name: string
  role: 'admin' | 'staff'
  created_at: string
}

export function UsersTable({ users }: { users: User[] }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'staff') => {
    setUpdating(userId)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      toast.success('เปลี่ยนสิทธิ์สำเร็จ')
      router.refresh()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์')
    } finally {
      setUpdating(null)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาตามชื่อ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="สิทธิ์" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
            <SelectItem value="staff">พนักงาน</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium">ไม่พบผู้ใช้</p>
          <p className="text-sm text-muted-foreground">
            {search || roleFilter !== 'all'
              ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง'
              : 'ยังไม่มีผู้ใช้ในระบบ'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>สิทธิ์</TableHead>
                <TableHead>วันที่สมัคร</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? (
                        <>
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          ผู้ดูแลระบบ
                        </>
                      ) : (
                        <>
                          <Shield className="mr-1 h-3 w-3" />
                          พนักงาน
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(user.created_at), 'dd MMM yyyy', { locale: th })}
                  </TableCell>
                  <TableCell>
                    {updating === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.role === 'staff' ? (
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              แต่งตั้งเป็นผู้ดูแล
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'staff')}>
                              <Shield className="mr-2 h-4 w-4" />
                              เปลี่ยนเป็นพนักงาน
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
