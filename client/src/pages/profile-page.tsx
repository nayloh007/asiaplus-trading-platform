import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { TopNavigation } from "@/components/layout/top-navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, User, Lock, ChevronRight, ChevronDown, Mail, Shield, History, CreditCard, 
  Gift, Users, Crown, Calendar, Newspaper, LogOut
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Trade } from "@shared/schema";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // สถานะสำหรับการแก้ไขข้อมูลโปรไฟล์
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // ดึงข้อมูลบัญชีธนาคาร
  const { data: bankAccounts, isLoading: isBankAccountsLoading } = useQuery({
    queryKey: ["/api/bank-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/bank-accounts");
      if (!res.ok) return [];
      return res.json();
    }
  });
  
  // เมื่อผู้ใช้เข้าสู่ระบบแล้ว ดึงข้อมูลโปรไฟล์มาแสดง
  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setDisplayName(user.displayName || "");
      setPhoneNumber(user.phoneNumber || "");
    }
  }, [user]);
  
  // Mutation สำหรับเปลี่ยนรหัสผ่าน
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/user/change-password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "เปลี่ยนรหัสผ่านสำเร็จ",
        description: "รหัสผ่านของคุณได้รับการเปลี่ยนเรียบร้อยแล้ว",
      });
      setIsPasswordDialogOpen(false);
      resetPasswordForm();
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation สำหรับอัพเดทข้อมูลโปรไฟล์
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { email: string; displayName: string; phoneNumber: string }) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "อัพเดทโปรไฟล์สำเร็จ",
        description: "ข้อมูลโปรไฟล์ของคุณได้รับการอัพเดทเรียบร้อยแล้ว",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleChangePassword = () => {
    // ตรวจสอบความถูกต้องของข้อมูล
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "รหัสผ่านไม่ตรงกัน",
        description: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "รหัสผ่านสั้นเกินไป",
        description: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };
  
  const handleUpdateProfile = () => {
    if (!email) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกอีเมล",
        variant: "destructive",
      });
      return;
    }
    
    // ตรวจสอบรูปแบบอีเมล
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "อีเมลไม่ถูกต้อง",
        description: "กรุณากรอกอีเมลให้ถูกต้อง",
        variant: "destructive",
      });
      return;
    }
    
    updateProfileMutation.mutate({
      email,
      displayName,
      phoneNumber,
    });
  };
  
  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MobileContainer>
      <TopNavigation />
      
      {/* ส่วนแสดงข้อมูลโปรไฟล์พร้อมพื้นหลัง */}
      <div className="relative overflow-hidden">
        {/* ภาพพื้นหลัง */}
        <div className="absolute inset-0 w-full h-full">
          <img 
            src="https://img.freepik.com/premium-photo/bitcoin-blockchain-crypto-currency-digital-encryption-digital-money-exchange-technology-network-connections_24070-1004.jpg" 
            alt="Crypto Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60"></div>
        </div>
        
        {/* ข้อมูลโปรไฟล์ */}
        <div className="relative z-10 flex flex-col items-center py-8 px-4">
          <Avatar className="h-24 w-24 mb-3 ring-4 ring-primary/30 shadow-lg">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
            <AvatarFallback className="text-2xl bg-primary/80 text-primary-foreground">
              {user.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-white mt-2 drop-shadow-md">{user.username}</h2>
          <p className="text-white/90 drop-shadow-md">{user.email || "ไม่ได้ระบุอีเมล"}</p>
          {user.role === "admin" && (
            <div className="mt-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1 rounded-full text-xs font-medium shadow-lg border border-primary/30 flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              ผู้ดูแลระบบ
            </div>
          )}
        </div>
      </div>
      
      <div className="px-4 pb-20 mt-4">
        <Separator className="mb-4" />
        
        {/* ส่วนแสดงข้อมูลต่างๆในรูปแบบ Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {/* ส่วนข้อมูลสมาชิก */}
          <AccordionItem value="user-info">
            <AccordionTrigger className="px-3 py-3 bg-muted-foreground/5 rounded-lg font-medium">
              <div className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                <span>ข้อมูลสมาชิก</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-3">
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted py-2 px-3 flex justify-between items-center">
                  <span className="font-medium">ข้อมูลส่วนตัว</span>
                  <Button 
                    variant={isEditing ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? "บันทึก" : "แก้ไข"}
                  </Button>
                </div>
                
                <div className="p-3">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">อีเมล</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="อีเมล"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="username">ชื่อผู้ใช้</Label>
                        <Input
                          id="username"
                          type="text"
                          value={user.username}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">ไม่สามารถเปลี่ยนแปลงได้</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="displayName">ชื่อที่แสดง</Label>
                        <Input
                          id="displayName"
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="ชื่อที่แสดง"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">เบอร์โทรศัพท์</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="เบอร์โทรศัพท์"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          ยกเลิก
                        </Button>
                        <Button 
                          onClick={handleUpdateProfile}
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังบันทึก</>
                          ) : (
                            "บันทึกข้อมูล"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <User className="h-5 w-5 mr-3 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">ชื่อผู้ใช้</p>
                          <p>{user.username}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">อีเมล</p>
                          <p>{user.email || "ไม่ได้ระบุ"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <User className="h-5 w-5 mr-3 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">ชื่อที่แสดง</p>
                          <p>{user.displayName || "ไม่ได้ระบุ"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">เบอร์โทรศัพท์</p>
                          <p>{user.phoneNumber || "ไม่ได้ระบุ"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ส่วนบัญชีธนาคาร */}
          <AccordionItem value="bank-info" className="mt-2">
            <AccordionTrigger className="px-3 py-3 bg-muted-foreground/5 rounded-lg font-medium">
              <div className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                <span>บัญชีธนาคาร</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {/* ดึงข้อมูลบัญชีธนาคารจาก API */}
                <div className="rounded-lg border overflow-hidden">
                  <div className="bg-muted py-2 px-3 flex justify-between items-center">
                    <span className="font-medium">บัญชีธนาคารที่ลงทะเบียน</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = "/wallet"}
                    >
                      จัดการ
                    </Button>
                  </div>
                  
                  {isBankAccountsLoading ? (
                    <div className="p-8 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !bankAccounts || bankAccounts.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <p>ยังไม่มีบัญชีธนาคารที่ลงทะเบียน</p>
                    </div>
                  ) : (
                    <div className="p-3 divide-y">
                      {bankAccounts.map((account: any) => (
                        <div className="py-2" key={account.id}>
                          <div className="font-medium">{account.bankName}</div>
                          <div className="text-sm text-muted-foreground">{account.accountNumber}</div>
                          {account.isDefault && (
                            <Badge variant="outline" className="mt-1">บัญชีหลัก</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>คุณสามารถลงทะเบียนบัญชีธนาคารได้สูงสุด 2 บัญชี</p>
                  <p>หากต้องการเปลี่ยนแปลงข้อมูลบัญชี กรุณาติดต่อเจ้าหน้าที่</p>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = "/wallet"}
                >
                  เพิ่ม/แก้ไขบัญชีธนาคาร
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* ส่วนความปลอดภัย */}
          <AccordionItem value="security" className="mt-2">
            <AccordionTrigger className="px-3 py-3 bg-muted-foreground/5 rounded-lg font-medium">
              <div className="flex items-center">
                <Lock className="mr-2 h-5 w-5" />
                <span>ความปลอดภัย</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="divide-y">
                  <div 
                    className="flex justify-between items-center p-3 cursor-pointer"
                    onClick={() => setIsPasswordDialogOpen(true)}
                  >
                    <div className="flex items-center">
                      <Lock className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span>เปลี่ยนรหัสผ่าน</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  {user.role === "admin" && (
                    <div 
                      className="flex justify-between items-center p-3 cursor-pointer"
                      onClick={() => window.location.href = "/admin"}
                    >
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span>หน้าผู้ดูแลระบบ</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        
          {/* ส่วนประวัติการเทรด */}
          <AccordionItem value="trades" className="mt-2">
            <AccordionTrigger className="px-3 py-3 bg-muted-foreground/5 rounded-lg font-medium">
              <div className="flex items-center">
                <History className="mr-2 h-5 w-5" />
                <span>ประวัติการเทรด</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted py-2 px-3">
                  <span className="font-medium">รายการล่าสุด</span>
                </div>
                
                <div className="divide-y">
                  {/* ทดสอบแสดงข้อมูล */}
                  <div className="p-3">
                    <div className="font-medium text-sm">Bitcoin (BTC)</div>
                    <div className="text-sm text-muted-foreground">14/05/2025, 10:25</div>
                    <div className="flex items-center mt-1">
                      <div className="mr-2">
                        <Badge variant="outline" className="bg-green-50">
                          ซื้อขึ้น
                        </Badge>
                      </div>
                      <div className="text-sm">{formatCurrency(1500)}</div>
                      <div className="ml-auto">
                        <Badge className="bg-green-500 hover:bg-green-600 text-white">
                          ชนะ
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <div className="font-medium text-sm">Ethereum (ETH)</div>
                    <div className="text-sm text-muted-foreground">14/05/2025, 09:15</div>
                    <div className="flex items-center mt-1">
                      <div className="mr-2">
                        <Badge variant="outline" className="bg-red-50">
                          ซื้อลง
                        </Badge>
                      </div>
                      <div className="text-sm">{formatCurrency(2000)}</div>
                      <div className="ml-auto">
                        <Badge variant="destructive">
                          แพ้
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-muted/20">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = "/trades/history"}
                  >
                    ดูประวัติทั้งหมด
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* ส่วนโปรโมชั่น */}
          <AccordionItem value="promotions" className="mt-2">
            <AccordionTrigger className="px-3 py-3 bg-muted-foreground/5 rounded-lg font-medium">
              <div className="flex items-center">
                <Gift className="mr-2 h-5 w-5" />
                <span>โปรโมชั่น</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted py-2 px-3">
                  <span className="font-medium">โปรโมชั่นที่ใช้ได้</span>
                </div>
                
                <div className="p-3">
                  <div className="rounded-lg border p-3 mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">โบนัสวันเกิด</div>
                        <div className="text-sm text-muted-foreground">รับโบนัส 15% เมื่อเติมเงินในเดือนเกิด</div>
                      </div>
                      <Badge>มีใหม่</Badge>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">โบนัสเติมเงิน 10%</div>
                        <div className="text-sm text-muted-foreground">รับโบนัส 10% เมื่อเติมเงินขั้นต่ำ 5,000 บาท</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {/* ปุ่มออกจากระบบ */}
        <div className="mt-6">
          <Button 
            variant="outline" 
            className="w-full text-red-500 hover:text-red-600 border-red-100 hover:border-red-200 hover:bg-red-50"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังออกจากระบบ</>
            ) : (
              <><LogOut className="mr-2 h-4 w-4" /> ออกจากระบบ</>
            )}
          </Button>
        </div>
      </div>
      
      <BottomNavigation />
      
      {/* Dialog สำหรับเปลี่ยนรหัสผ่าน */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
            <DialogDescription>
              กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="current-password">รหัสผ่านปัจจุบัน</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordDialogOpen(false);
                resetPasswordForm();
              }}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังบันทึก</>
              ) : (
                "เปลี่ยนรหัสผ่าน"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileContainer>
  );
}