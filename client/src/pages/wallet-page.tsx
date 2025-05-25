import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { TopNavigation } from "@/components/layout/top-navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AddBankAccountDialog, ManageBankAccountsDialog, BankAccountSelector } from "@/components/bank-account-manager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { Loader2, ArrowUp, ArrowDown, PlusCircle, Trash2, CheckCircle2 } from "lucide-react";
import { Transaction, BankAccount } from "@shared/schema";
import asiaLogo from "@assets/Asia_Plus_Securities.png";
import cryptoBgImage from "@assets/image_1748118681634.png";

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showAddBankAccountDialog, setShowAddBankAccountDialog] = useState(false);
  const [showManageBankDialog, setShowManageBankDialog] = useState(false);
  const [depositMethod, setDepositMethod] = useState("bank");
  const [withdrawMethod, setWithdrawMethod] = useState("bank");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("กสิกรไทย");
  const [accountName, setAccountName] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | null>(null);
  
  // กำหนดประเภทข้อมูลสำหรับบัญชีธนาคารและพร้อมเพย์
  interface DepositAccounts {
    bank: {
      name: string;
      accountNumber: string;
      accountName: string;
    };
    promptpay: {
      number: string;
      taxId: string;
      name: string;
    };
  }
  
  // สำหรับดึงข้อมูลบัญชีธนาคารและพร้อมเพย์สำหรับการฝากเงิน
  const { data: depositAccounts, isLoading: isLoadingDepositAccounts } = useQuery<DepositAccounts>({
    queryKey: ['/api/deposit-accounts'],
    enabled: showDepositDialog, // ดึงข้อมูลเมื่อแสดงหน้าต่างฝากเงินเท่านั้น
  });
  
  // ดึงข้อมูลประวัติธุรกรรม
  const { 
    data: transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError 
  } = useQuery<Transaction[]>({
    queryKey: ["/api/wallet/transactions"],
    refetchInterval: 15000, // รีเฟรชทุก 15 วินาที เพื่อติดตามสถานะ
  });
  
  // ดึงข้อมูลบัญชีธนาคารที่ผูกไว้
  const {
    data: bankAccounts,
    isLoading: isLoadingBankAccounts,
    error: bankAccountsError
  } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
    enabled: !!user, // เริ่มดึงข้อมูลเมื่อมีข้อมูลผู้ใช้แล้วเท่านั้น
  });
  
  // Mutation สำหรับเพิ่มบัญชีธนาคาร
  const addBankAccountMutation = useMutation({
    mutationFn: async (data: { 
      bankName: string; 
      accountNumber: string; 
      accountName: string;
      isDefault: boolean;
    }) => {
      const res = await apiRequest("POST", "/api/bank-accounts", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: "เพิ่มบัญชีธนาคารสำเร็จ",
        description: "บัญชีธนาคารได้รับการบันทึกเรียบร้อยแล้ว",
      });
      setShowAddBankAccountDialog(false);
      setBankName("กสิกรไทย");
      setBankAccount("");
      setAccountName("");
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation สำหรับลบบัญชีธนาคาร
  const deleteBankAccountMutation = useMutation({
    mutationFn: async (bankAccountId: number) => {
      const res = await apiRequest("DELETE", `/api/bank-accounts/${bankAccountId}`);
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: "ลบบัญชีธนาคารสำเร็จ",
        description: "บัญชีธนาคารได้ถูกลบเรียบร้อยแล้ว",
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
  
  // Mutation สำหรับตั้งบัญชีธนาคารเป็นค่าเริ่มต้น
  const setDefaultBankAccountMutation = useMutation({
    mutationFn: async (bankAccountId: number) => {
      const res = await apiRequest("PATCH", `/api/bank-accounts/${bankAccountId}/default`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: "ตั้งค่าบัญชีหลักสำเร็จ",
        description: "บัญชีธนาคารได้ถูกตั้งเป็นบัญชีหลักเรียบร้อยแล้ว",
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
  
  // Mutation สำหรับถอนเงินโดยใช้บัญชีที่ผูกไว้
  const withdrawWithSavedAccountMutation = useMutation({
    mutationFn: async (data: { amount: string; bankAccountId: number }) => {
      const res = await apiRequest("POST", "/api/wallet/withdraw-with-saved-account", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      
      toast({
        title: "ส่งคำขอถอนเงินสำเร็จ",
        description: `คำขอถอนเงินจำนวน ${formatCurrency(parseFloat(amount))} ถูกส่งเรียบร้อยแล้ว กรุณารอการอนุมัติ`,
      });
      
      setShowWithdrawDialog(false);
      setAmount("");
      setSelectedBankAccountId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation สำหรับฝากเงิน
  const depositMutation = useMutation({
    mutationFn: async (data: { amount: string; method: string; paymentProofBase64?: string }) => {
      const res = await apiRequest("POST", "/api/wallet/deposit", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      
      toast({
        title: "ส่งคำขอฝากเงินสำเร็จ",
        description: `คำขอฝากเงินจำนวน ${formatCurrency(parseFloat(amount))} ถูกส่งเรียบร้อยแล้ว กรุณารอการอนุมัติ`,
      });
      
      setShowDepositDialog(false);
      setAmount("");
      setPaymentProof(null);
      
      // Reset upload form
      const previewImg = document.getElementById('payment-proof-preview') as HTMLImageElement;
      if (previewImg) {
        previewImg.src = "#";
        previewImg.classList.add('hidden');
      }
      document.getElementById('upload-placeholder')?.classList.remove('hidden');
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation สำหรับถอนเงิน
  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: string; method: string; bankAccount?: string; bankName?: string }) => {
      const res = await apiRequest("POST", "/api/wallet/withdraw", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      
      toast({
        title: "ส่งคำขอถอนเงินสำเร็จ",
        description: `คำขอถอนเงินจำนวน ${formatCurrency(parseFloat(amount))} ถูกส่งเรียบร้อยแล้ว กรุณารอการอนุมัติ`,
      });
      
      setShowWithdrawDialog(false);
      setAmount("");
      setBankAccount("");
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeposit = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: "จำนวนเงินไม่ถูกต้อง",
        description: "กรุณาระบุจำนวนเงินให้ถูกต้อง",
        variant: "destructive",
      });
      return;
    }
    
    if (!paymentProof) {
      toast({
        title: "กรุณาอัพโหลดหลักฐานการโอนเงิน",
        description: "คุณต้องแนบหลักฐานการโอนเงินเพื่อยืนยันการฝากเงิน",
        variant: "destructive",
      });
      return;
    }
    
    // เช็คขนาดไฟล์ (ไม่เกิน 5MB)
    if (paymentProof.size > 5 * 1024 * 1024) {
      toast({
        title: "ไฟล์มีขนาดใหญ่เกินไป",
        description: "กรุณาอัพโหลดไฟล์ที่มีขนาดไม่เกิน 5MB",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // แปลงไฟล์เป็น Base64
      const paymentProofBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert file to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(paymentProof);
      });
      
      depositMutation.mutate({
        amount,
        method: depositMethod,
        paymentProofBase64
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัพโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  const handleWithdraw = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: "จำนวนเงินไม่ถูกต้อง",
        description: "กรุณาระบุจำนวนเงินให้ถูกต้อง",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) > parseFloat(user?.balance || "0")) {
      toast({
        title: "ยอดเงินไม่เพียงพอ",
        description: "ยอดเงินในบัญชีของคุณไม่เพียงพอสำหรับการถอนเงิน",
        variant: "destructive",
      });
      return;
    }
    
    // ตรวจสอบว่ามีบัญชีธนาคารสำหรับถอนเงินหรือไม่
    if (!bankAccounts || bankAccounts.length === 0) {
      toast({
        title: "ยังไม่มีบัญชีธนาคาร",
        description: "กรุณาเพิ่มบัญชีธนาคารสำหรับการถอนเงินก่อน",
        variant: "destructive",
      });
      return;
    }
    
    // หาบัญชีธนาคารที่จะใช้ในการถอนเงิน (บัญชีหลักหรือบัญชีแรก)
    const defaultAccount = bankAccounts.find(acc => acc.isDefault);
    const accountToUse = defaultAccount || bankAccounts[0];
    
    // ใช้บัญชีที่ผูกไว้ในการถอนเงิน
    withdrawWithSavedAccountMutation.mutate({
      amount, 
      bankAccountId: accountToUse.id
    });
  };
  
  // ฟังก์ชันเมื่อกดปุ่มเพิ่มบัญชีธนาคาร
  const handleAddBankAccount = () => {
    if (!bankName || !bankAccount || !accountName) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาระบุชื่อธนาคาร, เลขที่บัญชี และชื่อบัญชี",
        variant: "destructive",
      });
      return;
    }
    
    // ตรวจสอบว่าเลขที่บัญชีเป็นตัวเลขเท่านั้น
    if (!/^\d+$/.test(bankAccount)) {
      toast({
        title: "เลขที่บัญชีไม่ถูกต้อง",
        description: "เลขที่บัญชีต้องเป็นตัวเลขเท่านั้น",
        variant: "destructive",
      });
      return;
    }
    
    // เช็คว่ามีบัญชีอยู่แล้วหรือไม่ ถ้าไม่มีให้ตั้งเป็นบัญชีหลัก
    const isFirstAccount = !bankAccounts || bankAccounts.length === 0;
    
    addBankAccountMutation.mutate({
      bankName,
      accountNumber: bankAccount,
      accountName,
      isDefault: isFirstAccount
    });
  };

  return (
    <MobileContainer>
      <TopNavigation title="กระเป๋าเงิน" showBackButton />
      
      {/* ไดอะล็อกสำหรับเพิ่มบัญชีธนาคาร */}
      <AddBankAccountDialog
        open={showAddBankAccountDialog}
        onOpenChange={setShowAddBankAccountDialog}
      />
      
      {/* ไดอะล็อกสำหรับจัดการบัญชีธนาคาร */}
      <ManageBankAccountsDialog
        open={showManageBankDialog}
        onOpenChange={setShowManageBankDialog}
        onAddNewClick={() => {
          setShowManageBankDialog(false);
          setShowAddBankAccountDialog(true);
        }}
      />
      
      <div className="flex-1 overflow-y-auto">
        {/* บัตรยอดเงินคงเหลือ */}
        <Card className="mb-4 text-white overflow-hidden rounded-none border-x-0 shadow-none">
          <div className="relative">
            <div className="absolute inset-0 z-0">
              {/* พื้นหลังใช้รูปภาพตามที่ผู้ใช้ต้องการ */}
              <img 
                src="https://img.freepik.com/premium-photo/bitcoin-blockchain-crypto-currency-digital-encryption-digital-money-exchange-technology-network-connections_24070-1004.jpg" 
                alt="Crypto Background" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col mb-4">
                <div className="text-sm mb-1 text-blue-100">ยอดเงินคงเหลือ</div>
                <div className="text-3xl font-bold mb-4">
                  {formatCurrency(Number(user?.balance || 0))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setShowDepositDialog(true)}
                  variant="outline"
                  className="bg-blue-800/40 border-blue-300 text-white hover:bg-blue-700/50"
                >
                  ฝากเงิน
                </Button>
                <Button
                  onClick={() => setShowWithdrawDialog(true)}
                  variant="outline"
                  className="bg-blue-800/40 border-blue-300 text-white hover:bg-blue-700/50"
                >
                  ถอนเงิน
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
        
        <div className="px-4">
          {/* บัตรประวัติธุรกรรม */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">ประวัติธุรกรรม</h3>
              
              {isLoadingTransactions ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactionsError ? (
                <div className="text-center text-red-500 py-8">
                  เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div>
                  {/* แยกธุรกรรมเป็น 2 แท็บ */}
                  <Tabs defaultValue="all" className="mb-4">
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
                      <TabsTrigger value="deposit">ฝากเงิน</TabsTrigger>
                      <TabsTrigger value="withdraw">ถอนเงิน</TabsTrigger>
                    </TabsList>

                    {/* แท็บแสดงธุรกรรมทั้งหมด */}
                    <TabsContent value="all" className="space-y-3 mt-2">
                      {transactions
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((transaction) => (
                        <div key={transaction.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              {transaction.type === "deposit" ? (
                                <div className="rounded-full bg-green-100 p-2 mr-3">
                                  <ArrowDown className="h-4 w-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="rounded-full bg-blue-100 p-2 mr-3">
                                  <ArrowUp className="h-4 w-4 text-blue-600" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">
                                  {transaction.type === "deposit" ? "ฝากเงิน" : "ถอนเงิน"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatShortDate(transaction.createdAt)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium ${transaction.type === "deposit" ? "text-green-600" : "text-blue-600"}`}>
                                {transaction.type === "deposit" ? "+" : "-"}
                                {formatCurrency(parseFloat(transaction.amount))}
                              </div>
                              <Badge 
                                className={`mt-1 ${transaction.status === "approved" ? "bg-green-500 hover:bg-green-600 text-white" : transaction.status === "frozen" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
                                variant={
                                  transaction.status === "rejected" ? "destructive" : 
                                  transaction.status === "approved" ? "default" : 
                                  transaction.status === "frozen" ? "outline" : "outline"
                                }
                              >
                                {transaction.status === "pending" ? "รออนุมัติ" : 
                                transaction.status === "approved" ? "อนุมัติแล้ว" :
                                transaction.status === "frozen" ? "ถูกอายัด" :
                                "ถูกปฏิเสธ"}
                              </Badge>
                            </div>
                          </div>
                          {transaction.note && (
                            <div className="mt-2 text-sm bg-muted p-2 rounded">
                              <span className="font-medium">หมายเหตุ:</span> {transaction.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </TabsContent>

                    {/* แท็บแสดงเฉพาะธุรกรรมฝากเงิน */}
                    <TabsContent value="deposit" className="space-y-3 mt-2">
                      {transactions
                        .filter(transaction => transaction.type === "deposit")
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((transaction) => (
                        <div key={transaction.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <div className="rounded-full bg-green-100 p-2 mr-3">
                                <ArrowDown className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <div className="font-medium">ฝากเงิน</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatShortDate(transaction.createdAt)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-green-600 font-medium">
                                +{formatCurrency(parseFloat(transaction.amount))}
                              </div>
                              <Badge 
                                className={`mt-1 ${transaction.status === "approved" ? "bg-green-500 hover:bg-green-600 text-white" : transaction.status === "frozen" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
                                variant={
                                  transaction.status === "rejected" ? "destructive" : 
                                  transaction.status === "approved" ? "default" : 
                                  transaction.status === "frozen" ? "outline" : "outline"
                                }
                              >
                                {transaction.status === "pending" ? "รออนุมัติ" : 
                                transaction.status === "approved" ? "อนุมัติแล้ว" :
                                transaction.status === "frozen" ? "ถูกอายัด" :
                                "ถูกปฏิเสธ"}
                              </Badge>
                            </div>
                          </div>
                          {transaction.note && (
                            <div className="mt-2 text-sm bg-muted p-2 rounded">
                              <span className="font-medium">หมายเหตุ:</span> {transaction.note}
                            </div>
                          )}
                        </div>
                      ))}
                      {transactions.filter(transaction => transaction.type === "deposit").length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          ไม่มีรายการฝากเงิน
                        </div>
                      )}
                    </TabsContent>

                    {/* แท็บแสดงเฉพาะธุรกรรมถอนเงิน */}
                    <TabsContent value="withdraw" className="space-y-3 mt-2">
                      {transactions
                        .filter(transaction => transaction.type === "withdraw")
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((transaction) => (
                        <div key={transaction.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <div className="rounded-full bg-blue-100 p-2 mr-3">
                                <ArrowUp className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium">ถอนเงิน</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatShortDate(transaction.createdAt)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-blue-600 font-medium">
                                -{formatCurrency(parseFloat(transaction.amount))}
                              </div>
                              <Badge 
                                className={`mt-1 ${transaction.status === "approved" ? "bg-green-500 hover:bg-green-600 text-white" : transaction.status === "frozen" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
                                variant={
                                  transaction.status === "rejected" ? "destructive" : 
                                  transaction.status === "approved" ? "default" : 
                                  transaction.status === "frozen" ? "outline" : "outline"
                                }
                              >
                                {transaction.status === "pending" ? "รออนุมัติ" : 
                                transaction.status === "approved" ? "อนุมัติแล้ว" :
                                transaction.status === "frozen" ? "ถูกอายัด" :
                                "ถูกปฏิเสธ"}
                              </Badge>
                            </div>
                          </div>
                          {transaction.note && (
                            <div className="mt-2 text-sm bg-muted p-2 rounded">
                              <span className="font-medium">หมายเหตุ:</span> {transaction.note}
                            </div>
                          )}
                        </div>
                      ))}
                      {transactions.filter(transaction => transaction.type === "withdraw").length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          ไม่มีรายการถอนเงิน
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  ยังไม่มีประวัติธุรกรรม
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* ไดอะล็อกสำหรับฝากเงิน */}
      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ฝากเงิน</DialogTitle>
            <DialogDescription>
              กรอกจำนวนเงินและเลือกวิธีการฝากเงิน
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="amount">จำนวนเงิน</Label>
              <Input
                id="amount"
                type="number"
                placeholder="จำนวนเงิน"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="deposit-method">วิธีการฝากเงิน</Label>
              <Tabs defaultValue="bank" className="mt-1" onValueChange={setDepositMethod}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="bank">บัญชีธนาคาร</TabsTrigger>
                  <TabsTrigger value="promptpay">พร้อมเพย์</TabsTrigger>
                </TabsList>
                
                <TabsContent value="bank" className="border rounded-lg p-3 mt-2">
                  {isLoadingDepositAccounts ? (
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : depositAccounts ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">ชื่อธนาคาร:</span>
                        <span className="font-medium">{depositAccounts.bank.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">เลขบัญชี:</span>
                        <span className="font-medium">{depositAccounts.bank.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">ชื่อบัญชี:</span>
                        <span className="font-medium">{depositAccounts.bank.accountName}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-red-500 p-2">
                      ไม่สามารถโหลดข้อมูลบัญชีธนาคารได้
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="promptpay" className="border rounded-lg p-3 mt-2">
                  {isLoadingDepositAccounts ? (
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : depositAccounts ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">เบอร์พร้อมเพย์:</span>
                        <span className="font-medium">{depositAccounts.promptpay.number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">เลขประจำตัวผู้เสียภาษี:</span>
                        <span className="font-medium">{depositAccounts.promptpay.taxId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">ชื่อ:</span>
                        <span className="font-medium">{depositAccounts.promptpay.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-red-500 p-2">
                      ไม่สามารถโหลดข้อมูลพร้อมเพย์ได้
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            <div>
              <Label htmlFor="payment-proof">อัพโหลดหลักฐานการโอนเงิน</Label>
              <div className="border rounded-lg p-4 mt-1 text-center flex flex-col items-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => document.getElementById('file-upload')?.click()}>
                <div id="upload-placeholder">
                  <PlusCircle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">คลิกเพื่ออัพโหลดรูปภาพ</p>
                  <p className="text-xs text-muted-foreground mt-1">ขนาดไฟล์ไม่เกิน 5MB</p>
                </div>
                <img 
                  id="payment-proof-preview"
                  src="#" 
                  alt="Payment proof preview" 
                  className="max-h-40 hidden"
                />
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const file = e.target.files[0];
                      setPaymentProof(file);
                      
                      // แสดงภาพตัวอย่าง
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          const previewImg = document.getElementById('payment-proof-preview') as HTMLImageElement;
                          if (previewImg) {
                            previewImg.src = event.target.result.toString();
                            previewImg.classList.remove('hidden');
                          }
                          document.getElementById('upload-placeholder')?.classList.add('hidden');
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDepositDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleDeposit}
              disabled={!amount || !paymentProof || depositMutation.isPending}
            >
              {depositMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                "ฝากเงิน"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* ไดอะล็อกสำหรับถอนเงิน */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ถอนเงิน</DialogTitle>
            <DialogDescription>
              กรอกจำนวนเงินเพื่อถอนไปยังบัญชีธนาคารที่ผูกไว้
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="amount">จำนวนเงิน</Label>
              <Input
                id="amount"
                type="number"
                placeholder="จำนวนเงิน"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
              {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                  <span>ค่าธรรมเนียม (3%):</span>
                  <span>{formatCurrency(parseFloat(amount) * 0.03)}</span>
                </div>
              )}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>บัญชีธนาคารสำหรับการถอนเงิน</Label>
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-xs"
                  onClick={() => setShowManageBankDialog(true)}
                >
                  จัดการบัญชี
                </Button>
              </div>
              
              {isLoadingBankAccounts ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : bankAccounts && bankAccounts.length > 0 ? (
                <div className="border rounded-lg p-3">
                  {/* แสดงบัญชีธนาคารที่ถูกตั้งเป็นค่าเริ่มต้น หรือบัญชีแรกถ้าไม่มีบัญชีเริ่มต้น */}
                  {(() => {
                    const defaultAccount = bankAccounts.find(acc => acc.isDefault);
                    const accountToShow = defaultAccount || bankAccounts[0];
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">ธนาคาร:</span>
                          <span className="font-medium">{accountToShow.bankName}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-muted-foreground">เลขบัญชี:</span>
                          <span className="font-medium">{accountToShow.accountNumber}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-muted-foreground">ชื่อบัญชี:</span>
                          <span className="font-medium">{accountToShow.accountName}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">คุณยังไม่มีบัญชีธนาคารสำหรับการถอนเงิน</p>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      setShowWithdrawDialog(false);
                      setShowAddBankAccountDialog(true);
                    }}
                  >
                    เพิ่มบัญชีธนาคาร
                  </Button>
                </div>
              )}
            </div>
            
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
              <div className="p-3 border rounded-lg bg-muted/50">
                <div className="text-sm">สรุปรายการ</div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm">จำนวนเงินที่ถอน:</span>
                  <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm">หักค่าธรรมเนียม (3%):</span>
                  <span className="font-medium text-red-500">- {formatCurrency(parseFloat(amount) * 0.03)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="font-medium">รับเงินสุทธิ:</span>
                  <span className="font-bold">{formatCurrency(parseFloat(amount) * 0.97)}</span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWithdrawDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleWithdraw}
              disabled={
                !amount || 
                isNaN(parseFloat(amount)) || 
                parseFloat(amount) <= 0 ||
                !bankAccounts || 
                bankAccounts.length === 0 ||
                withdrawWithSavedAccountMutation.isPending
              }
            >
              {withdrawWithSavedAccountMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                "ถอนเงิน"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <BottomNavigation />
    </MobileContainer>
  );
}
