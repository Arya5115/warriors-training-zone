import React from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderSuccess() {
  const { state } = useLocation();
  const order = state?.order;
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mx-auto"><CheckCircle2 className="w-10 h-10" /></div>
      <h1 className="font-display text-4xl md:text-5xl mt-6">Order Confirmed!</h1>
      <p className="text-muted-foreground mt-3">Your order has been placed. Warriors gear is on the way.</p>
      {order && (
        <div className="mt-8 p-6 rounded-2xl border border-border text-left inline-block min-w-[300px]">
          <div className="text-xs uppercase text-muted-foreground">Transaction ID</div>
          <div className="font-mono text-sm">{order.txn_id}</div>
          <div className="text-xs uppercase text-muted-foreground mt-3">Amount Paid</div>
          <div className="font-bold text-red-500 text-2xl">â¹{order.total}</div>
        </div>
      )}
      <div className="mt-8 flex gap-3 justify-center">
        <Link to="/dashboard/orders"><Button className="btn-primary rounded-full" data-testid="view-orders-btn"><Package className="w-4 h-4 mr-2" /> Track Order</Button></Link>
        <Link to="/marketplace"><Button variant="outline" className="rounded-full" data-testid="continue-shopping">Continue Shopping <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
      </div>
    </div>
  );
}
