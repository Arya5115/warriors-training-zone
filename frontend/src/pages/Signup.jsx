import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dumbbell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function Signup() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (res.ok) { toast.success("Welcome to Warriors!"); navigate("/dashboard"); }
    else toast.error(res.error);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8 order-2 md:order-1">
        <div className="w-full max-w-md">
          <h1 className="font-display text-4xl">Join Warriors</h1>
          <p className="text-muted-foreground text-sm mt-1">Start your transformation today</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest">Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="signup-name" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required data-testid="signup-email" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="signup-phone" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest">Password (min 6)</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required data-testid="signup-password" className="mt-1" />
            </div>
            <Button type="submit" disabled={loading} className="btn-primary w-full rounded-full h-11" data-testid="signup-submit">{loading ? "Creating..." : "Create Account"}</Button>
          </form>
          <div className="text-sm text-center mt-6">Already a warrior? <Link to="/login" className="text-red-500 font-semibold">Sign in</Link></div>
        </div>
      </div>
      <div className="hidden md:block relative order-1 md:order-2">
        <img src="https://images.pexels.com/photos/10960029/pexels-photo-10960029.jpeg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-bl from-black/90 to-black/40" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2 ml-auto">
            <span className="font-display text-2xl">WARRIORS</span>
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-600 to-red-900"><Dumbbell className="w-5 h-5" /></div>
          </Link>
          <div>
            <h2 className="font-display text-5xl leading-tight">Your <span className="crimson-text">strongest</span> self starts here.</h2>
            <p className="text-neutral-300 mt-4 max-w-md">Free 7-day trial. No credit card. Full access to facilities.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
