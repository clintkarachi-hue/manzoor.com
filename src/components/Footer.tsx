import React from 'react';
import { Camera, Phone, Mail, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#030303] pt-20 pb-10 border-t border-white/5 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-premium-red rounded flex items-center justify-center font-bold text-lg shadow-lg shadow-premium-red/20">
                H
              </div>
              <h2 className="text-lg font-display tracking-wide uppercase">Hussain <span className="text-premium-red">Electronics</span></h2>
            </div>
            <p className="text-xs text-white/40 leading-relaxed max-w-xs font-sans">
              Faisalabad's premier wholesale hub for security infrastructure. Trusted by 5000+ satisfied clients.
            </p>
        </div>

        {/* Contact Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 mb-16">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-6">Explore</h3>
            <ul className="space-y-3 text-sm text-white/60 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#products" className="hover:text-white transition-colors">Products</a></li>
              <li><a href="#testimonials" className="hover:text-white transition-colors">Reviews</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-6">Catalogue</h3>
            <ul className="space-y-3 text-sm text-white/60 font-medium">
              <li><span className="hover:text-white transition-colors cursor-pointer">IP Cameras</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">NVR Systems</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">PTZ Range</span></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-6">Location</h3>
            <p className="text-sm text-white/60 leading-relaxed font-medium">
              Gole Electronics, Bhowana Bazar, Faisalabad
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col justify-center items-center gap-2">
          <p className="text-xs text-white/40 text-center font-medium">
            Developed by <span className="text-white/80">Aamir Engineering Company</span>, Faisalabad
          </p>
          <p className="text-xs text-white/40 text-center font-medium">&copy; {new Date().getFullYear()} Hussain Electronics</p>
        </div>
      </div>
    </footer>
  );
};
