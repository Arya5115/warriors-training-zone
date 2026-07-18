import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Heart, ShoppingCart, Star, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/services/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/utils/currency";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const cart = useCart();
  const { user } = useAuth();

  const load = async () => {
    const [p, r] = await Promise.all([api.get(`/products/${id}`), api.get(`/reviews/product/${id}`)]);
    setProduct(p.data);
    setReviews(r.data);
  };

  useEffect(() => {
    load();
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const price = Math.round(product.price * (1 - (product.discount || 0) / 100));

  const addCart = async () => {
    if (!user) return toast.error("Sign in to add to cart");
    await cart.addToCart(product.id, qty);
    toast.success("Added to cart");
  };

  const submitReview = async () => {
    if (!user) return toast.error("Sign in to review");
    await api.post("/reviews", { product_id: product.id, rating, comment });
    toast.success("Review submitted");
    setComment("");
    load();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
      <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Marketplace
      </Link>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="rounded-3xl overflow-hidden bg-muted aspect-square">
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" data-testid="product-detail-image" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-red-500">{product.brand} · {product.category}</div>
          <h1 className="font-display text-4xl md:text-5xl mt-2" data-testid="product-detail-name">{product.name}</h1>
          <div className="flex items-center gap-3 mt-3 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              {product.rating}
            </div>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{product.review_count} reviews</span>
            <span className="text-muted-foreground">·</span>
            <span className={`text-xs px-2 py-1 rounded-full ${product.stock > 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>
          <div className="mt-6 flex items-end gap-3">
            <span className="text-4xl font-bold text-red-500">{formatCurrency(price)}</span>
            {product.discount > 0 && <span className="text-lg text-muted-foreground line-through">{formatCurrency(product.price)}</span>}
            {product.discount > 0 && <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500">{product.discount}% OFF</span>}
          </div>
          <p className="text-muted-foreground mt-6 leading-relaxed">{product.description}</p>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center border border-border rounded-full">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2" data-testid="qty-dec">-</button>
              <span className="px-3 py-2 min-w-[40px] text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2" data-testid="qty-inc">+</button>
            </div>
            <Button onClick={addCart} className="btn-primary rounded-full flex-1 h-11" data-testid="add-to-cart-btn">
              <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={async () => {
                if (!user) return toast.error("Sign in first");
                await cart.toggleWishlist(product.id);
                toast.success("Wishlist updated");
              }}
              className="rounded-full h-11 w-11"
              data-testid="wishlist-btn"
            >
              <Heart className={`w-4 h-4 ${cart.inWishlist(product.id) ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="font-display text-3xl">Reviews ({reviews.length})</h2>
        {user && (
          <div className="mt-6 p-5 rounded-2xl border border-border">
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`w-6 h-6 ${s <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts..." data-testid="review-input" />
            <Button onClick={submitReview} className="mt-3 btn-primary rounded-full" data-testid="submit-review">
              Post Review
            </Button>
          </div>
        )}
        <div className="mt-6 space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="p-5 rounded-2xl border border-border">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{r.user_name}</span>
                <span className="text-muted-foreground">·</span>
                <div className="flex">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>}
        </div>
      </div>
    </div>
  );
}
