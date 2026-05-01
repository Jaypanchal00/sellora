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
import logo from "@/assets/sellora-logo.png";

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

const emailSchema = z.string().trim().email({ message: "Please enter a valid email" }).max(255);
const passwordSchema = z
  .string()
  .min(6, { message: "Password must be at least 6 characters" })
  .max(128);

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "phone">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: search.redirect, replace: true });
  }, [user, navigate, search.redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (mode === "phone") {
      if (!showOtp) {
        // Send Email OTP
        const { error } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        });
        if (error) {
          toast.error(error.message);
        } else {
          setShowOtp(true);
          toast.success("OTP sent to your email!");
        }
      } else {
        // Verify Email OTP
        const { error } = await supabase.auth.verifyOtp({
          email: email,
          token: otp,
          type: "email",
        });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Signed in successfully!");
        }
      }
      setLoading(false);
      return;
    }

    const emailParse = emailSchema.safeParse(email);
    if (!emailParse.success) {
      toast.error(emailParse.error.issues[0].message);
      setLoading(false);
      return;
    }
    const passParse = passwordSchema.safeParse(password);
    if (!passParse.success) {
      toast.error(passParse.error.issues[0].message);
      setLoading(false);
      return;
    }
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: emailParse.data,
        password: passParse.data,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName.trim() || emailParse.data.split("@")[0] },
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome to Sellora! You're signed in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailParse.data,
        password: passParse.data,
      });
      if (error) toast.error(error.message);
      else toast.success("Welcome back!");
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
    <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md overflow-hidden border-border/60 p-0 shadow-card">
        <div className="bg-gradient-brand px-8 py-8 text-center text-brand-foreground">
          <img src={logo} alt="Sellora" width={48} height={48} className="mx-auto h-12 w-12" />
          <h1 className="mt-3 font-display text-2xl font-extrabold">
            {mode === "signin" ? "Welcome back" : mode === "phone" ? "Sign in with Phone" : "Join Sellora"}
          </h1>
          <p className="mt-1 text-sm text-brand-foreground/85">
            {mode === "signin"
              ? "Sign in to continue your hunt"
              : mode === "phone"
              ? "We'll send an OTP to verify you"
              : "Create your free account in seconds"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-8">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full rounded-full"
          >
            <GoogleIcon /> Continue with Google
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          {mode === "phone" ? (
            <>
              {!showOtp ? (
                <div className="space-y-1.5">
                  <Label htmlFor="email_otp">Email Address</Label>
                  <Input
                    id="email_otp"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1.5 text-center">
                  <Label htmlFor="otp">Enter 6-digit OTP from your Email</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.5em]"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowOtp(false)}
                    className="text-xs text-muted-foreground hover:text-primary mt-2"
                  >
                    Change phone number
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-brand text-brand-foreground shadow-glow"
          >
            {loading ? "Please wait…" : mode === "phone" ? (showOtp ? "Verify OTP" : "Send OTP") : mode === "signin" ? "Sign in" : "Create account"}
          </Button>

          <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
            <p>
              {mode === "signin" ? "New to Sellora?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setShowOtp(false);
                }}
                className="font-semibold text-primary hover:underline"
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "phone" ? "signin" : "phone");
                setShowOtp(false);
              }}
              className="font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === "phone" ? "Sign in with Password" : "Sign in with Email OTP (No Password)"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.12A6.99 6.99 0 0 1 5.47 12c0-.74.13-1.45.36-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.96l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
