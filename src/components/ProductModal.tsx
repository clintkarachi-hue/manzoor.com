import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, MessageCircle, Ruler, Box, ShieldCheck, Zap } from 'lucide-react';
import { Product } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-premium-black/90 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-6xl max-h-[90vh] bg-premium-black border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row premium-shadow"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Images */}
            <div className="md:w-1/2 h-[40vh] md:h-auto bg-white/2 relative">
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-6 left-6 flex gap-2">
                <span className="bg-premium-red/80 backdrop-blur-sm px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
                  {product.brand}
                </span>
                <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
                  {product.resolution}
                </span>
              </div>
            </div>

            {/* Right: Details */}
            <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto">
              <div className="mb-8">
                <span className="text-xs uppercase tracking-wider text-premium-red font-bold mb-2 block">{product.category}</span>
                <h2 className="text-3xl md:text-5xl font-display tracking-tight mb-4 uppercase font-bold">{product.name}</h2>
                <div className="flex items-baseline gap-4 mb-6">
                  <span className="text-3xl font-bold font-mono text-white">Rs. {product.price.toLocaleString()}</span>
                  <span className="text-xs text-white/40 uppercase font-bold">Wholesale Value</span>
                </div>
                <p className="text-white/60 leading-relaxed text-base font-sans">{product.description}</p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="p-4 rounded-xl bg-white/2 border border-white/5 flex flex-col gap-1">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold">{key}</p>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">{val}</p>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                  <ShieldCheck className="w-4 h-4 text-premium-red" />
                  <span>Authorized Brand Warranty</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                  <Zap className="w-4 h-4 text-premium-red" />
                  <span>24/7 Technical Support</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => onAddToCart(product)}
                  className="flex-1 bg-premium-red text-white py-4 rounded-full font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-xl shadow-premium-red/20"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Quote
                </button>
                <button 
                  onClick={() => {
                    const whatsappUrl = `https://wa.me/923336606657?text=Assalam o Alaikum, I am interested in ${product.name}. Please share more details and availability.`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="flex-1 bg-white/5 border border-white/20 text-white py-4 rounded-full font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Order on WhatsApp
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
