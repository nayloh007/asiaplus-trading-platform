import { useState, ChangeEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Transaction, User } from "@shared/schema";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Bell,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Filter,
  Loader2,
  Banknote
} from "lucide-react";

export default function AdminTransactionsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [loadingApproval, setLoadingApproval] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  
  // Fetch transactions and users
  const { data: transactions, isLoading: loadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    refetchInterval: 15000, // รีเฟรชทุก 15 วินาที
  });
  
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Filter transactions based on search query and tab and sort by date (newest first)
  const filteredTransactions = (transactions?.filter(transaction => {
    // Filter by type based on selected tab
    if (selectedTab === "deposits" && transaction.type !== "deposit") return false;
    if (selectedTab === "withdrawals" && transaction.type !== "withdraw") return false; 
    if (selectedTab === "pending" && transaction.status !== "pending") return false;
    
    // Filter by search query
    if (!searchQuery) return true;
    
    // Find the related user
    const user = users?.find(u => u.id === transaction.userId);
    
    // Check if search query matches any relevant fields
    return (
      transaction.id.toString().includes(searchQuery) ||
      user?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.amount.includes(searchQuery) ||
      transaction.type.includes(searchQuery) ||
      transaction.status.includes(searchQuery)
    );
  }) || [])
    // เรียงลำดับตามวันที่ล่าสุด
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate statistics
  const stats = {
    totalDeposits: transactions?.filter(t => t.type === 'deposit').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0,
    totalWithdrawals: transactions?.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0,
    pendingCount: transactions?.filter(t => t.status === 'pending').length || 0,
    pendingAmount: transactions?.filter(t => t.status === 'pending').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0,
  };

  // Transaction columns
  const transactionColumns = [
    {
      key: 'id',
      header: 'ID',
      width: '70px',
      cell: (transaction: Transaction) => <span>#{transaction.id}</span>,
    },
    {
      key: 'user',
      header: 'ผู้ใช้',
      cell: (transaction: Transaction) => {
        const user = users?.find(u => u.id === transaction.userId);
        return (
          <div className="flex flex-col">
            <span className="font-medium">{user?.fullName || `ผู้ใช้ ${transaction.userId}`}</span>
            <span className="text-xs text-muted-foreground">@{user?.username}</span>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'ประเภท',
      cell: (transaction: Transaction) => (
        <div className="flex items-center">
          {transaction.type === 'deposit' ? (
            <>
              <ArrowUpCircle className="h-4 w-4 mr-2 text-green-500" />
              <span>ฝากเงิน</span>
            </>
          ) : (
            <>
              <ArrowDownCircle className="h-4 w-4 mr-2 text-blue-500" />
              <span>ถอนเงิน</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'จำนวนเงิน',
      cell: (transaction: Transaction) => (
        <div className="font-medium">
          {formatCurrency(parseFloat(transaction.amount))}
        </div>
      ),
    },
    {
      key: 'method',
      header: 'วิธีการ',
      cell: (transaction: Transaction) => (
        <div className="flex items-center">
          <Banknote className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{transaction.method === 'bank' ? 'ธนาคาร' : 'พร้อมเพย์'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      cell: (transaction: Transaction) => {
        let icon;
        let variant;
        let label;
        
        switch(transaction.status) {
          case 'pending':
            icon = <Clock className="h-4 w-4 mr-1" />;
            variant = 'secondary';
            label = 'รออนุมัติ';
            break;
          case 'approved':
            icon = <CheckCircle className="h-4 w-4 mr-1" />;
            variant = 'default';
            label = 'อนุมัติแล้ว';
            break;
          case 'rejected':
            icon = <XCircle className="h-4 w-4 mr-1" />;
            variant = 'destructive';
            label = 'ปฏิเสธแล้ว';
            break;
          case 'frozen':
            icon = <AlertCircle className="h-4 w-4 mr-1" />;
            variant = 'warning';
            label = 'ถูกอายัด';
            break;
          default:
            icon = <AlertCircle className="h-4 w-4 mr-1" />;
            variant = 'outline';
            label = transaction.status;
        }
        
        return (
          <Badge variant={variant as any} className="flex items-center">
            {icon}{label}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'วันที่',
      cell: (transaction: Transaction) => formatShortDate(transaction.createdAt),
    },
    {
      key: 'actions',
      header: 'จัดการ',
      cell: (transaction: Transaction) => {
        // แสดงปุ่มเฉพาะรายการที่รอการอนุมัติเท่านั้น
        if (transaction.status !== 'pending') {
          return (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => {
                setSelectedTransaction(transaction);
                setAdminNote("");
                setShowTransactionDialog(true);
              }}
            >
              <Search className="h-4 w-4 mr-1" />
              ดูรายละเอียด
            </Button>
          );
        }
        
        return (
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => {
                setSelectedTransaction(transaction);
                setAdminNote("");
                setShowTransactionDialog(true);
              }}
            >
              <Search className="h-4 w-4 mr-1" />
              รายละเอียด
            </Button>
            
            <Button 
              size="sm" 
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                setSelectedTransaction(transaction);
                setAdminNote("");
                setShowApproveDialog(true);
              }}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              อนุมัติ
            </Button>
            
            <Button 
              size="sm" 
              variant="default"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={() => {
                setSelectedTransaction(transaction);
                setAdminNote("");
                setShowFreezeDialog(true);
              }}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              อายัด
            </Button>
          </div>
        );
      },
    },
  ] as const;

  // Mutation สำหรับการอนุมัติหรือปฏิเสธธุรกรรม
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: number, status: string, note?: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/transactions/${id}`, { status, note });
      return response.json();
    },
    onSuccess: () => {
      // รีเฟรชข้อมูลธุรกรรมหลังจากอัพเดทสำเร็จ
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
      // รีเฟรชข้อมูลผู้ใช้เพื่ออัพเดทยอดเงิน
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      
      setShowTransactionDialog(false);
      setLoadingApproval(false);
      
      toast({
        title: "อัพเดทสถานะสำเร็จ",
        description: "ระบบได้อัพเดทสถานะธุรกรรมเรียบร้อยแล้ว",
      });
    },
    onError: (error: Error) => {
      setLoadingApproval(false);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // ฟังก์ชันสำหรับการอนุมัติ, ปฏิเสธ, หรืออายัดธุรกรรม
  const handleTransactionAction = (status: 'approved' | 'rejected' | 'frozen') => {
    if (!selectedTransaction) return;
    
    setLoadingApproval(true);
    
    updateTransactionMutation.mutate({
      id: selectedTransaction.id,
      status,
      note: adminNote.trim() || undefined
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
              <h1 className="text-2xl font-bold">การทำธุรกรรม</h1>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="ค้นหาธุรกรรม..."
                    className="w-64 pl-9"
                    value={searchQuery}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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
                <h2 className="text-xl font-bold">ประวัติการทำธุรกรรม</h2>
                <p className="text-muted-foreground">จัดการรายการฝาก-ถอนเงินทั้งหมดในระบบ</p>
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" className="h-9">
                  <Filter className="h-4 w-4 mr-2" />
                  ตัวกรองขั้นสูง
                </Button>
              </div>
            </div>
            
            {/* Transaction Stats */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">การฝากเงินทั้งหมด</p>
                      <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.totalDeposits)}</h3>
                      <p className="text-xs text-green-500 mt-1">
                        <ArrowUpCircle className="h-3 w-3 inline mr-1" />
                        ยอดรวมเงินฝาก
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-500/10">
                      <ArrowUpCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">การถอนเงินทั้งหมด</p>
                      <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.totalWithdrawals)}</h3>
                      <p className="text-xs text-blue-500 mt-1">
                        <ArrowDownCircle className="h-3 w-3 inline mr-1" />
                        ยอดรวมเงินถอน
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <ArrowDownCircle className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">รายการรออนุมัติ</p>
                      <h3 className="text-2xl font-bold mt-1">{stats.pendingCount}</h3>
                      <p className="text-xs text-amber-500 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        รอการตรวจสอบ
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-amber-500/10">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">มูลค่ารออนุมัติ</p>
                      <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.pendingAmount)}</h3>
                      <p className="text-xs text-orange-500 mt-1">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        รอการอนุมัติ
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-orange-500/10">
                      <CreditCard className="h-5 w-5 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Transaction Tabs and Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>รายการธุรกรรม</CardTitle>
                  <Tabs 
                    value={selectedTab} 
                    onValueChange={setSelectedTab}
                    className="w-2/3"
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value="all" className="flex-1">
                        ทั้งหมด
                      </TabsTrigger>
                      <TabsTrigger value="deposits" className="flex-1">
                        เงินฝาก
                        <Badge variant="default" className="ml-2 bg-green-500">
                          {transactions?.filter(t => t.type === 'deposit').length || 0}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="withdrawals" className="flex-1">
                        เงินถอน
                        <Badge variant="default" className="ml-2 bg-blue-500">
                          {transactions?.filter(t => t.type === 'withdraw').length || 0}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="pending" className="flex-1">
                        รออนุมัติ
                        {stats.pendingCount > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {stats.pendingCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={transactionColumns as any}
                  data={filteredTransactions}
                  isLoading={loadingTransactions}
                  emptyMessage="ไม่พบรายการธุรกรรม"
                />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      
      {/* Transaction Detail Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>รายละเอียดธุรกรรม #{selectedTransaction?.id}</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.type === 'deposit' ? 'คำขอฝากเงิน' : 'คำขอถอนเงิน'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">ประเภท:</div>
                <div className="font-medium">
                  {selectedTransaction.type === 'deposit' ? (
                    <span className="flex items-center">
                      <ArrowUpCircle className="h-4 w-4 mr-1 text-green-500" /> ฝากเงิน
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <ArrowDownCircle className="h-4 w-4 mr-1 text-blue-500" /> ถอนเงิน
                    </span>
                  )}
                </div>
                
                <div className="text-muted-foreground">จำนวนเงิน:</div>
                <div className="font-bold">{formatCurrency(parseFloat(selectedTransaction.amount))}</div>
                
                <div className="text-muted-foreground">ผู้ใช้งาน:</div>
                <div>
                  {users?.find(u => u.id === selectedTransaction.userId)?.username}
                  <div className="text-xs text-muted-foreground">
                    ผู้ใช้ #{selectedTransaction.userId}
                  </div>
                </div>
                
                <div className="text-muted-foreground">วันที่:</div>
                <div>{formatShortDate(selectedTransaction.createdAt)}</div>
                
                <div className="text-muted-foreground">สถานะ:</div>
                <div>
                  {selectedTransaction.status === 'pending' ? (
                    <Badge variant="secondary">รออนุมัติ</Badge>
                  ) : selectedTransaction.status === 'approved' ? (
                    <Badge variant="default">อนุมัติแล้ว</Badge>
                  ) : (
                    <Badge variant="destructive">ปฏิเสธแล้ว</Badge>
                  )}
                </div>
                
                <div className="text-muted-foreground">วิธีการชำระเงิน:</div>
                <div>{selectedTransaction.method === 'bank' ? 'ธนาคาร' : 'พร้อมเพย์'}</div>
                
                {selectedTransaction.bankAccount && (
                  <>
                    <div className="text-muted-foreground">เลขที่บัญชี:</div>
                    <div>{selectedTransaction.bankAccount}</div>
                  </>
                )}
                
                {selectedTransaction.bankName && (
                  <>
                    <div className="text-muted-foreground">ธนาคาร:</div>
                    <div>{selectedTransaction.bankName}</div>
                  </>
                )}
                

                
                {selectedTransaction.note && (
                  <>
                    <div className="text-muted-foreground">บันทึก:</div>
                    <div>{selectedTransaction.note}</div>
                  </>
                )}
              </div>
              
              {/* แสดงรูปภาพหลักฐานการชำระเงิน */}
              {selectedTransaction.type === 'deposit' && selectedTransaction.paymentProof && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">หลักฐานการชำระเงิน:</div>
                  <div className="border rounded-md overflow-hidden">
                    <img 
                      src={selectedTransaction.paymentProof} 
                      alt="หลักฐานการชำระเงิน" 
                      className="w-full h-auto object-contain cursor-pointer"
                      onClick={() => window.open(selectedTransaction.paymentProof, '_blank')}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    คลิกที่รูปภาพเพื่อดูขนาดเต็ม
                  </div>
                </div>
              )}
              
              {selectedTransaction.status === 'pending' && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="admin-note">หมายเหตุของผู้ดูแล</Label>
                  <Input
                    id="admin-note"
                    value={adminNote}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setAdminNote(e.target.value)}
                    placeholder="เพิ่มหมายเหตุเกี่ยวกับการอนุมัติหรือปฏิเสธ (ไม่บังคับ)"
                  />
                </div>
              )}
              
              {selectedTransaction.status === 'pending' && (
                <DialogFooter className="flex justify-between mt-4">
                  <Button
                    variant="destructive"
                    onClick={() => handleTransactionAction('rejected')}
                    disabled={loadingApproval}
                  >
                    {loadingApproval ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังดำเนินการ
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" /> ปฏิเสธ
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="default"
                    onClick={() => handleTransactionAction('approved')}
                    disabled={loadingApproval}
                  >
                    {loadingApproval ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังดำเนินการ
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" /> อนุมัติ
                      </>
                    )}
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Approve Transaction Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการอนุมัติธุรกรรม</DialogTitle>
            <DialogDescription>
              คุณต้องการอนุมัติรายการ {selectedTransaction?.type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'} นี้ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-3 bg-background">
              <div className="flex items-center justify-between text-sm">
                <div>หมายเลขธุรกรรม:</div>
                <div className="font-medium">#{selectedTransaction?.id}</div>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <div>จำนวนเงิน:</div>
                <div className="font-medium">{formatCurrency(parseFloat(selectedTransaction?.amount || "0"))}</div>
              </div>
              {selectedTransaction?.type === 'withdraw' && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <div>ค่าธรรมเนียม (3%):</div>
                  <div className="font-medium">{formatCurrency(parseFloat(selectedTransaction?.amount || "0") * 0.03)}</div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-note">บันทึกเพิ่มเติม (ถ้ามี)</Label>
              <Textarea
                id="admin-note"
                placeholder="ระบุบันทึกเพิ่มเติมหรือหมายเหตุ..."
                value={adminNote}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowApproveDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={() => {
                setShowApproveDialog(false);
                handleTransactionAction('approved');
              }}
              disabled={loadingApproval}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loadingApproval ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังดำเนินการ
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" /> ยืนยันการอนุมัติ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Freeze Transaction Dialog */}
      <Dialog open={showFreezeDialog} onOpenChange={setShowFreezeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>อายัดรายการธุรกรรม</DialogTitle>
            <DialogDescription>
              คุณต้องการอายัดรายการ {selectedTransaction?.type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'} นี้ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-3 bg-background">
              <div className="flex items-center justify-between text-sm">
                <div>หมายเลขธุรกรรม:</div>
                <div className="font-medium">#{selectedTransaction?.id}</div>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <div>จำนวนเงิน:</div>
                <div className="font-medium">{formatCurrency(parseFloat(selectedTransaction?.amount || "0"))}</div>
              </div>
              {selectedTransaction?.type === 'withdraw' && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <div>ค่าธรรมเนียม (3%):</div>
                  <div className="font-medium">{formatCurrency(parseFloat(selectedTransaction?.amount || "0") * 0.03)}</div>
                </div>
              )}
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-md p-3 text-yellow-800 dark:text-yellow-300">
              <div className="flex">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">คำเตือน</h3>
                  <p className="text-sm">การอายัดเงินจะทำให้ยอดเงินถูกระงับไว้ชั่วคราว และอาจต้องมีการตรวจสอบเพิ่มเติม</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-note">เหตุผลในการอายัด (จำเป็น)</Label>
              <Textarea
                id="admin-note"
                placeholder="ระบุเหตุผลที่ต้องอายัดรายการนี้..."
                value={adminNote}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowFreezeDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={() => {
                if (!adminNote.trim()) {
                  toast({
                    title: "กรุณาระบุเหตุผล",
                    description: "โปรดระบุเหตุผลในการอายัดรายการนี้",
                    variant: "destructive",
                  });
                  return;
                }
                
                setShowFreezeDialog(false);
                handleTransactionAction('frozen');
              }}
              disabled={loadingApproval}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {loadingApproval ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังดำเนินการ
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" /> ยืนยันการอายัด
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DesktopContainer>
  );
}