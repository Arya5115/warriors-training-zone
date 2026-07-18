import React from "react";
import { Link } from "react-router-dom";
import { Dumbbell, Instagram, Youtube, Twitter, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-24 bg-black text-neutral-300">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-600 to-red-900">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display text-2xl tracking-wider text-white">WARRIORS</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Training Zone</div>
            </div>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Forge your body. Sharpen your mind. Join India's most disciplined training community.
          </p>
          <div className="flex gap-3 mt-5">
            <a href="#" className="p-2 rounded-full border border-white/10 hover:border-yellow-500/50 transition-colors"><Instagram className="w-4 h-4" /></a>
            <a href="#" className="p-2 rounded-full border border-white/10 hover:border-yellow-500/50 transition-colors"><Youtube className="w-4 h-4" /></a>
            <a href="#" className="p-2 rounded-full border border-white/10 hover:border-yellow-500/50 transition-colors"><Twitter className="w-4 h-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Explore</h4>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li><Link to="/membership" className="hover:text-yellow-500">Membership</Link></li>
            <li><Link to="/trainers" className="hover:text-yellow-500">Trainers</Link></li>
            <li><Link to="/services" className="hover:text-yellow-500">Services</Link></li>
            <li><Link to="/marketplace" className="hover:text-yellow-500">Marketplace</Link></li>
            <li><Link to="/blogs" className="hover:text-yellow-500">Blog</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Support</h4>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li><Link to="/faqs" className="hover:text-yellow-500">FAQs</Link></li>
            <li><Link to="/contact" className="hover:text-yellow-500">Contact Us</Link></li>
            <li><Link to="/bmi" className="hover:text-yellow-500">BMI Calculator</Link></li>
            <li><Link to="/events" className="hover:text-yellow-500">Events</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Reach Us</h4>
          <ul className="space-y-3 text-sm text-neutral-400">
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-yellow-500" /> 42 Iron Street, Bengaluru 560001</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-yellow-500" /> +91 80 4200 1200</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-yellow-500" /> hello@warriors.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-neutral-500">
        &copy; {new Date().getFullYear()} Warriors Training Zone. Forged in iron. Built in India.
      </div>
    </footer>
  );
}
