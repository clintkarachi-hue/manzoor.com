import React from 'react';
import { motion } from 'motion/react';
import { Camera, Shield, Phone, MapPin, User, Menu, X, ShoppingCart } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface HeaderProps {
  onAdminClick: () => void;
  onCartClick: () => void;
  cartCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onAdminClick, onCartClick, cartCount }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'Solutions', href: '#solutions' },
    { name: 'Products', href: '#products' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 md:px-12",
        isScrolled ? "py-3 bg-premium-black/80 backdrop-blur-lg border-b border-white/5" : "py-6 bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 bg-premium-red rounded flex items-center justify-center font-bold text-lg shadow-lg shadow-premium-red/20">
            H
          </div>
          <span className="text-xl font-display tracking-wide uppercase">
            Hussain <span className="text-premium-red">Electronics</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="hover:text-premium-red transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-6">
          <button 
            onClick={onCartClick}
            className="relative p-2 text-white/60 hover:text-white transition-colors flex items-center gap-2 group"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-premium-red text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-sm font-medium hidden lg:inline hover:text-premium-red transition-colors">Quote List</span>
          </button>
          
          <button 
            onClick={onAdminClick}
            className="px-5 py-2 border border-white/10 rounded-full text-xs font-semibold bg-white/5 hover:bg-premium-red hover:border-premium-red transition-all text-white/80 hover:text-white"
          >
            Login
          </button>

          <button 
            className="md:hidden p-2 text-gray-400"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-full left-0 right-0 bg-premium-black/95 backdrop-blur-2xl border-b border-white/10 p-8 flex flex-col gap-6 md:hidden shadow-2xl"
        >
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="text-3xl font-display text-white/90 hover:text-premium-red transition-colors py-3 border-b border-white/5 uppercase tracking-wide"
            >
              {link.name}
            </a>
          ))}
        </motion.div>
      )}
    </header>
  );
};
