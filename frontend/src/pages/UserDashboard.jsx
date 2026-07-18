import React, { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, Navigate } from "react-router-dom";
import { LayoutDashboard, CreditCard, Package, Heart, User, LogOut, Dumbbell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { useNavigate } from "react-router-dom";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/dashboard/membership", icon: CreditCard, label: "Membership" },
  { to: "/dashboard/orders", icon: Package, label: "Orders" },
  { to: "/dashboard/wishlist", icon: Heart, label: "Wishlist" },
  { to: "/dashboard/profile", icon: User, label: "Profile" },
];

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr] bg-background">
      <aside className="border-r border-border bg-card p-6 hidden md:flex md:flex-col">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="p-2 rounded-xl bg-gradient-to-br from-red-600 to-red-900"><Dumbbell className="w-5 h-5 text-white" /></div>
          <div className="font-display text-xl">WARRIORS</div>
        </Link>
        <nav className="space-y-1 flex-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} data-testid={`sidebar-${l.label.toLowerCase()}`} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-red-500/10 text-red-500" : "hover:bg-muted"}`
            }><l.icon className="w-4 h-4" /> {l.label}</NavLink>
          ))}
        </nav>
        <button onClick={async () => { await logout(); navigate("/"); }} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-muted" data-testid="sidebar-logout">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </aside>
      <div className="p-6 md:p-10">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Welcome back</div>
          <h1 className="font-display text-3xl">{user.name}</h1>
        </div>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="membership" element={<MembershipTab />} />
          <Route path="orders" element={<OrdersTab />} />
          <Route path="wishlist" element={<WishlistTab />} />
          <Route path="profile" element={<ProfileTab />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState({ orders: 0, memberships: 0 });
  useEffect(() => {
    (async () => {
      const [o, m] = await Promise.all([api.get("/orders/my"), api.get("/memberships/my")]);
      setStats({ orders: o.data.length, memberships: m.data.length });
    })();
  }, []);
  return (
    <div className="grid md:grid-cols-3 gap-5">
      <StatCard label="My Orders" value={stats.orders} />
      <StatCard label="Memberships" value={stats.memberships} />
      <StatCard label="Wishlist Items" value="â" />
      <div className="md:col-span-3 rounded-2xl border border-border p-8 mt-4 bg-gradient-to-br from-red-900/10 to-transparent">
        <h3 className="font-display text-2xl">Ready for today's session?</h3>
        <p className="text-muted-foreground mt-2 text-sm">Book a trainer, track a workout, or refuel with new gear.</p>
        <div className="flex gap-3 mt-5">
          <Link to="/trainers" className="btn-primary px-5 py-2 rounded-full text-sm font-semibold">Book Trainer</Link>
          <Link to="/marketplace" className="btn-gold px-5 py-2 rounded-full text-sm font-semibold">Shop Gear</Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return <div className="rounded-2xl border border-border p-6"><div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div><div className="font-display text-4xl mt-2">{value}</div></div>;
}

function MembershipTab() {
  const [mems, setMems] = useState([]);
  useEffect(() => { api.get("/memberships/my").then((r) => setMems(r.data)); }, []);
  const cardClass = (t) => t === "silver" ? "card-silver" : t === "gold" ? "card-gold" : t === "platinum" ? "card-platinum" : "bg-muted";
  if (!mems.length) return <div className="text-center py-16"><p className="text-muted-foreground">No active membership.</p><Link to="/membership" className="btn-primary rounded-full px-6 py-2 inline-block mt-4">Buy Membership</Link></div>;
  return (
    <div className="space-y-6">
      {mems.map((m) => (
        <div key={m.id} className={`rounded-3xl p-8 shadow-2xl ${cardClass(m.tier)}`} data-testid={`membership-card-${m.tier}`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] opacity-70">Warriors Membership</div>
              <div className="font-display text-4xl mt-2">{m.plan_name}</div>
              <div className="text-sm opacity-70 mt-1">Member ID: {m.qr_code}</div>
            </div>
            <div className="w-24 h-24 rounded-2xl bg-white/90 p-2 flex items-center justify-center">
              <div className="text-[8px] font-mono text-black text-center break-all leading-tight">{m.qr_code}</div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div><div className="text-xs uppercase opacity-70">Valid Until</div><div className="font-semibold">{new Date(m.expires_at).toLocaleDateString()}</div></div>
            <div><div className="text-xs uppercase opacity-70">Status</div><div className="font-semibold uppercase">{m.status}</div></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.get("/orders/my").then((r) => setOrders(r.data)); }, []);
  if (!orders.length) return <p className="text-muted-foreground">No orders yet.</p>;
  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="rounded-2xl border border-border p-5" data-testid={`order-${o.id}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Txn {o.txn_id}</div>
              <div className="text-sm">{new Date(o.created_at).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 uppercase">{o.status}</span>
              <span className="font-bold text-lg">â¹{o.total}</span>
            </div>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto">
            {o.items.map((i) => (
              <div key={i.product_id} className="flex-shrink-0 w-32">
                <img src={i.image} alt="" className="w-32 h-32 rounded-xl object-cover" />
                <div className="text-xs mt-2 line-clamp-2">{i.name}</div>
                <div className="text-xs text-muted-foreground">Qty {i.quantity}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function WishlistTab() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/wishlist").then((r) => setItems(r.data)); }, []);
  if (!items.length) return <p className="text-muted-foreground">Your wishlist is empty.</p>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
      {items.map((p) => (
        <Link key={p.id} to={`/product/${p.id}`} className="rounded-2xl border border-border overflow-hidden hover:border-red-500/40 transition-colors">
          <img src={p.images[0]} alt="" className="w-full aspect-square object-cover" />
          <div className="p-4"><div className="font-semibold text-sm line-clamp-2">{p.name}</div><div className="text-red-500 font-bold mt-1">â¹{Math.round(p.price * (1 - (p.discount||0)/100))}</div></div>
        </Link>
      ))}
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  return (
    <div className="rounded-2xl border border-border p-6 max-w-lg">
      <h3 className="font-semibold mb-4">Profile</h3>
      <div className="space-y-3 text-sm">
        <div><span className="text-muted-foreground">Name:</span> <span className="font-medium ml-2">{user.name}</span></div>
        <div><span className="text-muted-foreground">Email:</span> <span className="font-medium ml-2">{user.email}</span></div>
        <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium ml-2">{user.phone || "â"}</span></div>
        <div><span className="text-muted-foreground">Role:</span> <span className="font-medium ml-2 uppercase">{user.role}</span></div>
        <div><span className="text-muted-foreground">Tier:</span> <span className="font-medium ml-2 uppercase text-yellow-600">{user.membership_tier}</span></div>
      </div>
    </div>
  );
}
