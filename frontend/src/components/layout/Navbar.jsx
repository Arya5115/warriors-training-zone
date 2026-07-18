import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Dumbbell, ShoppingCart, Heart, Sun, Moon, User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/membership", label: "Membership" },
  { to: "/trainers", label: "Trainers" },
  { to: "/services", label: "Services" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/blogs", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items, wishlist } = useCart() || { items: [], wishlist: [] };
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-3">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-gradient-to-br from-red-600 to-red-900 group-hover:scale-105 transition-transform">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div className="leading-none">
            <div className="font-display text-2xl tracking-wider">WARRIORS</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Training Zone</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={`nav-${n.label.toLowerCase()}`}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive ? "text-red-500" : "text-foreground/70 hover:text-foreground"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} data-testid="theme-toggle" aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          {user && (
            <>
              <Link to="/dashboard/wishlist" className="relative" data-testid="nav-wishlist">
                <Button variant="ghost" size="icon"><Heart className="w-4 h-4" /></Button>
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <Link to="/cart" className="relative" data-testid="nav-cart">
                <Button variant="ghost" size="icon"><ShoppingCart className="w-4 h-4" /></Button>
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </Link>
            </>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="user-menu-trigger"><User className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-semibold">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")} data-testid="menu-dashboard">My Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/orders")} data-testid="menu-orders">Orders</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/membership")} data-testid="menu-membership">Membership</DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} data-testid="menu-admin">Admin Panel</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await logout(); navigate("/"); }} data-testid="menu-logout">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block"><Button variant="ghost" data-testid="nav-login">Sign In</Button></Link>
              <Link to="/signup"><Button className="btn-primary rounded-full" data-testid="nav-signup">Join Now</Button></Link>
            </>
          )}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} data-testid="mobile-menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-white/10 px-4 py-3 space-y-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-muted">
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
