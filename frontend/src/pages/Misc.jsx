import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function Services() {
  const [services, setServices] = useState([]);
  useEffect(() => { api.get("/services").then((r) => setServices(r.data)); }, []);
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto"><div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-2">Services</div><h1 className="font-display text-5xl md:text-6xl">Programs that <span className="gold-text">deliver.</span></h1></div>
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {services.map((s) => (
          <div key={s.id} className="rounded-3xl overflow-hidden border border-border bg-card hover:border-red-500/40 transition-colors" data-testid={`service-${s.id}`}>
            <img src={s.image} alt="" className="w-full aspect-video object-cover" />
            <div className="p-6">
              <h3 className="font-display text-2xl">{s.name}</h3>
              <p className="text-sm text-muted-foreground mt-2">{s.description}</p>
              <div className="mt-4 flex items-center justify-between"><span className="font-bold text-red-500 text-xl">â¹{s.price}</span><span className="text-xs text-muted-foreground">{s.duration_min ? `${s.duration_min} min` : "Program"}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BMI() {
  const [h, setH] = useState(170);
  const [w, setW] = useState(70);
  const [res, setRes] = useState(null);
  const calc = async () => {
    try { const { data } = await api.post("/bmi", { height_cm: parseFloat(h), weight_kg: parseFloat(w) }); setRes(data); }
    catch { toast.error("Invalid values"); }
  };
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center"><div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-2">Tool</div><h1 className="font-display text-5xl">BMI Calculator</h1></div>
      <div className="mt-10 rounded-3xl border border-border p-8 bg-card">
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="text-xs uppercase tracking-widest">Height (cm)</label><Input type="number" value={h} onChange={(e) => setH(e.target.value)} data-testid="bmi-height" className="mt-1" /></div>
          <div><label className="text-xs uppercase tracking-widest">Weight (kg)</label><Input type="number" value={w} onChange={(e) => setW(e.target.value)} data-testid="bmi-weight" className="mt-1" /></div>
        </div>
        <Button onClick={calc} className="btn-primary rounded-full mt-6 w-full h-11" data-testid="bmi-calc">Calculate BMI</Button>
        {res && (
          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 text-white text-center" data-testid="bmi-result">
            <div className="text-xs uppercase tracking-widest opacity-80">Your BMI</div>
            <div className="font-display text-6xl mt-2">{res.bmi}</div>
            <div className="text-xl mt-2">{res.category}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function FAQs() {
  const [faqs, setFaqs] = useState([]);
  useEffect(() => { api.get("/faqs").then((r) => setFaqs(r.data)); }, []);
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center"><div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-2">FAQ</div><h1 className="font-display text-5xl">Questions? We got you.</h1></div>
      <Accordion type="single" collapsible className="mt-10">
        {faqs.map((f) => (
          <AccordionItem key={f.id} value={f.id} className="rounded-2xl border border-border px-5 mb-3">
            <AccordionTrigger className="text-left" data-testid={`faq-${f.id}`}>{f.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export function Blogs() {
  const [blogs, setBlogs] = useState([]);
  useEffect(() => { api.get("/blogs").then((r) => setBlogs(r.data)); }, []);
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
      <div className="text-center"><div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-2">Blog</div><h1 className="font-display text-5xl md:text-6xl">Knowledge is <span className="gold-text">power.</span></h1></div>
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {blogs.map((b) => (
          <article key={b.id} className="rounded-3xl overflow-hidden border border-border bg-card hover:border-red-500/40 transition-colors" data-testid={`blog-${b.id}`}>
            <img src={b.image} alt="" className="w-full aspect-video object-cover" />
            <div className="p-6">
              <div className="text-xs uppercase tracking-widest text-red-500">{b.category}</div>
              <h3 className="font-display text-2xl mt-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground mt-3">{b.excerpt}</p>
              <div className="text-xs text-muted-foreground mt-4">By {b.author}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function Events() {
  const [events, setEvents] = useState([]);
  useEffect(() => { api.get("/events").then((r) => setEvents(r.data)); }, []);
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
      <div className="text-center"><div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-2">Events</div><h1 className="font-display text-5xl md:text-6xl">Compete. Learn. <span className="crimson-text">Grow.</span></h1></div>
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {events.map((e) => (
          <div key={e.id} className="rounded-3xl overflow-hidden border border-border bg-card">
            <img src={e.image} alt="" className="w-full aspect-video object-cover" />
            <div className="p-6">
              <div className="text-xs uppercase tracking-widest text-yellow-600">{new Date(e.date).toDateString()}</div>
              <h3 className="font-display text-2xl mt-2">{e.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{e.description}</p>
              <div className="text-xs text-muted-foreground mt-3">ð {e.location}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post("/contact", form); setSent(true); toast.success("Message sent!"); }
    catch { toast.error("Failed to send"); }
  };
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center"><div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-2">Contact</div><h1 className="font-display text-5xl">Get in touch.</h1></div>
      {sent ? (
        <div className="mt-10 rounded-3xl bg-green-500/10 text-green-700 border border-green-500/30 p-8 text-center">
          <div className="font-display text-3xl">Thank you!</div><p className="mt-2">A Warriors coach will reach out within 24 hours.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-10 rounded-3xl border border-border p-8 bg-card space-y-4">
          <Input placeholder="Your Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required data-testid="contact-name" />
          <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required data-testid="contact-email" />
          <Input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} data-testid="contact-phone" />
          <Textarea placeholder="Message" rows={5} value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} required data-testid="contact-message" />
          <Button type="submit" className="btn-primary rounded-full w-full h-11" data-testid="contact-submit">Send Message</Button>
        </form>
      )}
    </div>
  );
}

export function About() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center max-w-2xl mx-auto"><div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-2">About</div><h1 className="font-display text-5xl md:text-6xl">Built by <span className="crimson-text">athletes.</span> For <span className="gold-text">warriors.</span></h1></div>
      <div className="prose prose-lg dark:prose-invert mx-auto mt-10 text-muted-foreground">
        <p>Warriors Training Zone was founded in 2016 by three national-level powerlifters who were tired of soft gyms, chalk-free platforms, and coaches who couldn't out-lift their clients. We built the facility we always wanted to train in.</p>
        <p className="mt-4"><strong className="text-foreground">Our Mission:</strong> Democratize elite strength coaching in India.</p>
        <p className="mt-4"><strong className="text-foreground">Our Vision:</strong> A generation of Indians who understand that strength is the foundation of every other quality.</p>
        <p className="mt-4">We now serve 1,250+ members across our flagship Bengaluru location and coach hundreds more online. Our members have won 12 national championships, set 47 state records, and, more importantly, shown up for themselves every single day.</p>
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center px-6">
      <div>
        <div className="font-display text-8xl gold-text">404</div>
        <div className="text-xl mt-2">This platform doesn't exist.</div>
        <a href="/" className="btn-primary rounded-full px-6 py-2 inline-block mt-6">Back to Home</a>
      </div>
    </div>
  );
}
