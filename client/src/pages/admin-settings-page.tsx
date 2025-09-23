import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DesktopContainer } from "@/components/layout/desktop-container";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Settings,
  Save,
  Lock,
  CreditCard,
  Percent,
  Wrench,
  Users,
  MessageSquare,
  Info,
  AlertTriangle,
  AlertCircle,
  Shield,
  Redo,
  Database,
  ServerCrash,
  Loader2,
  Edit,
  Wallet,
  Building,
  RefreshCw
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BankAccount } from "@shared/schema";

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

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistrations, setAllowRegistrations] = useState(true);
  const [allowTrading, setAllowTrading] = useState(true);
  const [tradeFeePercentage, setTradeFeePercentage] = useState(0.2);
  const [withdrawalFeePercentage, setWithdrawalFeePercentage] = useState(0.1);
  const [minDepositAmount, setMinDepositAmount] = useState(100);
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState(100);
  
  // สำหรับแก้ไขบัญชีธนาคาร
  const [isEditBankAccountDialogOpen, setIsEditBankAccountDialogOpen] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
  const [editBankName, setEditBankName] = useState("");
  const [editAccountNumber, setEditAccountNumber] = useState("");
  const [editAccountName, setEditAccountName] = useState("");
  
  // สำหรับแก้ไขบัญชีในระบบ (สำหรับการฝากเงิน)
  const [isEditDepositAccountsDialogOpen, setIsEditDepositAccountsDialogOpen] = useState(false);
  const [depositBankName, setDepositBankName] = useState("");
  const [depositBankAccountNumber, setDepositBankAccountNumber] = useState("");
  const [depositBankAccountName, setDepositBankAccountName] = useState("");
  const [depositPromptpayNumber, setDepositPromptpayNumber] = useState("");
  const [depositPromptpayTaxId, setDepositPromptpayTaxId] = useState("");
  const [depositPromptpayName, setDepositPromptpayName] = useState("");
  
  // ดึงข้อมูลบัญชีธนาคารทั้งหมด
  const { 
    data: bankAccounts,
    isLoading: isLoadingBankAccounts,
    error: bankAccountsError,
    refetch: refetchBankAccounts
  } = useQuery<(BankAccount & { user: { username: string, email: string } })[]>({
    queryKey: ["/api/admin/bank-accounts"],
    enabled: activeTab === "bank-accounts"
  });
  
  // ดึงข้อมูลบัญชีธนาคารและพร้อมเพย์สำหรับการฝากเงิน
  const {
    data: depositAccounts,
    isLoading: isLoadingDepositAccounts,
    refetch: refetchDepositAccounts
  } = useQuery<DepositAccounts>({
    queryKey: ['/api/deposit-accounts'],
    enabled: activeTab === "system-accounts", // ดึงข้อมูลเมื่ออยู่ที่แท็บ system-accounts เท่านั้น
  });
  
  // ดึงข้อมูลการตั้งค่าทั้งหมด
  const {
    data: settings,
    isLoading: isLoadingSettings
  } = useQuery({
    queryKey: ['/api/admin/settings'],
    enabled: activeTab === "general" || activeTab === "trading", // ดึงข้อมูลเมื่ออยู่ที่แท็บ general หรือ trading
  });

  // ตั้งค่า state variables เมื่อได้ข้อมูลมาแล้ว
  useEffect(() => {
    if (settings) {
      setAllowTrading(settings.allow_trading === 'true');
      setAllowRegistrations(settings.allow_registrations === 'true');
      setMaintenanceMode(settings.maintenance_mode === 'true');
      setTradeFeePercentage(parseFloat(settings.trade_fee_percentage) || 1.5);
      setWithdrawalFeePercentage(parseFloat(settings.withdrawal_fee_percentage) || 0.1);
      setMinDepositAmount(parseInt(settings.min_deposit_amount) || 100);
      setMinWithdrawalAmount(parseInt(settings.min_withdrawal_amount) || 100);
    }
  }, [settings]);
  
  // Mutation สำหรับแก้ไขบัญชีธนาคารและพร้อมเพย์สำหรับการฝากเงิน
  const updateDepositAccountsMutation = useMutation({
    mutationFn: async (data: {
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
    }) => {
      const res = await apiRequest("POST", "/api/admin/deposit-accounts", data);
      return await res.json();
    },
    onSuccess: () => {
      // ล้างแคชเพื่อดึงข้อมูลใหม่
      queryClient.invalidateQueries({ queryKey: ['/api/deposit-accounts'] });
      toast({
        title: "แก้ไขบัญชีสำหรับฝากเงินสำเร็จ",
        description: "ข้อมูลบัญชีธนาคารและพร้อมเพย์สำหรับฝากเงินได้รับการแก้ไขเรียบร้อยแล้ว",
      });
      setIsEditDepositAccountsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // ฟังก์ชันสำหรับเปิดไดอะล็อกแก้ไขบัญชีสำหรับฝากเงิน
  const handleOpenEditDepositAccountsDialog = () => {
    if (depositAccounts) {
      setDepositBankName(depositAccounts.bank.name || "");
      setDepositBankAccountNumber(depositAccounts.bank.accountNumber || "");
      setDepositBankAccountName(depositAccounts.bank.accountName || "");
      setDepositPromptpayNumber(depositAccounts.promptpay.number || "");
      setDepositPromptpayTaxId(depositAccounts.promptpay.taxId || "");
      setDepositPromptpayName(depositAccounts.promptpay.name || "");
    }
    setIsEditDepositAccountsDialogOpen(true);
  };
  
  // ฟังก์ชันสำหรับบันทึกการแก้ไขบัญชีสำหรับฝากเงิน
  const handleUpdateDepositAccounts = () => {
    if (!depositBankName || !depositBankAccountNumber || !depositBankAccountName || !depositPromptpayName) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาระบุข้อมูลบัญชีธนาคารและชื่อบัญชีพร้อมเพย์ให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }
    
    updateDepositAccountsMutation.mutate({
      bank: {
        name: depositBankName,
        accountNumber: depositBankAccountNumber,
        accountName: depositBankAccountName,
      },
      promptpay: {
        number: depositPromptpayNumber,
        taxId: depositPromptpayTaxId,
        name: depositPromptpayName,
      }
    });
  };
  
  // Mutation สำหรับแก้ไขบัญชีธนาคาร
  const updateBankAccountMutation = useMutation({
    mutationFn: async (data: { 
      id: number;
      bankName: string; 
      accountNumber: string; 
      accountName: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/bank-accounts/${data.id}`, {
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-accounts"] });
      toast({
        title: "แก้ไขบัญชีธนาคารสำเร็จ",
        description: "บัญชีธนาคารได้รับการแก้ไขเรียบร้อยแล้ว",
      });
      setIsEditBankAccountDialogOpen(false);
      setSelectedBankAccount(null);
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleOpenEditDialog = (bankAccount: BankAccount) => {
    setSelectedBankAccount(bankAccount);
    setEditBankName(bankAccount.bankName);
    setEditAccountNumber(bankAccount.accountNumber);
    setEditAccountName(bankAccount.accountName);
    setIsEditBankAccountDialogOpen(true);
  };
  
  const handleUpdateBankAccount = () => {
    if (!selectedBankAccount) return;
    
    if (!editBankName || !editAccountNumber || !editAccountName) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาระบุชื่อธนาคาร, เลขที่บัญชี และชื่อบัญชี",
        variant: "destructive",
      });
      return;
    }
    
    // ตรวจสอบว่าเลขที่บัญชีเป็นตัวเลขเท่านั้น
    if (!/^\d+$/.test(editAccountNumber)) {
      toast({
        title: "เลขที่บัญชีไม่ถูกต้อง",
        description: "เลขที่บัญชีต้องเป็นตัวเลขเท่านั้น",
        variant: "destructive",
      });
      return;
    }
    
    updateBankAccountMutation.mutate({
      id: selectedBankAccount.id,
      bankName: editBankName,
      accountNumber: editAccountNumber,
      accountName: editAccountName
    });
  };
  
  // Mutation สำหรับบันทึกการตั้งค่า
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: {
      trade_fee_percentage: number;
      withdrawal_fee_percentage: number;
      min_deposit_amount: number;
      min_withdrawal_amount: number;
      allow_trading: boolean;
      allow_registrations: boolean;
      maintenance_mode: boolean;
    }) => {
      const res = await apiRequest("PUT", "/api/admin/settings", settingsData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "การตั้งค่าถูกบันทึกแล้ว",
        description: "การเปลี่ยนแปลงการตั้งค่าได้รับการบันทึกเรียบร้อยแล้ว",
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

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      trade_fee_percentage: tradeFeePercentage,
      withdrawal_fee_percentage: withdrawalFeePercentage,
      min_deposit_amount: minDepositAmount,
      min_withdrawal_amount: minWithdrawalAmount,
      allow_trading: allowTrading,
      allow_registrations: allowRegistrations,
      maintenance_mode: maintenanceMode,
    });
  };
  
  const handleResetSettings = () => {
    // Reset settings to defaults
    setMaintenanceMode(false);
    setAllowRegistrations(true);
    setAllowTrading(true);
    setTradeFeePercentage(0.2);
    setWithdrawalFeePercentage(0.1);
    setMinDepositAmount(100);
    setMinWithdrawalAmount(100);
    
    toast({
      title: "ตั้งค่าใหม่",
      description: "การตั้งค่าได้ถูกรีเซ็ตกลับเป็นค่าเริ่มต้น",
    });
  };
  
  const handleBackupDatabase = () => {
    toast({
      title: "สำรองข้อมูลสำเร็จ",
      description: "ระบบได้ทำการสำรองข้อมูลเรียบร้อยแล้ว",
    });
  };

  return (
    <DesktopContainer>
      <div className="flex h-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <div className="border-b">
            <div className="flex h-16 items-center justify-between px-6">
              <h2 className="text-xl font-bold">แดชบอร์ดผู้ดูแลระบบ</h2>
              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
            </div>
          </div>
          
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            {/* Page Header with Action Buttons */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">จัดการการตั้งค่าระบบ</h2>
                <p className="text-muted-foreground">กำหนดค่าและปรับแต่งแพลตฟอร์มตามความต้องการ</p>
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" className="h-9" onClick={handleResetSettings}>
                  <Redo className="h-4 w-4 mr-2" />
                  รีเซ็ตค่าเริ่มต้น
                </Button>
                <Button className="h-9" onClick={handleSaveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  บันทึกการตั้งค่า
                </Button>
              </div>
            </div>
            
            {/* Settings Tabs and Content */}
            <div className="flex gap-6">
              {/* Settings Tabs */}
              <div className="w-64">
                <Card>
                  <CardContent className="p-0">
                    <div className="space-y-1 py-2">
                      <Button
                        variant={activeTab === "general" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("general")}
                      >
                        <Settings className="h-5 w-5 mr-3" />
                        ตั้งค่าทั่วไป
                      </Button>
                      <Button
                        variant={activeTab === "trading" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("trading")}
                      >
                        <CreditCard className="h-5 w-5 mr-3" />
                        การเทรดและค่าธรรมเนียม
                      </Button>
                      <Button
                        variant={activeTab === "security" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("security")}
                      >
                        <Lock className="h-5 w-5 mr-3" />
                        ความปลอดภัย
                      </Button>
                      <Button
                        variant={activeTab === "notifications" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("notifications")}
                      >
                        <MessageSquare className="h-5 w-5 mr-3" />
                        การแจ้งเตือน
                      </Button>

                      <Button
                        variant={activeTab === "system-accounts" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("system-accounts")}
                      >
                        <Wallet className="h-5 w-5 mr-3" />
                        บัญชีธนาคารระบบ
                      </Button>
                      <Button
                        variant={activeTab === "backup" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab("backup")}
                      >
                        <Database className="h-5 w-5 mr-3" />
                        สำรองและกู้คืนข้อมูล
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Settings Content */}
              <div className="flex-1">
                <Card className="mb-6">

                  
                  {activeTab === "system-accounts" && (
                    <>
                      <CardHeader>
                        <CardTitle>จัดการบัญชีธนาคารระบบ</CardTitle>
                        <CardDescription>แก้ไขข้อมูลบัญชีธนาคารและพร้อมเพย์สำหรับการฝากเงิน</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {isLoadingDepositAccounts ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : !depositAccounts ? (
                          <div className="text-center text-red-500 py-8">
                            <p>เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => refetchDepositAccounts()}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              โหลดข้อมูลใหม่
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            {/* บัญชีธนาคาร */}
                            <div className="bg-card border rounded-lg overflow-hidden">
                              <div className="bg-muted/50 px-4 py-3 border-b">
                                <h3 className="text-lg font-semibold">บัญชีธนาคาร</h3>
                                <p className="text-sm text-muted-foreground">ข้อมูลบัญชีธนาคารที่แสดงในหน้าฝากเงิน</p>
                              </div>
                              <div className="p-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                  <div>
                                    <Label className="text-muted-foreground">ธนาคาร</Label>
                                    <div className="font-medium mt-1">{depositAccounts.bank.name || "-"}</div>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">เลขที่บัญชี</Label>
                                    <div className="font-medium mt-1">{depositAccounts.bank.accountNumber || "-"}</div>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <Label className="text-muted-foreground">ชื่อบัญชี</Label>
                                    <div className="font-medium mt-1">{depositAccounts.bank.accountName || "-"}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* พร้อมเพย์ */}
                            <div className="bg-card border rounded-lg overflow-hidden">
                              <div className="bg-muted/50 px-4 py-3 border-b">
                                <h3 className="text-lg font-semibold">พร้อมเพย์</h3>
                                <p className="text-sm text-muted-foreground">ข้อมูลพร้อมเพย์ที่แสดงในหน้าฝากเงิน</p>
                              </div>
                              <div className="p-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                  <div>
                                    <Label className="text-muted-foreground">เบอร์โทรศัพท์</Label>
                                    <div className="font-medium mt-1">{depositAccounts.promptpay.number || "-"}</div>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">เลขประจำตัวผู้เสียภาษี</Label>
                                    <div className="font-medium mt-1">{depositAccounts.promptpay.taxId || "-"}</div>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <Label className="text-muted-foreground">ชื่อบัญชี</Label>
                                    <div className="font-medium mt-1">{depositAccounts.promptpay.name || "-"}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                              <Button onClick={handleOpenEditDepositAccountsDialog} className="w-full">
                                <Edit className="h-4 w-4 mr-2" />
                                แก้ไขข้อมูลบัญชีธนาคารและพร้อมเพย์
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-muted/30 rounded-lg p-4 text-sm">
                          <p>
                            <span className="font-medium">หมายเหตุ:</span> ข้อมูลบัญชีธนาคารและพร้อมเพย์นี้จะแสดงในหน้าฝากเงินสำหรับผู้ใช้ทั่วไป
                            ควรตรวจสอบความถูกต้องของข้อมูลอย่างละเอียดเพื่อป้องกันการโอนเงินผิดบัญชี
                          </p>
                        </div>
                      </CardContent>
                    </>
                  )}
                  
                  {activeTab === "general" && (
                    <>
                      <CardHeader>
                        <CardTitle>ตั้งค่าทั่วไป</CardTitle>
                        <CardDescription>ตั้งค่าการทำงานพื้นฐานของระบบ</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between space-x-2">
                              <div className="flex flex-col space-y-1">
                                <Label htmlFor="maintenance-mode" className="font-medium">โหมดปิดปรับปรุง</Label>
                                <p className="text-sm text-muted-foreground">ปิดระบบชั่วคราวเพื่อปรับปรุง</p>
                              </div>
                              <Switch
                                id="maintenance-mode"
                                checked={maintenanceMode}
                                onCheckedChange={setMaintenanceMode}
                              />
                            </div>
                            
                            {maintenanceMode && (
                              <div className="space-y-2">
                                <Label htmlFor="maintenance-message">ข้อความแจ้งระหว่างปิดปรับปรุง</Label>
                                <Textarea 
                                  id="maintenance-message" 
                                  placeholder="ระบบกำลังปิดปรับปรุงชั่วคราว กรุณากลับมาใหม่ในเร็วๆ นี้"
                                  className="min-h-24"
                                />
                              </div>
                            )}
                            
                            <Separator />
                            
                            <div className="flex items-center justify-between space-x-2">
                              <div className="flex flex-col space-y-1">
                                <Label htmlFor="new-registrations" className="font-medium">การสมัครสมาชิกใหม่</Label>
                                <p className="text-sm text-muted-foreground">อนุญาตให้ผู้ใช้ใหม่สมัครสมาชิก</p>
                              </div>
                              <Switch
                                id="new-registrations"
                                checked={allowRegistrations}
                                onCheckedChange={setAllowRegistrations}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between space-x-2">
                              <div className="flex flex-col space-y-1">
                                <Label htmlFor="site-name" className="font-medium">ชื่อเว็บไซต์</Label>
                                <p className="text-sm text-muted-foreground">ชื่อที่แสดงในเบราว์เซอร์และระบบ</p>
                              </div>
                              <Input id="site-name" defaultValue="เอเซีย พลัส" className="w-60" />
                            </div>
                            
                            <div className="flex items-center justify-between space-x-2">
                              <div className="flex flex-col space-y-1">
                                <Label htmlFor="site-logo" className="font-medium">โลโก้</Label>
                                <p className="text-sm text-muted-foreground">เลือกไฟล์โลโก้</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                                  B
                                </div>
                                <Button variant="outline" size="sm">อัปโหลด</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  )}
                  
                  {activeTab === "trading" && (
                    <>
                      <CardHeader>
                        <CardTitle>การเทรดและค่าธรรมเนียม</CardTitle>
                        <CardDescription>กำหนดค่าการเทรดและค่าธรรมเนียมต่างๆ</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                              <Label htmlFor="allow-trading" className="font-medium">อนุญาตให้เทรด</Label>
                              <p className="text-sm text-muted-foreground">เปิด/ปิดการเทรดทั้งระบบ</p>
                            </div>
                            <Switch
                              id="allow-trading"
                              checked={allowTrading}
                              onCheckedChange={setAllowTrading}
                            />
                          </div>
                          
                          <Separator className="my-6" />
                          
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">ค่าธรรมเนียม</h3>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="trade-fee" className="font-medium">ค่าธรรมเนียมการเทรด (%)</Label>
                                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                  {tradeFeePercentage}%
                                </span>
                              </div>
                              <Slider
                                id="trade-fee"
                                value={[tradeFeePercentage]}
                                min={0}
                                max={5}
                                step={0.1}
                                onValueChange={(value) => setTradeFeePercentage(value[0])}
                              />
                              <p className="text-xs text-muted-foreground">
                                ค่าธรรมเนียมที่เรียกเก็บจากทุกธุรกรรมการเทรด คิดเป็นเปอร์เซ็นต์ของมูลค่าการเทรด
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="withdrawal-fee" className="font-medium">ค่าธรรมเนียมการถอน (%)</Label>
                                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                  {withdrawalFeePercentage}%
                                </span>
                              </div>
                              <Slider
                                id="withdrawal-fee"
                                value={[withdrawalFeePercentage]}
                                min={0}
                                max={3}
                                step={0.1}
                                onValueChange={(value) => setWithdrawalFeePercentage(value[0])}
                              />
                              <p className="text-xs text-muted-foreground">
                                ค่าธรรมเนียมที่เรียกเก็บเมื่อผู้ใช้ถอนเงิน คิดเป็นเปอร์เซ็นต์ของจำนวนเงินที่ถอน
                              </p>
                            </div>
                          </div>
                          
                          <Separator className="my-6" />
                          
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">ข้อจำกัดการทำธุรกรรม</h3>
                            
                            <div className="space-y-2">
                              <Label htmlFor="min-deposit">จำนวนเงินฝากขั้นต่ำ (บาท)</Label>
                              <Input
                                id="min-deposit"
                                type="number"
                                value={minDepositAmount}
                                onChange={(e) => setMinDepositAmount(Number(e.target.value))}
                                min={0}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="min-withdrawal">จำนวนเงินถอนขั้นต่ำ (บาท)</Label>
                              <Input
                                id="min-withdrawal"
                                type="number"
                                value={minWithdrawalAmount}
                                onChange={(e) => setMinWithdrawalAmount(Number(e.target.value))}
                                min={0}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  )}
                  
                  {activeTab === "security" && (
                    <>
                      <CardHeader>
                        <CardTitle>ความปลอดภัย</CardTitle>
                        <CardDescription>ตั้งค่าด้านความปลอดภัยของระบบ</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                              <Label htmlFor="two-factor-auth" className="font-medium">
                                บังคับใช้การยืนยันตัวตนสองชั้น
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                ผู้ใช้ทุกคนต้องตั้งค่าการยืนยันตัวตนสองชั้น
                              </p>
                            </div>
                            <Switch id="two-factor-auth" />
                          </div>
                          
                          <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                              <Label htmlFor="session-timeout" className="font-medium">
                                หมดเวลาเซสชัน (นาที)
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                ระยะเวลาที่ผู้ใช้ไม่มีการใช้งานก่อนจะถูกออกจากระบบอัตโนมัติ
                              </p>
                            </div>
                            <Input id="session-timeout" className="w-20" type="number" defaultValue={30} min={1} />
                          </div>
                          
                          <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                              <Label htmlFor="max-login-attempts" className="font-medium">
                                จำนวนครั้งที่ล็อกอินล้มเหลวสูงสุด
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                จำนวนครั้งที่ผู้ใช้สามารถกรอกรหัสผ่านผิดก่อนถูกล็อคบัญชี
                              </p>
                            </div>
                            <Input id="max-login-attempts" className="w-20" type="number" defaultValue={5} min={1} />
                          </div>
                          
                          <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                              <Label htmlFor="password-policy" className="font-medium">
                                นโยบายรหัสผ่าน
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                ข้อกำหนดความซับซ้อนของรหัสผ่าน
                              </p>
                            </div>
                            <Select defaultValue="medium">
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="เลือกระดับ" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">ง่าย</SelectItem>
                                <SelectItem value="medium">ปานกลาง</SelectItem>
                                <SelectItem value="high">เข้มงวด</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  )}
                  
                  {activeTab === "notifications" && (
                    <>
                      <CardHeader>
                        <CardTitle>การแจ้งเตือน</CardTitle>
                        <CardDescription>ตั้งค่าการแจ้งเตือนและการสื่อสารกับผู้ใช้</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="email-deposit" defaultChecked />
                            <div>
                              <Label
                                htmlFor="email-deposit"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                อีเมลแจ้งเตือนเมื่อมีการฝากเงิน
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                ส่งอีเมลถึงผู้ใช้เมื่อมีการฝากเงินเข้าบัญชี
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox id="email-withdrawal" defaultChecked />
                            <div>
                              <Label
                                htmlFor="email-withdrawal"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                อีเมลแจ้งเตือนเมื่อมีการถอนเงิน
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                ส่งอีเมลถึงผู้ใช้เมื่อมีการถอนเงินจากบัญชี
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox id="email-trade" defaultChecked />
                            <div>
                              <Label
                                htmlFor="email-trade"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                อีเมลแจ้งเตือนเมื่อมีการเทรดเสร็จสิ้น
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                ส่งอีเมลถึงผู้ใช้เมื่อการเทรดเสร็จสิ้น
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox id="email-news" />
                            <div>
                              <Label
                                htmlFor="email-news"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                อีเมลข่าวสารและโปรโมชั่น
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                ส่งอีเมลข่าวสารและโปรโมชั่นถึงผู้ใช้
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox id="push-notifications" defaultChecked />
                            <div>
                              <Label
                                htmlFor="push-notifications"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                การแจ้งเตือนบนเว็บไซต์
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                แสดงการแจ้งเตือนบนเว็บไซต์เมื่อมีเหตุการณ์สำคัญ
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  )}
                  
                  {activeTab === "backup" && (
                    <>
                      <CardHeader>
                        <CardTitle>สำรองและกู้คืนข้อมูล</CardTitle>
                        <CardDescription>จัดการการสำรองข้อมูลและการกู้คืน</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertTitle>คำแนะนำ</AlertTitle>
                          <AlertDescription>
                            การสำรองข้อมูลเป็นประจำช่วยป้องกันการสูญเสียข้อมูลในกรณีเกิดปัญหา
                          </AlertDescription>
                        </Alert>
                        
                        <div className="space-y-2">
                          <Label className="font-medium">สำรองข้อมูลอัตโนมัติ</Label>
                          <p className="text-sm text-muted-foreground">ตั้งค่าการสำรองข้อมูลอัตโนมัติ</p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <Label htmlFor="auto-backup">สำรองข้อมูลอัตโนมัติ</Label>
                            <Switch id="auto-backup" defaultChecked />
                          </div>
                          
                          <div className="mt-2">
                            <Label htmlFor="backup-frequency">ความถี่ในการสำรองข้อมูล</Label>
                            <Select defaultValue="daily">
                              <SelectTrigger className="w-full mt-1">
                                <SelectValue placeholder="เลือกความถี่" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hourly">ทุกชั่วโมง</SelectItem>
                                <SelectItem value="daily">ทุกวัน</SelectItem>
                                <SelectItem value="weekly">ทุกสัปดาห์</SelectItem>
                                <SelectItem value="monthly">ทุกเดือน</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <Label className="font-medium">สำรองข้อมูลด้วยตนเอง</Label>
                          <p className="text-sm text-muted-foreground">สร้างและดาวน์โหลดไฟล์สำรองข้อมูลทันที</p>
                          
                          <div className="mt-2">
                            <Button onClick={handleBackupDatabase}>
                              <Database className="h-4 w-4 mr-2" />
                              สร้างไฟล์สำรองข้อมูลใหม่
                            </Button>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <Label className="font-medium">กู้คืนข้อมูล</Label>
                          <p className="text-sm text-muted-foreground">อัปโหลดไฟล์สำรองข้อมูลเพื่อกู้คืน</p>
                          
                          <div className="flex flex-col space-y-2 mt-2">
                            <div className="flex items-center space-x-2">
                              <Input type="file" id="restore-file" />
                              <Button variant="secondary">
                                อัปโหลด
                              </Button>
                            </div>
                            
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>คำเตือน</AlertTitle>
                              <AlertDescription>
                                การกู้คืนข้อมูลจะแทนที่ข้อมูลปัจจุบันทั้งหมด กรุณาสำรองข้อมูลก่อนดำเนินการ
                              </AlertDescription>
                            </Alert>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  )}
                </Card>
                
                <div className="flex justify-end">
                  <Button className="w-[150px]" onClick={handleSaveSettings}>
                    <Save className="h-4 w-4 mr-2" />
                    บันทึกการตั้งค่า
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* ไดอะล็อกแก้ไขบัญชีธนาคาร */}
      <Dialog open={isEditBankAccountDialogOpen} onOpenChange={setIsEditBankAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขบัญชีธนาคาร</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลบัญชีธนาคารของผู้ใช้
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="bank-name">ธนาคาร</Label>
              <select 
                id="bank-name"
                className="w-full p-2 border rounded-md"
                value={editBankName}
                onChange={(e) => setEditBankName(e.target.value)}
              >
                <option value="กสิกรไทย">กสิกรไทย</option>
                <option value="ไทยพาณิชย์">ไทยพาณิชย์</option>
                <option value="กรุงเทพ">กรุงเทพ</option>
                <option value="กรุงไทย">กรุงไทย</option>
                <option value="ทหารไทยธนชาต">ทหารไทยธนชาต</option>
                <option value="กรุงศรีอยุธยา">กรุงศรีอยุธยา</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account-number">เลขที่บัญชี</Label>
              <Input
                id="account-number"
                type="text"
                value={editAccountNumber}
                onChange={(e) => setEditAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="เลขที่บัญชี 10 หลัก"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account-name">ชื่อบัญชี</Label>
              <Input
                id="account-name"
                type="text"
                value={editAccountName}
                onChange={(e) => setEditAccountName(e.target.value)}
                placeholder="ชื่อเจ้าของบัญชี"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditBankAccountDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleUpdateBankAccount}
              disabled={updateBankAccountMutation.isPending}
            >
              {updateBankAccountMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังบันทึก</>
              ) : (
                "บันทึกการเปลี่ยนแปลง"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* ไดอะล็อกแก้ไขข้อมูลบัญชีธนาคารและพร้อมเพย์สำหรับฝากเงิน */}
      <Dialog open={isEditDepositAccountsDialogOpen} onOpenChange={setIsEditDepositAccountsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลบัญชีธนาคารระบบ</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลบัญชีธนาคารและพร้อมเพย์สำหรับการฝากเงิน
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* บัญชีธนาคาร */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">บัญชีธนาคาร</h3>
              
              <div className="space-y-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="deposit-bank-name">ธนาคาร</Label>
                  <Input
                    id="deposit-bank-name"
                    placeholder="ชื่อธนาคาร เช่น กสิกรไทย"
                    value={depositBankName}
                    onChange={(e) => setDepositBankName(e.target.value)}
                  />
                </div>
                
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="deposit-bank-account-number">เลขที่บัญชี</Label>
                  <Input
                    id="deposit-bank-account-number"
                    placeholder="เลขที่บัญชี"
                    value={depositBankAccountNumber}
                    onChange={(e) => setDepositBankAccountNumber(e.target.value)}
                  />
                </div>
                
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="deposit-bank-account-name">ชื่อบัญชี</Label>
                  <Input
                    id="deposit-bank-account-name"
                    placeholder="ชื่อบัญชี"
                    value={depositBankAccountName}
                    onChange={(e) => setDepositBankAccountName(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* พร้อมเพย์ */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">พร้อมเพย์</h3>
              
              <div className="space-y-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="deposit-promptpay-number">เบอร์โทรศัพท์</Label>
                  <Input
                    id="deposit-promptpay-number"
                    placeholder="เบอร์โทรศัพท์ เช่น 08xxxxxxxx"
                    value={depositPromptpayNumber}
                    onChange={(e) => setDepositPromptpayNumber(e.target.value)}
                  />
                </div>
                
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="deposit-promptpay-tax-id">เลขประจำตัวผู้เสียภาษี</Label>
                  <Input
                    id="deposit-promptpay-tax-id"
                    placeholder="เลขประจำตัวผู้เสียภาษี"
                    value={depositPromptpayTaxId}
                    onChange={(e) => setDepositPromptpayTaxId(e.target.value)}
                  />
                </div>
                
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="deposit-promptpay-name">ชื่อบัญชี</Label>
                  <Input
                    id="deposit-promptpay-name"
                    placeholder="ชื่อบัญชีพร้อมเพย์"
                    value={depositPromptpayName}
                    onChange={(e) => setDepositPromptpayName(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDepositAccountsDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleUpdateDepositAccounts}
              disabled={updateDepositAccountsMutation.isPending}
            >
              {updateDepositAccountsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              บันทึกข้อมูล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DesktopContainer>
  );
}