import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Check, Pencil, Trash2 } from "lucide-react";
import { BankAccount } from "@shared/schema";
import { Separator } from "@/components/ui/separator";

// Component to add a new bank account
export function AddBankAccountDialog({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void 
}) {
  const { toast } = useToast();
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("กสิกรไทย");
  const [accountName, setAccountName] = useState("");
  
  // ดึงข้อมูลบัญชีธนาคารที่ผูกไว้
  const {
    data: bankAccounts,
  } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
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
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const resetForm = () => {
    setBankAccount("");
    setBankName("กสิกรไทย");
    setAccountName("");
  };
  
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
    
    // ตรวจสอบจำนวนบัญชีที่มีอยู่ (สูงสุดไม่เกิน 2 บัญชี)
    if (bankAccounts && bankAccounts.length >= 2) {
      toast({
        title: "ไม่สามารถเพิ่มบัญชีได้",
        description: "คุณสามารถเพิ่มบัญชีได้สูงสุด 2 บัญชีเท่านั้น กรุณาลบบัญชีเดิมก่อน",
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มบัญชีธนาคาร</DialogTitle>
          <DialogDescription>
            เพิ่มบัญชีธนาคารสำหรับรับเงินเมื่อถอน (สูงสุด 2 บัญชี)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="bank-name">ธนาคาร</Label>
            <select 
              id="bank-name"
              className="w-full p-2 border rounded-md"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
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
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="เลขที่บัญชี 10 หลัก"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="account-name">ชื่อบัญชี</Label>
            <Input
              id="account-name"
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="ชื่อเจ้าของบัญชี"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            onClick={handleAddBankAccount}
            disabled={addBankAccountMutation.isPending}
            className="w-full"
          >
            {addBankAccountMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังเพิ่มบัญชี</>
            ) : (
              "เพิ่มบัญชีธนาคาร"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component to edit an existing bank account
export function EditBankAccountDialog({ 
  open, 
  onOpenChange,
  account
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  account: BankAccount | null;
}) {
  const { toast } = useToast();
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("กสิกรไทย");
  const [accountName, setAccountName] = useState("");
  
  // Update form values when account changes
  useEffect(() => {
    if (account) {
      setBankName(account.bankName);
      setBankAccount(account.accountNumber);
      setAccountName(account.accountName);
    }
  }, [account]);
  
  // Mutation สำหรับแก้ไขบัญชีธนาคาร
  const editBankAccountMutation = useMutation({
    mutationFn: async (data: { 
      id: number;
      bankName: string; 
      accountNumber: string; 
      accountName: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/bank-accounts/${data.id}`, {
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      toast({
        title: "แก้ไขบัญชีธนาคารสำเร็จ",
        description: "บัญชีธนาคารได้รับการแก้ไขเรียบร้อยแล้ว",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleEditBankAccount = () => {
    if (!account) return;
    
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
    
    editBankAccountMutation.mutate({
      id: account.id,
      bankName,
      accountNumber: bankAccount,
      accountName
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>แก้ไขบัญชีธนาคาร</DialogTitle>
          <DialogDescription>
            แก้ไขข้อมูลบัญชีธนาคารของคุณ
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="bank-name">ธนาคาร</Label>
            <select 
              id="bank-name"
              className="w-full p-2 border rounded-md"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
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
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="เลขที่บัญชี 10 หลัก"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="account-name">ชื่อบัญชี</Label>
            <Input
              id="account-name"
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="ชื่อเจ้าของบัญชี"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleEditBankAccount}
            disabled={editBankAccountMutation.isPending}
          >
            {editBankAccountMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังบันทึก</>
            ) : (
              "บันทึกการแก้ไข"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component to manage bank accounts
export function ManageBankAccountsDialog({
  open,
  onOpenChange,
  onAddNewClick
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNewClick: () => void;
}) {
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  
  // ดึงข้อมูลบัญชีธนาคารที่ผูกไว้
  const {
    data: bankAccounts,
    isLoading: isLoadingBankAccounts,
    error: bankAccountsError,
    refetch: refetchBankAccounts
  } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
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
  
  const handleEdit = (account: BankAccount) => {
    setSelectedAccount(account);
    setShowEditDialog(true);
  };
  
  const handleDelete = (accountId: number) => {
    if (confirm("คุณต้องการลบบัญชีธนาคารนี้ใช่หรือไม่?")) {
      deleteBankAccountMutation.mutate(accountId);
    }
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>จัดการบัญชีธนาคาร</DialogTitle>
            <DialogDescription>
              จัดการบัญชีธนาคารสำหรับรับเงินเมื่อถอน (สูงสุด 2 บัญชี)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {isLoadingBankAccounts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : bankAccountsError ? (
              <div className="text-center text-red-500 py-6">
                เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
              </div>
            ) : !bankAccounts || bankAccounts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">คุณยังไม่มีบัญชีธนาคารที่บันทึกไว้</p>
                <Button onClick={onAddNewClick}>
                  <Plus className="mr-2 h-4 w-4" /> เพิ่มบัญชีใหม่
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {bankAccounts.map((account) => (
                  <div 
                    key={account.id}
                    className={`p-3 border rounded-lg ${account.isDefault ? 'border-primary' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium flex items-center">
                          {account.bankName}
                          {account.isDefault && (
                            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              บัญชีหลัก
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {account.accountNumber}
                        </div>
                        <div className="text-sm">
                          {account.accountName}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {!account.isDefault && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDefaultBankAccountMutation.mutate(account.id)}
                            disabled={setDefaultBankAccountMutation.isPending}
                            title="ตั้งเป็นบัญชีหลัก"
                          >
                            {setDefaultBankAccountMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <div className="text-sm text-muted-foreground mt-2">
                          *หากต้องการแก้ไขหรือลบบัญชี กรุณาติดต่อแอดมิน
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {bankAccounts.length < 2 && (
                  <div className="text-center pt-2">
                    <Button 
                      variant="outline" 
                      onClick={onAddNewClick}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" /> เพิ่มบัญชีใหม่
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <EditBankAccountDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        account={selectedAccount}
      />
    </>
  );
}

// Component to select a bank account for withdrawal
export function BankAccountSelector({
  bankAccounts,
  selectedId,
  onSelect,
  onManageClick,
  onAddNewClick
}: {
  bankAccounts: BankAccount[] | undefined;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onManageClick: () => void;
  onAddNewClick: () => void;
}) {
  if (!bankAccounts || bankAccounts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground mb-3">คุณยังไม่มีบัญชีธนาคารที่บันทึกไว้</p>
        <Button onClick={onAddNewClick} variant="outline">
          <Plus className="mr-2 h-4 w-4" /> เพิ่มบัญชีใหม่
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-2 mb-4">
      <Label>เลือกบัญชีที่บันทึกไว้</Label>
      <div className="space-y-2">
        {bankAccounts.map((account) => (
          <div 
            key={account.id}
            onClick={() => onSelect(account.id)}
            className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center ${
              selectedId === account.id ? 'border-primary bg-primary/10' : ''
            }`}
          >
            <div>
              <div className="font-medium">
                {account.bankName} 
                {account.isDefault && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    บัญชีหลัก
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {account.accountNumber} ({account.accountName})
              </div>
            </div>
            {selectedId === account.id && (
              <Check className="text-primary h-5 w-5" />
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-3">
        <Button 
          variant="outline" 
          size="sm"
          type="button" 
          onClick={onManageClick}
        >
          จัดการบัญชี
        </Button>
      </div>
      
      {selectedId && (
        <>
          <Separator className="my-4" />
          <div className="text-center text-sm text-muted-foreground">
            บัญชีที่เลือก: {bankAccounts.find(acc => acc.id === selectedId)?.bankName} - {bankAccounts.find(acc => acc.id === selectedId)?.accountNumber}
          </div>
        </>
      )}
    </div>
  );
}