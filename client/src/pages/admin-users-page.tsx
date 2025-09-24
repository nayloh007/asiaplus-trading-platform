import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, BankAccount } from "@shared/schema";
import { DesktopContainer } from "@/components/layout/desktop-container";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Search,
  Bell,
  Users,
  Plus,
  Edit,
  Trash2,
  ShieldAlert,
  Shield,
  RefreshCw,
  FilePenLine,
  CreditCard,
  Landmark
} from "lucide-react";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showBankAccountsDialog, setShowBankAccountsDialog] = useState(false);
  const [showEditBankAccountDialog, setShowEditBankAccountDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
  
  // Fetch users
  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  
  // Fetch bank accounts for selected user
  const { data: userBankAccounts, isLoading: loadingBankAccounts, refetch: refetchBankAccounts } = useQuery<BankAccount[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "bank-accounts"],
    queryFn: async () => {
      if (!selectedUser) return [];
      const response = await fetch(`/api/admin/users/${selectedUser.id}/bank-accounts`);
      if (!response.ok) throw new Error("Failed to fetch bank accounts");
      return await response.json();
    },
    enabled: !!selectedUser && showBankAccountsDialog,
  });

  // Filter users based on search query
  const filteredUsers = users?.filter(user => {
    if (!searchQuery) return true;
    
    return (
      user.id.toString().includes(searchQuery) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  // User table columns
  const userColumns = [
    {
      key: 'id',
      header: 'ID',
      width: '70px',
      cell: (user: User) => <span>{user.id}</span>,
    },
    {
      key: 'username',
      header: 'ชื่อผู้ใช้',
      cell: (user: User) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{user.username}</div>
            <div className="text-xs text-muted-foreground">@{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'อีเมล',
    },
    {
      key: 'balance',
      header: 'ยอดเงิน',
      cell: (user: User) => (
        <div className="font-medium">
          {formatCurrency(parseFloat(user.balance || "0"))}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'บทบาท',
      cell: (user: User) => (
        <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'agent' ? 'outline' : 'secondary'}>
          {user.role === 'admin' ? 'แอดมิน' : user.role === 'agent' ? 'เอเจ้นต์' : 'ผู้ใช้ทั่วไป'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'วันที่สมัคร',
      cell: (user: User) => formatShortDate(user.createdAt),
    },
    {
      key: 'actions',
      header: 'จัดการ',
      cell: (user: User) => (
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => {
              setSelectedUser(user);
              setShowEditUserDialog(true);
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            แก้ไข
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => {
              setSelectedUser(user);
              setShowBankAccountsDialog(true);
            }}
          >
            <CreditCard className="h-4 w-4 mr-1" />
            บัญชีธนาคาร
          </Button>
          
          {user.role !== 'admin' && (
            <Button 
              size="sm" 
              variant="ghost"
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              ระงับ
            </Button>
          )}
        </div>
      ),
    },
  ] as const;

  const handleChangeRole = (userId: number, newRole: 'user' | 'admin') => {
    // Implement this functionality if needed
    toast({
      title: "การเปลี่ยนแปลงบทบาท",
      description: `เปลี่ยนบทบาทของผู้ใช้ ID ${userId} เป็น ${newRole} เรียบร้อยแล้ว`,
    });
  };

  return (
    <DesktopContainer>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="border-b border-border h-16 bg-card">
            <div className="flex items-center justify-between h-full px-6">
              <h1 className="text-2xl font-bold">จัดการผู้ใช้งาน</h1>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="ค้นหาผู้ใช้..."
                    className="w-64 pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                </div>
                
                <Button size="icon" variant="ghost">
                  <Bell className="h-5 w-5" />
                </Button>
                
                <div className="h-8 w-px bg-border mx-1" />
                
                <ThemeToggle />
              </div>
            </div>
          </header>
          
          {/* Main Content Scrollable Area */}
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            {/* Page Header with Action Buttons */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">รายชื่อผู้ใช้ทั้งหมด</h2>
                <p className="text-muted-foreground">จัดการผู้ใช้งานทั้งหมดในระบบ</p>
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" className="h-9">
                  <FilePenLine className="h-4 w-4 mr-2" />
                  ส่งออกข้อมูล
                </Button>
                <Button className="h-9" onClick={() => setShowAddUserDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มผู้ใช้ใหม่
                </Button>
              </div>
            </div>
            
            {/* User Stats */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ผู้ใช้ทั้งหมด</p>
                      <h3 className="text-2xl font-bold mt-1">{users?.length || 0}</h3>
                      <p className="text-xs text-[hsl(var(--chart-1))] mt-1">
                        ทั้งหมดในระบบ
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">แอดมิน</p>
                      <h3 className="text-2xl font-bold mt-1">{users?.filter(u => u.role === 'admin' || u.role === 'agent').length || 0}</h3>
                      <p className="text-xs text-amber-500 mt-1">
                        <ShieldAlert className="h-3 w-3 inline mr-1" />
                        ผู้ดูแลระบบ
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-amber-500/10">
                      <ShieldAlert className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ผู้ใช้ทั่วไป</p>
                      <h3 className="text-2xl font-bold mt-1">{users?.filter(u => u.role === 'user').length || 0}</h3>
                      <p className="text-xs text-blue-500 mt-1">
                        <Shield className="h-3 w-3 inline mr-1" />
                        สมาชิกปกติ
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <Shield className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Users Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>รายชื่อผู้ใช้งาน</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={userColumns as any}
                  data={filteredUsers}
                  isLoading={loadingUsers}
                  emptyMessage="ไม่พบผู้ใช้งาน"
                />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      
      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้ใหม่ในระบบ
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <Input id="username" placeholder="username" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input id="email" placeholder="email@example.com" type="email" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
              <Input id="fullName" placeholder="ชื่อ นามสกุล" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input id="password" placeholder="รหัสผ่าน" type="password" />
            </div>
            
            {/* เฉพาะ admin เท่านั้นที่สามารถกำหนดบทบาทได้ */}
            {currentUser?.role === 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="role">บทบาท</Label>
                <select id="role" className="w-full h-10 px-3 rounded-md border border-input bg-background">
                  <option value="user">ผู้ใช้ทั่วไป</option>
                  <option value="agent">เอเจ้นต์</option>
                  <option value="admin">แอดมิน</option>
                </select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>ยกเลิก</Button>
            <Button type="submit">เพิ่มผู้ใช้</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>แก้ไขข้อมูลผู้ใช้</DialogTitle>
              <DialogDescription>
                แก้ไขข้อมูลของ {selectedUser.fullName} (@{selectedUser.username})
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-email">อีเมล</Label>
                <Input id="edit-email" defaultValue={selectedUser.email} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">ชื่อ-นามสกุล</Label>
                <Input id="edit-fullName" defaultValue={selectedUser.fullName} />
              </div>
              
              {/* เฉพาะ admin เท่านั้นที่สามารถแก้ไขบทบาทได้ */}
              {currentUser?.role === 'admin' ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-role">บทบาท</Label>
                  <select
                    id="edit-role"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    defaultValue={selectedUser.role}
                  >
                    <option value="user">ผู้ใช้ทั่วไป</option>
                    <option value="agent">เอเจ้นต์</option>
                    <option value="admin">แอดมิน</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>บทบาท</Label>
                  <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                    {selectedUser.role === 'admin' ? 'แอดมิน' : selectedUser.role === 'agent' ? 'เอเจ้นต์' : 'ผู้ใช้ทั่วไป'} (ไม่สามารถแก้ไขได้)
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="edit-balance">ยอดเงิน</Label>
                <Input
                  id="edit-balance"
                  defaultValue={selectedUser.balance}
                  type="number"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-password">รหัสผ่านใหม่ (เว้นว่างถ้าไม่ต้องการเปลี่ยน)</Label>
                <Input id="edit-password" type="password" placeholder="รหัสผ่านใหม่" />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>ยกเลิก</Button>
              <Button 
                onClick={() => {
                  // ดึงค่าจาก input
                  const email = (document.getElementById('edit-email') as HTMLInputElement)?.value;
                  const fullName = (document.getElementById('edit-fullName') as HTMLInputElement)?.value;
                  const role = (document.getElementById('edit-role') as HTMLSelectElement)?.value;
                  const balance = (document.getElementById('edit-balance') as HTMLInputElement)?.value;
                  const password = (document.getElementById('edit-password') as HTMLInputElement)?.value;

                  // สร้างข้อมูลสำหรับการอัพเดท
                  const updateData: any = {
                    email,
                    fullName,
                    role,
                    balance
                  };

                  // ถ้ากรอกรหัสผ่านใหม่ ให้รวมไปด้วย
                  if (password) {
                    updateData.password = password;
                  }

                  // ส่งคำขอไปยัง API
                  apiRequest('PATCH', `/api/admin/users/${selectedUser.id}`, updateData)
                    .then(res => res.json())
                    .then(updatedUser => {
                      // อัพเดทข้อมูลในแคช
                      queryClient.invalidateQueries({queryKey: ['/api/admin/users']});
                      // ปิด dialog
                      setShowEditUserDialog(false);
                      // แสดงข้อความสำเร็จ
                      toast({
                        title: "บันทึกเรียบร้อย",
                        description: `อัพเดทข้อมูลผู้ใช้ ${fullName} สำเร็จแล้ว`,
                      });
                    })
                    .catch(error => {
                      toast({
                        title: "เกิดข้อผิดพลาด",
                        description: error.message || "ไม่สามารถอัพเดทข้อมูลผู้ใช้ได้",
                        variant: "destructive"
                      });
                    });
                }}
              >
                บันทึกการเปลี่ยนแปลง
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Bank Accounts Dialog */}
      {selectedUser && (
        <Dialog open={showBankAccountsDialog} onOpenChange={setShowBankAccountsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>จัดการบัญชีธนาคาร</DialogTitle>
              <DialogDescription>
                บัญชีธนาคารของ {selectedUser.fullName} (@{selectedUser.username})
              </DialogDescription>
            </DialogHeader>
            
            {loadingBankAccounts ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : userBankAccounts && userBankAccounts.length > 0 ? (
              <div className="space-y-4 py-2">
                {userBankAccounts.map((account) => (
                  <div key={account.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Landmark className="h-5 w-5 text-primary" />
                          <h4 className="font-medium text-lg">{account.bankName}</h4>
                          {account.isDefault && (
                            <Badge className="ml-2">บัญชีหลัก</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-1">{account.accountNumber}</p>
                        <p className="mt-2 font-medium">{account.accountName}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedBankAccount(account);
                            setShowEditBankAccountDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          แก้ไข
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive border-destructive"
                          onClick={() => {
                            if (confirm(`ต้องการลบบัญชีธนาคาร ${account.bankName} - ${account.accountNumber} ใช่หรือไม่?`)) {
                              // ส่งคำขอไปยัง API เพื่อลบบัญชีธนาคาร
                              apiRequest('DELETE', `/api/bank-accounts/${account.id}`)
                                .then(res => {
                                  if (!res.ok) throw new Error("Failed to delete bank account");
                                  // รีเฟรชข้อมูล
                                  refetchBankAccounts();
                                  // แสดงข้อความสำเร็จ
                                  toast({
                                    title: "ลบบัญชีธนาคารสำเร็จ",
                                    description: `ลบบัญชีธนาคารของ ${selectedUser?.fullName} เรียบร้อยแล้ว`,
                                  });
                                })
                                .catch(error => {
                                  toast({
                                    title: "เกิดข้อผิดพลาด",
                                    description: error.message || "ไม่สามารถลบบัญชีธนาคารได้",
                                    variant: "destructive"
                                  });
                                });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          ลบ
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>ผู้ใช้งานยังไม่มีบัญชีธนาคาร</p>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBankAccountsDialog(false)}>ปิด</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Bank Account Dialog */}
      {selectedBankAccount && (
        <Dialog 
          open={showEditBankAccountDialog} 
          onOpenChange={(open) => {
            setShowEditBankAccountDialog(open);
            if (!open) {
              // เมื่อปิด dialog ให้เปิด dialog จัดการบัญชีธนาคารไว้อยู่
              setShowBankAccountsDialog(true);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>แก้ไขบัญชีธนาคาร</DialogTitle>
              <DialogDescription>
                แก้ไขข้อมูลบัญชีธนาคาร
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-bank-name">ชื่อธนาคาร</Label>
                <Input id="edit-bank-name" defaultValue={selectedBankAccount.bankName} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-account-number">เลขที่บัญชี</Label>
                <Input id="edit-account-number" defaultValue={selectedBankAccount.accountNumber} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-account-name">ชื่อบัญชี</Label>
                <Input id="edit-account-name" defaultValue={selectedBankAccount.accountName} />
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="edit-is-default"
                  defaultChecked={selectedBankAccount.isDefault}
                  className="h-4 w-4 border border-input rounded"
                />
                <Label htmlFor="edit-is-default" className="font-normal">ตั้งเป็นบัญชีหลัก</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditBankAccountDialog(false);
                  setShowBankAccountsDialog(true);
                }}
              >
                ยกเลิก
              </Button>
              <Button 
                onClick={() => {
                  // ดึงค่าจาก input
                  const bankName = (document.getElementById('edit-bank-name') as HTMLInputElement)?.value;
                  const accountNumber = (document.getElementById('edit-account-number') as HTMLInputElement)?.value;
                  const accountName = (document.getElementById('edit-account-name') as HTMLInputElement)?.value;
                  const isDefault = (document.getElementById('edit-is-default') as HTMLInputElement)?.checked;

                  // ตรวจสอบข้อมูล
                  if (!bankName || !accountNumber || !accountName) {
                    toast({
                      title: "ข้อมูลไม่ครบถ้วน",
                      description: "กรุณากรอกข้อมูลให้ครบถ้วน",
                      variant: "destructive"
                    });
                    return;
                  }

                  // สร้างข้อมูลสำหรับการอัพเดท
                  const updateData = {
                    bankName,
                    accountNumber,
                    accountName,
                    isDefault
                  };

                  // ส่งคำขอไปยัง API
                  apiRequest('PATCH', `/api/admin/bank-accounts/${selectedBankAccount.id}`, updateData)
                    .then(res => {
                      if (!res.ok) throw new Error("Failed to update bank account");
                      return res.json();
                    })
                    .then(updatedAccount => {
                      // รีเฟรชข้อมูล
                      refetchBankAccounts();
                      // ปิด dialog
                      setShowEditBankAccountDialog(false);
                      // แสดงข้อความสำเร็จ
                      toast({
                        title: "บันทึกเรียบร้อย",
                        description: `แก้ไขบัญชีธนาคารสำเร็จแล้ว`,
                      });
                    })
                    .catch(error => {
                      toast({
                        title: "เกิดข้อผิดพลาด",
                        description: error.message || "ไม่สามารถแก้ไขบัญชีธนาคารได้",
                        variant: "destructive"
                      });
                    });
                }}
              >
                บันทึกการเปลี่ยนแปลง
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DesktopContainer>
  );
}