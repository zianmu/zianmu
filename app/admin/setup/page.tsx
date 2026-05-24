'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ShieldCheck, AlertCircle, UserPlus, Users, Key, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type User = {
  id: string
  email: string
  name: string
  role: 'admin' | 'staff'
  created_at: string
}

export default function AdminSetupPage() {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [fetchingUsers, setFetchingUsers] = useState(false)
  const router = useRouter()

  // Add user dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'staff'>('staff')
  const [addingUser, setAddingUser] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Change password dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUserPassword, setNewUserPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState(false)

  useEffect(() => {
    // Check admin access from sessionStorage
    const adminAccess = sessionStorage.getItem('adminAccess')
    if (adminAccess !== 'true') {
      router.push('/auth/login')
      return
    }
    setHasAccess(true)
    setLoading(false)
    fetchUsers()
  }, [router])

  const fetchUsers = async () => {
    setFetchingUsers(true)
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setFetchingUsers(false)
    }
  }

  const handleAddUser = async () => {
    setAddError(null)
    setAddingUser(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          password: newPassword,
          role: newRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setAddError(data.error || 'เกิดข้อผิดพลาด')
        return
      }

      toast.success('เพิ่มผู้ใช้สำเร็จ')
      setAddDialogOpen(false)
      setNewEmail('')
      setNewName('')
      setNewPassword('')
      setNewRole('staff')
      fetchUsers()
    } catch {
      setAddError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setAddingUser(false)
    }
  }

  const handleChangePassword = async () => {
    if (!selectedUser) return
    setChangingPassword(true)

    try {
      const response = await fetch('/api/admin/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: newUserPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'เกิดข้อผิดพลาด')
        return
      }

      toast.success('เปลี่ยนรหัสผ่านสำเร็จ')
      setPasswordDialogOpen(false)
      setSelectedUser(null)
      setNewUserPassword('')
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    setDeletingUser(true)

    try {
      const response = await fetch(`/api/admin/users?userId=${userToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'เกิดข้อผิดพลาด')
        return
      }

      toast.success('ลบผู้ใช้สำเร็จ')
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      fetchUsers()
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setDeletingUser(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'staff') => {
    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'เกิดข้อผิดพลาด')
        return
      }

      toast.success('เปลี่ยนสิทธิ์สำเร็จ')
      fetchUsers()
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <ShieldCheck className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>จัดการผู้ใช้ระบบ</CardTitle>
                <CardDescription>เพิ่ม ลบ และจัดการรหัสผ่านผู้ใช้</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>ผู้ใช้ทั้งหมด {users.length} คน</span>
              </div>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    เพิ่มผู้ใช้
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
                    <DialogDescription>กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    {addError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{addError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="newName">ชื่อ</Label>
                      <Input
                        id="newName"
                        placeholder="ชื่อผู้ใช้"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newEmail">อีเมล</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        placeholder="email@example.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">รหัสผ่าน</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newRole">สิทธิ์</Label>
                      <Select value={newRole} onValueChange={(v) => setNewRole(v as 'admin' | 'staff')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">พนักงาน</SelectItem>
                          <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleAddUser}
                      className="w-full"
                      disabled={addingUser || !newEmail || !newName || !newPassword}
                    >
                      {addingUser ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          กำลังเพิ่ม...
                        </>
                      ) : (
                        'เพิ่มผู้ใช้'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {fetchingUsers ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <Users className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">ยังไม่มีผู้ใช้</p>
                <p className="text-sm text-muted-foreground">เพิ่มผู้ใช้คนแรกเพื่อเริ่มต้นใช้งาน</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ผู้ใช้</TableHead>
                      <TableHead>อีเมล</TableHead>
                      <TableHead>สิทธิ์</TableHead>
                      <TableHead className="text-right">การกระทำ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(v) => handleRoleChange(user.id, v as 'admin' | 'staff')}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="staff">
                                <Badge variant="secondary">พนักงาน</Badge>
                              </SelectItem>
                              <SelectItem value="admin">
                                <Badge>ผู้ดูแลระบบ</Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setPasswordDialogOpen(true)
                              }}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setUserToDelete(user)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push('/auth/login')}>
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
            <DialogDescription>
              กำหนดรหัสผ่านใหม่ให้ {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="newUserPassword">รหัสผ่านใหม่</Label>
              <Input
                id="newUserPassword"
                type="password"
                placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={handleChangePassword}
              className="w-full"
              disabled={changingPassword || newUserPassword.length < 6}
            >
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังเปลี่ยน...
                </>
              ) : (
                'เปลี่ยนรหัสผ่าน'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบผู้ใช้</DialogTitle>
            <DialogDescription>
              คุณต้องการลบ {userToDelete?.name} ออกจากระบบหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={deletingUser}>
              {deletingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                'ลบผู้ใช้'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
