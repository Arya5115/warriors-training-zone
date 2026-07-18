import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { CreditCard, MapPin, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { api } from "@/services/api";
import { formatCurrency } from "@/utils/currency";

export default function Checkout() {
  const cart = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [addr, setAddr] = useState({ name: "", phone: "", line1: "", city: "", pincode: "", state: "" });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("address");

  const submit = async () => {
    if (!addr.name || !addr.phone || !addr.line1 || !addr.city || !addr.pincode) {
      return toast.error("Fill all address fields");
    }
    setLoading(true);
    setStep("payment");
    toast.info("Redirecting to PhonePe...");
    await new Promise((r) => setTimeout(r, 1200));
    try {
      const items = cart.items.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));
      const { data } = await api.post("/checkout", {
        items,
        address: addr,
        coupon_code: location.state?.coupon || null,
        payment_method: "phonepe",
      });
      toast.success("Payment Successful!");
      navigate("/order-success", { state: { order: data.order } });
    } catch {
      toast.error("Payment failed");
      setStep("address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-12">
      <h1 className="font-display text-4xl mb-8">Checkout</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {step === "address" && (
            <div className="rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2 font-semibold">
                <MapPin className="w-4 h-4 text-red-500" /> Shipping Address
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <Input placeholder="Full Name" value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} data-testid="addr-name" />
                <Input placeholder="Phone" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} data-testid="addr-phone" />
                <Input placeholder="Address Line" className="md:col-span-2" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} data-testid="addr-line" />
                <Input placeholder="City" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} data-testid="addr-city" />
                <Input placeholder="State" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} data-testid="addr-state" />
                <Input placeholder="Pincode" value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value })} data-testid="addr-pincode" />
              </div>
              <Button onClick={submit} disabled={loading} className="btn-primary w-full rounded-full h-11" data-testid="place-order-btn">
                <CreditCard className="w-4 h-4 mr-2" /> {loading ? "Processing..." : "Pay with PhonePe"}
              </Button>
            </div>
          )}
          {step === "payment" && (
            <div className="rounded-2xl border border-border p-10 text-center">
              <div className="w-16 h-16 rounded-full mx-auto border-4 border-red-500 border-t-transparent animate-spin" />
              <div className="mt-4 font-semibold">Contacting PhonePe...</div>
              <div className="text-sm text-muted-foreground">Do not close this window</div>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border p-6 h-fit">
          <h3 className="font-semibold mb-4">Summary</h3>
          <div className="space-y-2 text-sm">
            {cart.items.map((i) => (
              <div key={i.product.id} className="flex justify-between">
                <span className="line-clamp-1">{i.product.name} x {i.quantity}</span>
                <span>{formatCurrency(Math.round(i.product.price * (1 - (i.product.discount || 0) / 100)) * i.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-3 mt-3 flex justify-between font-bold">
              <span>Subtotal</span>
              <span>{formatCurrency(Math.round(cart.subtotal))}</span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3 h-3 text-green-500" /> Secure PhonePe checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
