import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import logo from "@/assets/sellora-logo.png";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email({ message: "Please enter a valid email" }).max(255);
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(128);

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [method, setMethod] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: search.redirect, replace: true });
  }, [user, navigate, search.redirect]);

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailParse = emailSchema.safeParse(email);
    if (!emailParse.success) return toast.error(emailParse.error.issues[0].message);
    const passParse = passwordSchema.safeParse(password);
    if (!passParse.success) return toast.error(passParse.error.issues[0].message);

    setLoading(true);
    if (mode === "signup") {
      if (!fullName.trim()) { setLoading(false); return toast.error("Please enter your full name"); }
      const { error } = await supabase.auth.signUp({
        email: emailParse.data, password: passParse.data,
        options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: fullName.trim() } },
      });
      if (error) toast.error(error.message);
      else toast.success("Check your email for confirmation!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: emailParse.data, password: passParse.data });
      if (error) toast.error(error.message);
      else toast.success("Welcome back!");
    }
    setLoading(false);
  };

  const handleOtpAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailParse = emailSchema.safeParse(email);
    if (!emailParse.success) return toast.error(emailParse.error.issues[0].message);

    setLoading(true);
    if (!showOtp) {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailParse.data,
        options: { emailRedirectTo: `${window.location.origin}/`, data: mode === "signup" ? { full_name: fullName.trim() } : undefined }
      });
      if (error) toast.error(error.message);
      else { setShowOtp(true); toast.success("OTP code sent!"); }
    } else {
      const { error } = await supabase.auth.verifyOtp({ email: emailParse.data, token: otp, type: "email" });
      if (error) toast.error(error.message);
      else toast.success("Signed in successfully!");
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md overflow-hidden border border-border shadow-olx p-0 rounded-md">
        <div className="bg-primary px-8 py-10 text-center text-white">
          <img src={logo} alt="Sellora" className="mx-auto h-12 w-auto bg-white rounded-lg p-2" />
          <h1 className="mt-4 text-2xl font-black uppercase tracking-tight">
            {mode === "signin" ? "Welcome Back" : "Join Sellora"}
          </h1>
          <p className="mt-1 text-sm opacity-80">
            {mode === "signin" ? "Sign in to continue" : "Create your account today"}
          </p>
        </div>

        <div className="p-8">
          <Tabs value={method} onValueChange={(v) => { setMethod(v as any); setShowOtp(false); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 rounded-sm p-1 h-12">
              <TabsTrigger value="password" stroke-width="2" className="rounded-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Password</TabsTrigger>
              <TabsTrigger value="otp" className="rounded-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">OTP Code</TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <form onSubmit={handlePasswordAuth} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-gray-500">Full Name</Label>
                    <Input placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 border-2 focus:ring-primary/20" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-gray-500">Email Address</Label>
                  <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 border-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-gray-500">Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 border-2 focus:ring-primary/20" />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-sm bg-primary text-white font-black uppercase tracking-widest mt-4">
                  {loading ? "Please wait..." : mode === "signin" ? "Login" : "Register"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp">
              <form onSubmit={handleOtpAuth} className="space-y-4">
                {!showOtp ? (
                   <div className="space-y-4">
                     <div className="space-y-1.5">
                       <Label className="text-xs font-bold uppercase text-gray-500">Email Address</Label>
                       <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 border-2 focus:ring-primary/20" />
                     </div>
                     <Button type="submit" disabled={loading} className="w-full h-12 rounded-sm bg-primary text-white font-black uppercase tracking-widest">
                       {loading ? "Sending..." : "Get OTP Code"}
                     </Button>
                   </div>
                ) : (
                  <div className="space-y-6 text-center">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-gray-500">Verify Code</Label>
                      <Input type="text" maxLength={8} className="text-center text-3xl font-black h-16 border-2" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-12 rounded-sm bg-primary text-white font-black uppercase tracking-widest">
                      {loading ? "Verifying..." : "Verify & Sign In"}
                    </Button>
                    <button type="button" onClick={() => setShowOtp(false)} className="text-xs font-bold text-primary hover:underline">Resend code</button>
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-8 text-center text-sm font-medium text-gray-500">
            {mode === "signin" ? "New here?" : "Joined already?"}{" "}
            <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setShowOtp(false); }} className="font-black text-primary hover:underline">
              {mode === "signin" ? "Create an account" : "Sign in now"}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
