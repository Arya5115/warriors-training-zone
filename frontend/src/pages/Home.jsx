import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star, Users, Trophy, Flame, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { formatCurrency } from "@/utils/currency";

const HERO_IMG = "https://images.pexels.com/photos/17211446/pexels-photo-17211446.jpeg";
const ABOUT_IMG = "https://images.pexels.com/photos/36877065/pexels-photo-36877065.jpeg";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [counters, setCounters] = useState({ members: 0, trainers: 0, hours: 0 });

  useEffect(() => {
    (async () => {
      const [p, t, tm] = await Promise.all([
        api.get("/products?featured=true&limit=4"),
        api.get("/trainers"),
        api.get("/testimonials"),
      ]);
      setProducts(p.data.items);
      setTrainers(t.data.slice(0, 3));
      setTestimonials(tm.data);
    })();

    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCounters({
        members: Math.min(1250, i * 25),
        trainers: Math.min(35, Math.floor(i / 2)),
        hours: Math.min(85000, i * 1700),
      });
      if (i >= 50) clearInterval(id);
    }, 40);

    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden grain">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Warriors gym" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-8 py-24 md:py-36">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs uppercase tracking-widest text-white/90 mb-6">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> India's #1 Strength Facility
            </div>
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl leading-[0.9] text-white max-w-4xl">
              Forge the <span className="crimson-text">warrior</span>
              <br />
              you were <span className="gold-text">born</span> to be.
            </h1>
            <p className="mt-6 text-base md:text-lg text-neutral-300 max-w-xl leading-relaxed">
              Elite coaching. World-class equipment. A brotherhood of athletes chasing their strongest self. Your transformation starts today.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/membership">
                <Button size="lg" className="btn-primary rounded-full text-base px-8" data-testid="hero-join-btn">
                  Join Now <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/services">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full text-white border-white/30 hover:bg-white/10 hover:text-white bg-transparent"
                  data-testid="hero-trial-btn"
                >
                  <Play className="mr-2 w-4 h-4" /> Book Free Trial
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-10 text-white">
              <Counter label="Active Members" value={counters.members} />
              <Counter label="Elite Trainers" value={counters.trainers} />
              <Counter label="Training Hours" value={counters.hours} />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 grid md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-5 relative">
          <img src={ABOUT_IMG} alt="Facility" className="rounded-3xl w-full aspect-[4/5] object-cover" />
          <div className="absolute -bottom-6 -right-6 glass rounded-2xl p-5 max-w-[220px]">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-xs uppercase tracking-widest">Since 2016</span>
            </div>
            <p className="text-sm text-muted-foreground">Trusted by 1250+ athletes across India.</p>
          </div>
        </div>
        <div className="md:col-span-7">
          <div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-3">About Warriors</div>
          <h2 className="font-display text-4xl md:text-5xl leading-tight">A strength temple, not just a gym.</h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            Warriors was born from one question: what if fitness was treated as a craft, not a subscription? Our 12,000 sq ft facility houses competition-grade platforms, calibrated plates, and a coaching team with credentials from NSCA, IPF, ACSM, and IFBB. Every session is programmed. Every rep matters.
          </p>
          <div className="grid grid-cols-2 gap-6 mt-8">
            {[
              { icon: <Flame className="w-5 h-5" />, title: "Programming First", desc: "Every member follows a structured block-periodized plan." },
              { icon: <Users className="w-5 h-5" />, title: "Elite Community", desc: "Train alongside national champions and pros." },
              { icon: <Star className="w-5 h-5" />, title: "Nutrition Support", desc: "Custom macros. Real food. No gimmicks." },
              { icon: <Trophy className="w-5 h-5" />, title: "Results Guaranteed", desc: "Follow the plan, we guarantee measurable progress." },
            ].map((f) => (
              <div key={f.title} className="p-5 rounded-2xl border border-border hover:border-red-500/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mb-3">{f.icon}</div>
                <div className="font-semibold">{f.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-2">Meet the Coaches</div>
              <h2 className="font-display text-4xl md:text-5xl">Trained by the best.</h2>
            </div>
            <Link to="/trainers" className="text-sm font-semibold hover:text-red-500 transition-colors flex items-center gap-1">
              See all trainers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {trainers.map((t) => (
              <div key={t.id} className="group rounded-3xl overflow-hidden border border-border bg-card hover:border-yellow-500/40 transition-all">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="text-xs uppercase tracking-widest text-yellow-400">{t.specialization}</div>
                    <div className="text-2xl font-display mt-1">{t.name}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{t.rating}</span>
                      <span className="text-xs text-neutral-400 ml-2">{t.experience_years} yrs exp</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-3">Membership</div>
        <h2 className="font-display text-4xl md:text-5xl">Pick your battle plan.</h2>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">From weekend warriors to competitive athletes, a tier for every commitment level.</p>
        <div className="mt-10">
          <Link to="/membership">
            <Button size="lg" className="btn-gold rounded-full px-8" data-testid="home-view-plans">
              View Plans
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-8 py-20">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-2">Marketplace</div>
            <h2 className="font-display text-4xl md:text-5xl">Fuel your fire.</h2>
          </div>
          <Link to="/marketplace" className="text-sm font-semibold hover:text-red-500 transition-colors flex items-center gap-1">
            Shop all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {products.map((p) => (
            <Link
              key={p.id}
              to={`/product/${p.id}`}
              className="group rounded-2xl border border-border overflow-hidden bg-card hover:border-red-500/40 transition-colors"
              data-testid={`home-product-${p.id}`}
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-widest">{p.brand}</div>
                <div className="font-semibold mt-1 line-clamp-2">{p.name}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-bold text-red-500">
                    {formatCurrency(Math.round(p.price * (1 - (p.discount || 0) / 100)))}
                  </span>
                  {p.discount > 0 && <span className="text-xs text-muted-foreground line-through">{formatCurrency(p.price)}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-2">Testimonials</div>
            <h2 className="font-display text-4xl md:text-5xl">Real transformations.</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t) => (
              <div key={t._id || t.name} className="p-6 rounded-2xl bg-card border border-border">
                <div className="flex text-yellow-500 mb-3">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.message}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-yellow-600">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-8 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-900 via-black to-black p-10 md:p-16 text-white">
          <div className="max-w-2xl relative z-10">
            <h2 className="font-display text-4xl md:text-6xl leading-tight">Ready to earn your strength?</h2>
            <p className="text-neutral-300 mt-4">7-day free trial. No card required. Cancel anytime.</p>
            <div className="mt-6 flex gap-3 flex-wrap">
              <Link to="/signup">
                <Button size="lg" className="btn-gold rounded-full px-8" data-testid="cta-signup">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent">
                  Talk to a Coach
                </Button>
              </Link>
            </div>
          </div>
          <Flame className="absolute -right-10 -bottom-10 w-72 h-72 text-red-800/40" />
        </div>
      </section>
    </div>
  );
}

function Counter({ label, value }) {
  return (
    <div>
      <div className="font-display text-4xl md:text-5xl text-yellow-500">{value.toLocaleString()}+</div>
      <div className="text-xs uppercase tracking-[0.2em] text-neutral-400 mt-1">{label}</div>
    </div>
  );
}
