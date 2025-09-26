import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Trade, AdminUsersResponse, AdminTradesResponse } from "@shared/schema";
import { DesktopContainer } from "@/components/layout/desktop-container";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { apiRequest } from "@/lib/queryClient";
import {
  Search,
  Bell,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Filter,
  Download,
  RefreshCw,
  DollarSign,
  Users,
  BarChart
} from "lucide-react";

// ฟังก์ชันช่วยจัดรูปแบบวันที่
const formatDate = (date: Date | string | null) => {
  if (!date) return "-";
  return format(new Date(date), "dd MMM yyyy HH:mm", { locale: th });
};

// ฟังก์ชันช่วยจัดรูปแบบจำนวนเงิน
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function AdminTradesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [openPredeterminedDialog, setOpenPredeterminedDialog] = useState(false);
  const [predeterminedResult, setPredeterminedResult] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch data with pagination
  const { data: tradesResponse, isLoading } = useQuery<AdminTradesResponse>({
    queryKey: ["/api/admin/trades", { page: 1, limit: 10000 }], // Get all trades for admin management
    queryFn: async () => {
      const response = await fetch("/api/admin/trades?page=1&limit=10000");
      return response.json();
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });
  
  const { data: usersResponse } = useQuery<AdminUsersResponse>({
    queryKey: ["/api/admin/users", { page: 1, limit: 10000 }], // Get all users for lookup
    queryFn: async () => {
      const response = await fetch("/api/admin/users?page=1&limit=10000");
      return response.json();
    }
  });

  // Extract data from paginated responses
  const trades = tradesResponse?.trades || [];
  const users = usersResponse?.users || [];

  // Mutation สำหรับอัพเดทผลลัพธ์ล่วงหน้าของการเทรด
  const predeterminedMutation = useMutation({
    mutationFn: async ({ tradeId, result }: { tradeId: number; result: string | null }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/trades/${tradeId}/predetermined`,
        { predeterminedResult: result }
      );
      return await res.json();
    },
    onSuccess: () => {
      // อัพเดทข้อมูลในแคช
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] });
      setOpenPredeterminedDialog(false);
      toast({
        title: "สำเร็จ",
        description: "อัพเดทผลลัพธ์ล่วงหน้าเรียบร้อยแล้ว",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // จัดการการเลือกผลลัพธ์ล่วงหน้า
  const handleSetPredetermined = () => {
    if (selectedTrade) {
      predeterminedMutation.mutate({
        tradeId: selectedTrade.id,
        result: predeterminedResult,
      });
    }
  };

  // เปิดไดอะล็อกกำหนดผลลัพธ์ล่วงหน้า
  const openSetPredeterminedDialog = (trade: Trade) => {
    setSelectedTrade(trade);
    setPredeterminedResult(trade.predeterminedResult || null);
    setOpenPredeterminedDialog(true);
  };

  // กรองข้อมูลการเทรดตาม search query และ status filter และเรียงลำดับตามวันที่ล่าสุด
  const filteredTrades = (trades.filter((trade) => {
    // กรองตาม search query
    const matchesSearch =
      searchQuery === "" ||
      trade.id.toString().includes(searchQuery) ||
      trade.cryptoId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (users?.find((u) => u.id === trade.userId)?.username || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    // กรองตาม status
    const matchesStatus = statusFilter === "all" || trade.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [])
    // เรียงลำดับตามวันที่ล่าสุด
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <AdminLayout>
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">จัดการการเทรด</h1>
            <p className="text-muted-foreground">
              จัดการและตรวจสอบรายการเทรดทั้งหมดในระบบ
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ค้นหา ID, คริปโต, ผู้ใช้..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="active">กำลังดำเนินการ</SelectItem>
                <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] })}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            รีเฟรช
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>ผู้ใช้</TableHead>
                    <TableHead>คริปโต</TableHead>
                    <TableHead>จำนวน</TableHead>
                    <TableHead>ทิศทาง</TableHead>
                    <TableHead>ราคาเข้า</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>ผลลัพธ์</TableHead>
                    <TableHead>ผลที่กำหนดไว้</TableHead>
                    <TableHead>เวลาสร้าง</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-4">
                        กำลังโหลดข้อมูล...
                      </TableCell>
                    </TableRow>
                  ) : filteredTrades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-4">
                        ไม่พบข้อมูลการเทรด
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTrades.map((trade) => {
                      const userName = users?.find((u) => u.id === trade.userId)?.username || `User ${trade.userId}`;
                      return (
                        <TableRow key={trade.id}>
                          <TableCell>{trade.id}</TableCell>
                          <TableCell>{userName}</TableCell>
                          <TableCell>{trade.cryptoId.toUpperCase()}</TableCell>
                          <TableCell>{trade.amount}</TableCell>
                          <TableCell>
                            <Badge variant={trade.direction === "up" ? "default" : "destructive"}>
                              {trade.direction === "up" ? "ขึ้น" : "ลง"}
                            </Badge>
                          </TableCell>
                          <TableCell>{parseFloat(trade.entryPrice).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={
                              trade.status === "active" ? "default" : 
                              trade.status === "completed" ? "secondary" : 
                              "destructive"
                            }>
                              {trade.status === "active" ? "กำลังเทรด" : 
                              trade.status === "completed" ? "เสร็จสิ้น" : 
                              "ยกเลิก"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {trade.result ? (
                              <Badge variant={trade.result === "win" ? "default" : "destructive"}>
                                {trade.result === "win" ? "ชนะ" : "แพ้"}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {trade.predeterminedResult ? (
                              <Badge variant={trade.predeterminedResult === "win" ? "default" : "destructive"}>
                                {trade.predeterminedResult === "win" ? "ชนะ" : "แพ้"}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>{formatDate(trade.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">เปิดเมนู</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openSetPredeterminedDialog(trade)}
                                >
                                  <Trophy className="mr-2 h-4 w-4" />
                                  กำหนดผลลัพธ์ล่วงหน้า
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ไดอะล็อกสำหรับกำหนดผลลัพธ์ล่วงหน้า */}
      <Dialog open={openPredeterminedDialog} onOpenChange={setOpenPredeterminedDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>กำหนดผลลัพธ์ล่วงหน้า</DialogTitle>
            <DialogDescription>
              กำหนดผลลัพธ์ล่วงหน้าสำหรับการเทรดนี้ (ID: {selectedTrade?.id})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">เลือกผลลัพธ์:</h4>
              <div className="flex space-x-4">
                <Button
                  variant={predeterminedResult === "win" ? "default" : "outline"}
                  onClick={() => setPredeterminedResult("win")}
                  className="flex-1"
                >
                  <Check className="mr-2 h-4 w-4" />
                  ชนะ
                </Button>
                <Button
                  variant={predeterminedResult === "lose" ? "destructive" : "outline"}
                  onClick={() => setPredeterminedResult("lose")}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  แพ้
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setPredeterminedResult(null)}
                className="w-full mt-2"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                ไม่กำหนด (ปล่อยให้เป็นไปตามราคาจริง)
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPredeterminedDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSetPredetermined} disabled={predeterminedMutation.isPending}>
              {predeterminedMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}