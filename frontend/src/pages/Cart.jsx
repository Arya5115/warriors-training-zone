import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";

export default function Cart() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(null);

  const applyCoupon = async () => {
    if (!coupon) return;
    try {
      const { data } = await api.get(`/coupons/validate/${coupon}`);
      if (cart.subtotal < data.min_amount) return toast.error(`Minimum order â¹${data.min_amount} required`);
      setApplied(data);
      toast.success("Coupon applied!");
    } catch { toast.error("Invalid coupon"); }
  };

  const discount = applied ? (applied.discount_type === "percentage" ? cart.subtotal * applied.value / 100 : applied.value) : 0;
  const gst = Math.round((cart.subtotal - discount) * 0.18);
  const total = Math.max(0, Math.round(cart.subtotal - discount + gst));

  const checkout = () => {
    if (!user) { toast.error("Sign in first"); navigate("/login"); return; }
    if (!cart.items.length) return toast.error("Cart is empty");
    navigate("/checkout", { state: { coupon: applied?.code } });
  };

  if (!cart.items.length) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-4xl">Your cart is empty</h1>
        <p className="text-muted-foreground mt-2">Explore the marketplace to fuel your training.</p>
        <Link to="/marketplace"><Button className="btn-primary rounded-full mt-6" data-testid="shop-now-btn">Shop Now</Button></Link>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
      <h1 className="font-display text-4xl mb-8">Your Cart</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {cart.items.map((it) => {
            const price = Math.round(it.product.price * (1 - (it.product.discount || 0) / 100));
            return (
              <div key={it.product.id} className="flex gap-4 p-4 rounded-2xl border border-border" data-testid={`cart-item-${it.product.id}`}>
                <img src={it.product.images[0]} alt={it.product.name} className="w-24 h-24 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="text-xs uppercase text-muted-foreground">{it.product.brand}</div>
                  <div className="font-semibold">{it.product.name}</div>
                  <div className="text-red-500 font-bold mt-1">â¹{price} Ã {it.quantity} = â¹{price * it.quantity}</div>
                </div>
                <button onClick={async () => { await cart.removeFromCart(it.product.id); toast.success("Removed"); }} className="text-muted-foreground hover:text-red-500 transition-colors" data-testid={`remove-${it.product.id}`}><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>
        <div className="rounded-2xl border border-border p-6 h-fit sticky top-24">
          <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={`â¹${Math.round(cart.subtotal)}`} />
            {applied && <Row label={`Coupon ${applied.code}`} value={`â â¹${Math.round(discount)}`} highlight />}
            <Row label="GST (18%)" value={`â¹${gst}`} />
            <div className="border-t border-border pt-3 mt-3 flex justify-between font-bold text-lg"><span>Total</span><span>â¹{total}</span></div>
          </div>
          <div className="mt-4 flex gap-2">
            <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" data-testid="coupon-input" />
            <Button variant="outline" onClick={applyCoupon} data-testid="apply-coupon">Apply</Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Try: <code className="text-yellow-600">WARRIOR10</code>, <code className="text-yellow-600">IRON20</code></div>
          <Button onClick={checkout} className="btn-primary w-full rounded-full mt-5 h-11" data-testid="checkout-btn">Checkout <ChevronRight className="w-4 h-4 ml-1" /></Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className={highlight ? "text-green-600 font-semibold" : ""}>{value}</span></div>;
}
