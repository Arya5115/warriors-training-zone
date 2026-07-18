import React, { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Package, ShoppingBag, CreditCard, Dumbbell, LogOut } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";

const links = [
  { to: "/admin", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/products", icon: Package, label: "Products" },
  { to: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { to: "/admin/payments", icon: CreditCard, label: "Payments" },
];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr] bg-background">
      <aside className="border-r border-border bg-card p-6 hidden md:flex md:flex-col">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="p-2 rounded-xl bg-gradient-to-br from-red-600 to-red-900"><Dumbbell className="w-5 h-5 text-white" /></div>
          <div>
            <div className="font-display text-xl">WARRIORS</div>
            <div className="text-[10px] uppercase tracking-widest text-yellow-500">Admin</div>
          </div>
        </Link>
        <nav className="space-y-1 flex-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} data-testid={`admin-nav-${l.label.toLowerCase()}`} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-red-500/10 text-red-500" : "hover:bg-muted"}`}>
              <l.icon className="w-4 h-4" /> {l.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={async () => { await logout(); navigate("/"); }} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-muted"><LogOut className="w-4 h-4" /> Logout</button>
      </aside>
      <div className="p-6 md:p-10">
        <Routes>
          <Route index element={<Stats />} />
          <Route path="users" element={<UsersTab />} />
          <Route path="products" element={<ProductsTab />} />
          <Route path="orders" element={<OrdersTab />} />
          <Route path="payments" element={<PaymentsTab />} />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
      </div>
    </div>
  );
}

function Stats() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/admin/stats").then((r) => setS(r.data)); }, []);
  if (!s) return <div>Loading...</div>;
  const cards = [
    { label: "Revenue", value: `â¹${s.revenue.toLocaleString()}`, color: "from-red-500 to-red-900" },
    { label: "Orders", value: s.orders, color: "from-yellow-500 to-yellow-800" },
    { label: "Users", value: s.users, color: "from-emerald-500 to-emerald-800" },
    { label: "Active Members", value: s.active_members, color: "from-blue-500 to-blue-800" },
  ];
  return (
    <div>
      <h1 className="font-display text-4xl mb-6">Dashboard</h1>
      <div className="grid md:grid-cols-4 gap-5">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl p-6 text-white bg-gradient-to-br ${c.color}`} data-testid={`stat-${c.label.toLowerCase()}`}>
            <div className="text-xs uppercase tracking-widest opacity-80">{c.label}</div>
            <div className="font-display text-4xl mt-2">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-border p-6">
        <h3 className="font-semibold mb-4">Revenue (last 14 days)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={s.revenue_series}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Line type="monotone" dataKey="amount" stroke="#dc2626" strokeWidth={2.5} dot={{ fill: "#d4af37" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const load = () => api.get("/admin/users").then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);
  const setRole = async (id, role) => { await api.put(`/admin/users/${id}/role`, { role }); toast.success("Role updated"); load(); };
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Users ({users.length})</h1>
      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Tier</th><th className="text-left p-3">Role</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border" data-testid={`admin-user-${u.id}`}>
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3 uppercase text-xs">{u.membership_tier}</td>
                <td className="p-3">
                  <Select value={u.role} onValueChange={(v) => setRole(u.id, v)}>
                    <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{["admin","staff","trainer","user"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", category: "Supplements", brand: "", price: 0, discount: 0, stock: 0, description: "", images: [""], featured: false });
  const load = () => api.get("/products?limit=200").then((r) => setProducts(r.data.items));
  useEffect(() => { load(); }, []);
  const create = async () => {
    if (!form.name || !form.price) return toast.error("Fill required fields");
    await api.post("/products", { ...form, price: parseFloat(form.price), discount: parseFloat(form.discount)||0, stock: parseInt(form.stock)||0 });
    toast.success("Product created");
    setForm({ ...form, name: "", price: 0, stock: 0, description: "" });
    load();
  };
  const del = async (id) => { await api.delete(`/products/${id}`); toast.success("Deleted"); load(); };
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Products ({products.length})</h1>
      <div className="rounded-2xl border border-border p-5 mb-6">
        <h3 className="font-semibold mb-3">Add Product</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} data-testid="prod-name" />
          <Input placeholder="Brand" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} data-testid="prod-brand" />
          <Input placeholder="Category" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} data-testid="prod-cat" />
          <Input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} data-testid="prod-price" />
          <Input placeholder="Discount %" type="number" value={form.discount} onChange={(e) => setForm({...form, discount: e.target.value})} data-testid="prod-disc" />
          <Input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} data-testid="prod-stock" />
          <Input placeholder="Image URL" value={form.images[0]} onChange={(e) => setForm({...form, images: [e.target.value]})} className="md:col-span-2" />
          <Button onClick={create} className="btn-primary rounded-full" data-testid="add-product-btn">Add Product</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border p-4">
            <img src={p.images[0]} alt="" className="w-full h-32 rounded-lg object-cover" />
            <div className="font-semibold mt-2 line-clamp-1">{p.name}</div>
            <div className="text-xs text-muted-foreground">{p.brand} Â· â¹{p.price} Â· Stock: {p.stock}</div>
            <Button size="sm" variant="destructive" onClick={() => del(p.id)} className="mt-2 w-full" data-testid={`del-prod-${p.id}`}>Delete</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const load = () => api.get("/orders").then((r) => setOrders(r.data));
  useEffect(() => { load(); }, []);
  const setStatus = async (id, status) => { await api.post(`/orders/${id}/status`, { status }); toast.success("Status updated"); load(); };
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Orders ({orders.length})</h1>
      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="text-left p-3">Txn</th><th className="text-left p-3">Items</th><th className="text-left p-3">Total</th><th className="text-left p-3">Status</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{o.txn_id}</td>
                <td className="p-3">{o.items.length}</td>
                <td className="p-3 font-bold">â¹{o.total}</td>
                <td className="p-3">
                  <Select value={o.status} onValueChange={(v) => setStatus(o.id, v)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{["confirmed","processing","shipped","delivered","cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsTab() {
  const [pays, setPays] = useState([]);
  useEffect(() => { api.get("/admin/payments").then((r) => setPays(r.data)); }, []);
  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Payments ({pays.length})</h1>
      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="text-left p-3">Txn</th><th className="text-left p-3">Type</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th></tr></thead>
          <tbody>
            {pays.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{p.txn_id}</td>
                <td className="p-3 uppercase text-xs">{p.type}</td>
                <td className="p-3 font-bold">â¹{p.amount}</td>
                <td className="p-3"><span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
