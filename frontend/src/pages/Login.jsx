import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dumbbell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) { toast.success("Welcome back, warrior!"); navigate("/dashboard"); }
    else toast.error(res.error);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative">
        <img src="https://images.pexels.com/photos/30283458/pexels-photo-30283458.jpeg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/90 to-black/40" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-600 to-red-900"><Dumbbell className="w-5 h-5" /></div>
            <span className="font-display text-2xl">WARRIORS</span>
          </Link>
          <div>
            <h2 className="font-display text-5xl leading-tight">Discipline is <span className="gold-text">freedom.</span></h2>
            <p className="text-neutral-300 mt-4 max-w-md">Log in to track your progress, manage your membership, and continue your transformation.</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="font-display text-4xl">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your Warriors account</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required data-testid="login-email" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Password</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required data-testid="login-password" className="mt-1" />
            </div>
            <Button type="submit" disabled={loading} className="btn-primary w-full rounded-full h-11" data-testid="login-submit">{loading ? "Signing in..." : "Sign In"}</Button>
          </form>
          <div className="text-xs text-center text-muted-foreground mt-4">
            <Link to="/forgot-password" className="hover:text-foreground">Forgot password?</Link>
          </div>
          <div className="text-sm text-center mt-6">New here? <Link to="/signup" className="text-red-500 font-semibold">Create an account</Link></div>
          <div className="mt-8 p-4 rounded-xl bg-muted text-xs text-muted-foreground">
            <div className="font-semibold text-foreground mb-1">Demo credentials</div>
            Admin: admin@warriors.com / Admin@123<br />
            User: user@warriors.com / User@123
          </div>
        </div>
      </div>
    </div>
  );
}
