import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export default function Membership() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/memberships/plans").then((r) => setPlans(r.data));
  }, []);

  const purchase = async (plan) => {
    if (!user) {
      toast.error("Please sign in to purchase");
      navigate("/login");
      return;
    }
    setLoading(plan.id);
    try {
      // simulated PhonePe flow
      toast.info("Redirecting to PhonePe...");
      await new Promise((r) => setTimeout(r, 900));
      const { data } = await api.post("/memberships/purchase", { plan_id: plan.id });
      toast.success(`Payment Successful! Txn: ${data.txn_id}`);
      navigate("/dashboard/membership");
    } catch (e) {
      toast.error("Payment failed. Try again.");
    } finally {
      setLoading(null);
    }
  };

  const cardClass = (tier) => {
    if (tier === "silver") return "card-silver";
    if (tier === "gold") return "card-gold";
    if (tier === "platinum") return "card-platinum";
    return "bg-card border border-border";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-2">Membership</div>
        <h1 className="font-display text-5xl md:text-6xl">Choose your <span className="crimson-text">warrior path</span></h1>
        <p className="text-muted-foreground mt-4">All plans include gym access, locker, showers, and community events.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
        {plans.map((p) => (
          <div key={p.id} className={`rounded-3xl p-6 flex flex-col shadow-xl ${cardClass(p.tier)}`} data-testid={`plan-card-${p.id}`}>
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.25em] opacity-80">{p.tier}</div>
              {p.tier === "gold" && <div className="text-xs px-2 py-1 rounded-full bg-black/20 backdrop-blur flex items-center gap-1"><Sparkles className="w-3 h-3" /> Popular</div>}
            </div>
            <div className="font-display text-3xl mt-2">{p.name}</div>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-bold">â¹{p.price}</span>
              <span className="text-sm opacity-70 mb-1">/ {p.duration_days}d</span>
            </div>
            <ul className="mt-6 space-y-2 flex-1">
              {p.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span>{b}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={() => purchase(p)}
              disabled={loading === p.id}
              data-testid={`plan-buy-${p.id}`}
              className={`mt-6 rounded-full font-semibold ${p.tier === "platinum" ? "btn-gold" : "bg-black text-white hover:bg-black/80"}`}
            >
              {loading === p.id ? "Processing..." : p.price === 0 ? "Start Trial" : "Buy Now"}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center text-sm text-muted-foreground">
        Payments powered by <span className="font-semibold text-foreground">PhonePe</span> (simulated). Real integration ready.
      </div>
    </div>
  );
}
