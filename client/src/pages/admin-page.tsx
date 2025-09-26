import { MobileContainer } from "@/components/layout/mobile-container";
import { TopNavigation } from "@/components/layout/top-navigation";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { User, Trade, Transaction, AdminUsersResponse, AdminTradesResponse, AdminTransactionsResponse } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ArrowUp, ArrowDown, FileText, Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [loadingApproval, setLoadingApproval] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Fetch data with pagination
  const { data: usersResponse, isLoading: loadingUsers } = useQuery<AdminUsersResponse>({
    queryKey: ["/api/admin/users", { page: 1, limit: 1000 }],
    queryFn: async () => {
      const response = await fetch("/api/admin/users?page=1&limit=1000");
      return response.json();
    }
  });
  
  const { data: tradesResponse, isLoading: loadingTrades } = useQuery<AdminTradesResponse>({
    queryKey: ["/api/admin/trades", { page: 1, limit: 1000 }],
    queryFn: async () => {
      const response = await fetch("/api/admin/trades?page=1&limit=1000");
      return response.json();
    }
  });
  
  const { data: transactionsResponse, isLoading: loadingTransactions } = useQuery<AdminTransactionsResponse>({
    queryKey: ["/api/admin/transactions", { page: 1, limit: 1000 }],
    queryFn: async () => {
      const response = await fetch("/api/admin/transactions?page=1&limit=1000");
      return response.json();
    },
    refetchInterval: 15000, // รีเฟรชทุก 15 วินาที
  });

  // Extract data from paginated responses
  const users = usersResponse?.users || [];
  const trades = tradesResponse?.trades || [];
  const transactions = transactionsResponse?.transactions || [];

  const userCount = users?.length || 0;
  const activeTradesCount = trades?.filter(t => t.status === 'active').length || 0;
  const pendingTransactionsCount = transactions?.filter(t => t.status === 'pending').length || 0;
  const tradingVolume = trades?.reduce((sum, trade) => {
    const amount = parseFloat(trade.amount);
    const price = parseFloat(trade.entryPrice);
    return sum + (amount * price);
  }, 0) || 0;
  
  const lastWeekVolume = tradingVolume * 0.75; // Simulated value
  const volumeChange = tradingVolume > 0 ? (tradingVolume - lastWeekVolume) / lastWeekVolume * 100 : 0;
  
  const userColumns = [
    {
      key: 'id',
      header: 'ID',
      width: '50px',
      cell: (user: User) => <span>{user.id}</span>,
    },
    {
      key: 'username',
      header: 'Username',
      cell: (user: User) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            {(user.fullName || user.username).charAt(0)}
          </div>
          <span>{user.username}</span>
        </div>
      ),
    },
    {
      key: 'fullName',
      header: 'Full Name',
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'role',
      header: 'Role',
      cell: (user: User) => (
        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      cell: (user: User) => formatShortDate(user.createdAt),
    },
  ] as const;
  
  const tradeColumns = [
    {
      key: 'id',
      header: 'ID',
      width: '50px',
    },
    {
      key: 'userId',
      header: 'User',
      cell: (trade: Trade) => {
        const user = users?.find(u => u.id === trade.userId);
        return user?.username || `User ${trade.userId}`;
      },
    },
    {
      key: 'cryptoId',
      header: 'Crypto',
      cell: (trade: Trade) => trade.cryptoId.toUpperCase(),
    },
    {
      key: 'amount',
      header: 'Amount',
    },
    {
      key: 'direction',
      header: 'Direction',
      cell: (trade: Trade) => (
        <Badge variant={trade.direction === 'up' ? 'default' : 'destructive'}>
          {trade.direction.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'entryPrice',
      header: 'Entry Price',
      cell: (trade: Trade) => formatCurrency(parseFloat(trade.entryPrice)),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (trade: Trade) => (
        <Badge variant={trade.status === 'active' ? 'default' : 'secondary'}>
          {trade.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      cell: (trade: Trade) => formatShortDate(trade.createdAt),
    },
  ] as const;
  
  // คอลัมน์สำหรับตารางธุรกรรม
  const transactionColumns = [
    {
      key: 'id',
      header: 'ID',
      width: '50px',
    },
    {
      key: 'userId',
      header: 'User',
      cell: (transaction: Transaction) => {
        const user = users?.find(u => u.id === transaction.userId);
        return user?.username || `User ${transaction.userId}`;
      },
    },
    {
      key: 'type',
      header: 'Type',
      cell: (transaction: Transaction) => (
        <Badge variant={transaction.type === 'deposit' ? 'default' : 'secondary'}>
          {transaction.type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (transaction: Transaction) => formatCurrency(parseFloat(transaction.amount)),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (transaction: Transaction) => {
        let variant = 'secondary';
        let label = 'รออนุมัติ';
        
        if (transaction.status === 'approved') {
          variant = 'default';
          label = 'อนุมัติแล้ว';
        } else if (transaction.status === 'rejected') {
          variant = 'destructive';
          label = 'ปฏิเสธแล้ว';
        }
        
        return <Badge variant={variant as any}>{label}</Badge>;
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      cell: (transaction: Transaction) => formatShortDate(transaction.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (transaction: Transaction) => {
        // แสดงปุ่มเฉพาะรายการที่รอการอนุมัติเท่านั้น
        if (transaction.status !== 'pending') {
          return (
            <div className="text-xs text-muted-foreground italic">
              {transaction.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
            </div>
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
          </div>
        );
      },
    },
  ] as const;

  // Mutation เพื่ออัพเดทสถานะของธุรกรรม
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
  
  // ฟังก์ชันสำหรับการอนุมัติหรือปฏิเสธธุรกรรม
  const handleTransactionAction = (status: 'approved' | 'rejected') => {
    if (!selectedTransaction) return;
    
    setLoadingApproval(true);
    
    updateTransactionMutation.mutate({
      id: selectedTransaction.id,
      status,
      note: adminNote.trim() || undefined
    });
  };
  
  const handleBack = () => {
    navigate('/');
  };

  return (
    <MobileContainer>
      <div className="pb-20"> {/* Add padding for bottom navigation */}
        <TopNavigation title="Admin Dashboard" showBackButton onBack={handleBack} />
        
        <div className="p-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-muted-foreground mb-1">Active Users</div>
                <div className="text-2xl font-semibold">{userCount}</div>
                <div className="text-[hsl(var(--chart-1))] text-sm mt-1">+12% this week</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-muted-foreground mb-1">Active Trades</div>
                <div className="text-2xl font-semibold">{activeTradesCount}</div>
                <div className="text-[hsl(var(--chart-1))] text-sm mt-1">+8% this week</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-muted-foreground mb-1">Total Volume</div>
                <div className="text-2xl font-semibold">{formatCurrency(tradingVolume)}</div>
                <div className="text-[hsl(var(--chart-1))] text-sm mt-1">
                  {volumeChange >= 0 ? '+' : ''}{volumeChange.toFixed(1)}% this month
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-muted-foreground mb-1">Revenue</div>
                <div className="text-2xl font-semibold">{formatCurrency(tradingVolume * 0.002)}</div>
                <div className="text-[hsl(var(--chart-1))] text-sm mt-1">+15% this month</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Platform Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode" className="font-medium">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Temporarily disable the platform</p>
                  </div>
                  <Switch id="maintenance-mode" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="new-registrations" className="font-medium">New Registrations</Label>
                    <p className="text-sm text-muted-foreground">Allow new user sign-ups</p>
                  </div>
                  <Switch id="new-registrations" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="trading-enabled" className="font-medium">Trading Enabled</Label>
                    <p className="text-sm text-muted-foreground">Allow users to execute trades</p>
                  </div>
                  <Switch id="trading-enabled" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="transactions">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="transactions">
                รายการธุรกรรม
                {pendingTransactionsCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingTransactionsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="users">ผู้ใช้งาน</TabsTrigger>
              <TabsTrigger value="trades">รายการเทรด</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions">
              <DataTable
                columns={transactionColumns as any}
                data={transactions || []}
                isLoading={loadingTransactions}
                emptyMessage="ไม่พบรายการธุรกรรม"
              />
            </TabsContent>
            
            <TabsContent value="users">
              <DataTable
                columns={userColumns as any}
                data={users || []}
                isLoading={loadingUsers}
                emptyMessage="ไม่พบผู้ใช้งาน"
              />
            </TabsContent>
            
            <TabsContent value="trades">
              <DataTable
                columns={tradeColumns as any}
                data={trades || []}
                isLoading={loadingTrades}
                emptyMessage="ไม่พบรายการเทรด"
              />
            </TabsContent>
          </Tabs>
          
          {/* Modal for transaction details and approval/rejection */}
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
                    <div>{selectedTransaction.type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'}</div>
                    
                    <div className="text-muted-foreground">จำนวนเงิน:</div>
                    <div className="font-bold">{formatCurrency(parseFloat(selectedTransaction.amount))}</div>
                    
                    <div className="text-muted-foreground">ผู้ใช้งาน:</div>
                    <div>{users?.find(u => u.id === selectedTransaction.userId)?.username}</div>
                    
                    <div className="text-muted-foreground">วันที่:</div>
                    <div>{formatShortDate(selectedTransaction.createdAt)}</div>
                    
                    <div className="text-muted-foreground">สถานะ:</div>
                    <div>
                      <Badge variant="secondary">รออนุมัติ</Badge>
                    </div>
                    
                    <div className="text-muted-foreground">วิธีการชำระเงิน:</div>
                    <div>{selectedTransaction.method}</div>
                    
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
                  </div>
                  
                  {selectedTransaction.note && (
                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground">หมายเหตุจากผู้ใช้:</div>
                      <div className="text-sm p-2 bg-muted rounded-md">{selectedTransaction.note}</div>
                    </div>
                  )}
                  
                  {selectedTransaction.paymentProof && (
                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-1">หลักฐานการโอนเงิน:</div>
                      <div className="border rounded-md overflow-hidden">
                        <img 
                          src={selectedTransaction.paymentProof} 
                          alt="หลักฐานการโอนเงิน" 
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="adminNote">หมายเหตุสำหรับการอนุมัติ/ปฏิเสธ:</Label>
                    <Input
                      id="adminNote"
                      placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  disabled={loadingApproval}
                  onClick={() => setShowTransactionDialog(false)}
                >
                  ยกเลิก
                </Button>
                <Button 
                  variant="destructive" 
                  disabled={loadingApproval} 
                  className="w-full sm:w-auto"
                  onClick={() => handleTransactionAction('rejected')}
                >
                  {loadingApproval ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  ปฏิเสธคำขอ
                </Button>
                <Button 
                  disabled={loadingApproval} 
                  className="w-full sm:w-auto"
                  onClick={() => handleTransactionAction('approved')}
                >
                  {loadingApproval ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  อนุมัติคำขอ
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <BottomNavigation />
    </MobileContainer>
  );
}
