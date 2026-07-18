import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Heart, Search, SlidersHorizontal, Star, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/services/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function Marketplace() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const cart = useCart();
  const { user } = useAuth();

  const category = params.get("category") || "all";
  const q = params.get("q") || "";
  const sort = params.get("sort") || "featured";

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (category !== "all") p.set("category", category);
    if (q) p.set("q", q);
    if (sort) p.set("sort", sort);
    const { data } = await api.get(`/products?${p.toString()}`);
    setProducts(data.items);
    setLoading(false);
  }, [category, q, sort]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get("/products/categories").then((r) => setCategories(r.data)); }, []);

  const setParam = (k, v) => {
    const np = new URLSearchParams(params);
    if (v && v !== "all") np.set(k, v); else np.delete(k);
    setParams(np);
  };

  const handleAdd = async (p) => {
    if (!user) return toast.error("Sign in to add items to cart");
    await cart.addToCart(p.id, 1);
    toast.success(`${p.name} added to cart`);
  };
  const handleWishlist = async (p) => {
    if (!user) return toast.error("Sign in to save to wishlist");
    await cart.toggleWishlist(p.id);
    toast.success(cart.inWishlist(p.id) ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-14">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-2">Marketplace</div>
        <h1 className="font-display text-5xl md:text-6xl">Fuel. Gear. <span className="gold-text">Greatness.</span></h1>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products..." defaultValue={q} onKeyDown={(e) => e.key === "Enter" && setParam("q", e.target.value)} className="pl-10 rounded-full" data-testid="marketplace-search" />
        </div>
        <Select value={category} onValueChange={(v) => setParam("category", v)}>
          <SelectTrigger className="w-[180px] rounded-full" data-testid="marketplace-category"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
          <SelectTrigger className="w-[180px] rounded-full" data-testid="marketplace-sort"><SlidersHorizontal className="w-3 h-3 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low â High</SelectItem>
            <SelectItem value="price_desc">Price: High â Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => {
            const price = Math.round(p.price * (1 - (p.discount || 0) / 100));
            return (
              <div key={p.id} className="group rounded-2xl border border-border overflow-hidden bg-card hover:border-red-500/40 transition-colors" data-testid={`product-card-${p.id}`}>
                <Link to={`/product/${p.id}`} className="block relative aspect-square overflow-hidden bg-muted">
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {p.discount > 0 && <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">-{p.discount}%</div>}
                  <button onClick={(e) => { e.preventDefault(); handleWishlist(p); }} className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform" data-testid={`wishlist-${p.id}`}>
                    <Heart className={`w-4 h-4 ${cart.inWishlist(p.id) ? "fill-red-500 text-red-500" : ""}`} />
                  </button>
                </Link>
                <div className="p-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.brand}</div>
                  <Link to={`/product/${p.id}`} className="font-semibold mt-1 line-clamp-2 hover:text-red-500 transition-colors">{p.name}</Link>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />{p.rating} ({p.review_count})</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-red-500">â¹{price}</span>
                      {p.discount > 0 && <span className="text-xs text-muted-foreground line-through ml-2">â¹{p.price}</span>}
                    </div>
                    <Button size="icon" onClick={() => handleAdd(p)} className="btn-primary rounded-full w-9 h-9" data-testid={`add-cart-${p.id}`}><ShoppingCart className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
