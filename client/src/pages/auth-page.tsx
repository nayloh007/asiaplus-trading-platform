import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth, registerSchema } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { loginSchema } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { MobileContainer } from "@/components/layout/mobile-container";
import { TopNavigation } from "@/components/layout/top-navigation";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { loginMutation, registerMutation, user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to home if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  // สร้างคลาสร่วมสำหรับ Input และ FormLabel
  const inputClasses = "border-[#06C755]/50 focus-visible:ring-[#06C755] bg-white/80 backdrop-blur-sm rounded-md shadow-sm";
  const labelClasses = "text-blue-600 font-medium";

  return (
    <MobileContainer>
      <TopNavigation />
      <div className="p-4 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]" 
            style={{
              backgroundColor: "#f5f7fa",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat"
            }}>
        <Card className="w-full max-w-md mx-auto border border-blue-400/40 bg-white/90 backdrop-blur-lg shadow-xl rounded-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <img 
                src="/images/asia_plus_logo.png" 
                alt="โลโก้ Asia Plus Securities" 
                className="h-20"
              />
            </div>
            <CardTitle className="text-2xl text-blue-600">
              {activeTab === "login" ? "ยินดีต้อนรับกลับ" : "สร้างบัญชีใหม่"}
            </CardTitle>
            <CardDescription>
              {activeTab === "login"
                ? "เข้าสู่ระบบเพื่อซื้อขายคริปโทเคอร์เรนซี"
                : "เริ่มต้นการเดินทางในโลกคริปโทกับเรา"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="login"
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "login" | "register")}
            >
              <TabsList className="grid grid-cols-2 mb-4 bg-white/60 p-1 rounded-lg border border-blue-400/30">
                <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-600">เข้าสู่ระบบ</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-600">สมัครสมาชิก</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm 
                  isLoading={loginMutation.isPending} 
                  onSubmit={(data) => loginMutation.mutate(data)} 
                  inputClasses={inputClasses}
                  labelClasses={labelClasses}
                />
              </TabsContent>

              <TabsContent value="register">
                <RegisterForm 
                  isLoading={registerMutation.isPending} 
                  onSubmit={(data) => registerMutation.mutate(data)} 
                  inputClasses={inputClasses}
                  labelClasses={labelClasses}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MobileContainer>
  );
}

function LoginForm({ 
  onSubmit, 
  isLoading,
  inputClasses,
  labelClasses
}: { 
  onSubmit: (data: z.infer<typeof loginSchema>) => void;
  isLoading: boolean;
  inputClasses: string;
  labelClasses: string;
}) {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClasses}>ชื่อผู้ใช้</FormLabel>
              <FormControl>
                <Input 
                  placeholder="กรอกชื่อผู้ใช้ของคุณ" 
                  {...field} 
                  className={inputClasses} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClasses}>รหัสผ่าน</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className={inputClasses} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-[#06C755] hover:bg-[#05A747]" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังเข้าสู่ระบบ...
            </>
          ) : (
            "เข้าสู่ระบบ"
          )}
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm({ 
  onSubmit, 
  isLoading,
  inputClasses,
  labelClasses
}: { 
  onSubmit: (data: z.infer<typeof registerSchema>) => void;
  isLoading: boolean;
  inputClasses: string;
  labelClasses: string;
}) {
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClasses}>ชื่อ-นามสกุล</FormLabel>
              <FormControl>
                <Input placeholder="สมชาย ใจดี" {...field} className={inputClasses} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClasses}>ชื่อผู้ใช้</FormLabel>
              <FormControl>
                <Input placeholder="somchai" {...field} className={inputClasses} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClasses}>อีเมล</FormLabel>
              <FormControl>
                <Input type="email" placeholder="somchai@example.com" {...field} className={inputClasses} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClasses}>รหัสผ่าน</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className={inputClasses} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClasses}>ยืนยันรหัสผ่าน</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className={inputClasses} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-[#06C755] hover:bg-[#05A747]" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังสร้างบัญชี...
            </>
          ) : (
            "สมัครสมาชิก"
          )}
        </Button>
      </form>
    </Form>
  );
}
