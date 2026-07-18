import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Star, Award, Languages as LangIcon } from "lucide-react";

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  useEffect(() => { api.get("/trainers").then((r) => setTrainers(r.data)); }, []);
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <div className="text-xs uppercase tracking-[0.3em] text-red-500 mb-2">Our Team</div>
        <h1 className="font-display text-5xl md:text-6xl">Coaches who've been in the trenches.</h1>
        <p className="text-muted-foreground mt-4">Certified. Experienced. Obsessed with your progress.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {trainers.map((t) => (
          <div key={t.id} className="rounded-3xl overflow-hidden border border-border bg-card group hover:border-yellow-500/40 transition-colors" data-testid={`trainer-card-${t.id}`}>
            <div className="aspect-[4/5] overflow-hidden relative">
              <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="text-xs uppercase tracking-widest text-yellow-400">{t.specialization}</div>
                <div className="font-display text-3xl">{t.name}</div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />{t.rating}</div>
                <div className="flex items-center gap-1"><Award className="w-4 h-4 text-red-500" />{t.experience_years} years</div>
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{t.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {t.certifications.map((c) => <span key={c} className="text-[10px] px-2 py-1 rounded-full bg-red-500/10 text-red-500 uppercase tracking-widest">{c}</span>)}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><LangIcon className="w-3 h-3" /> {t.languages.join(" Â· ")}</div>
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm"><span className="font-bold text-lg">â¹{t.hourly_rate}</span> <span className="text-muted-foreground">/hr</span></div>
                <button className="btn-primary rounded-full px-4 py-2 text-sm font-semibold" data-testid={`book-trainer-${t.id}`}>Book Session</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
