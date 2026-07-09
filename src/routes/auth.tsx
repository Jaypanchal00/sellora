import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Sellora" },
      { name: "description", content: "Sign in or create your Sellora account." },
    ],
  }),
});

const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" }).max(255);
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(128);

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const search = Route.useSearch();
  
  // "signin" or "signup"
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: search.redirect, replace: true });
  }, [user, navigate, search.redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailParse = emailSchema.safeParse(email);
    if (!emailParse.success) return toast.error(emailParse.error.issues[0].message);
    
    const passParse = passwordSchema.safeParse(password);
    if (!passParse.success) return toast.error(passParse.error.issues[0].message);

    setLoading(true);

    if (mode === "signup") {
      if (!fullName.trim()) {
        setLoading(false);
        return toast.error("Please enter your full name");
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: emailParse.data,
        password: passParse.data,
        options: {
          data: { full_name: fullName.trim() },
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        // Sign out immediately to prevent auto-login
        await supabase.auth.signOut();
        toast.success("Account created successfully! Please sign in.");
        setMode("signin");
        setPassword(""); // Clear password for security
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailParse.data,
        password: passParse.data,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password. Please create an account first if you don't have one.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Welcome back to Sellora!");
      }
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${search.redirect}` },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[1000px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Side - Branding (Hidden on mobile) */}
        <div className="hidden md:flex md:w-5/12 bg-blue-600 p-12 flex-col justify-between relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500 opacity-50 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-blue-400 opacity-50 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm mb-6">
              <span className="font-bold text-2xl leading-none mt-[-2px]">S</span>
            </div>
            <h1 className="text-white text-4xl font-extrabold tracking-tight mb-4">
              {mode === "signin" ? "Welcome back to Sellora." : "Join the Sellora community."}
            </h1>
            <p className="text-blue-100 text-lg">
              {mode === "signin" 
                ? "Discover great deals, connect with sellers, and buy with confidence."
                : "Create an account to start buying and selling locally with thousands of users."}
            </p>
          </div>
          
          <div className="relative z-10 text-blue-200 text-sm font-medium">
            © {new Date().getFullYear()} Sellora Inc.
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full md:w-7/12 p-8 md:p-16 flex flex-col justify-center bg-white relative">
          <div className="max-w-[400px] w-full mx-auto">
            
            {/* Mobile Logo */}
            <div className="flex md:hidden h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm mb-8">
              <span className="font-bold text-2xl leading-none mt-[-2px]">S</span>
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              {mode === "signin" ? "Sign in" : "Create an account"}
            </h2>
            <p className="text-slate-500 mb-8">
              {mode === "signin" 
                ? "Don't have an account?" 
                : "Already have an account?"}{" "}
              <button 
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-blue-600 font-bold hover:underline"
              >
                {mode === "signin" ? "Create one" : "Sign in"}
              </button>
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-bold">Full Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      required 
                      className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus-visible:ring-blue-600"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-bold">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus-visible:ring-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-bold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus-visible:ring-blue-600"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base mt-2 shadow-sm transition-all"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {mode === "signin" ? "Sign In" : "Create Account"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Or continue with</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Button 
              type="button" 
              variant="outline" 
              onClick={handleGoogle} 
              disabled={loading} 
              className="w-full h-12 mt-6 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold shadow-sm"
            >
              <GoogleIcon />
              Continue with Google
            </Button>
            
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.12A6.99 6.99 0 0 1 5.47 12c0-.74.13-1.45.36-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.96l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
