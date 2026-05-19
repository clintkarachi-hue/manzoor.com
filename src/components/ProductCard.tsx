import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Eye, MessageCircle, Star } from 'lucide-react';
import { Product } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface ProductCardProps {
  product: Product;
  onView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onView, onAddToCart }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group glass-card overflow-hidden h-full flex flex-col premium-shadow"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-white/5">
        <img 
          src={product.images[0] || `https://picsum.photos/seed/${product.id}/600/600`} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-premium-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
          <button 
            onClick={() => onView(product)}
            className="w-12 h-12 bg-white text-premium-black rounded-full flex items-center justify-center hover:bg-premium-red hover:text-white transition-colors"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onAddToCart(product)}
            className="w-12 h-12 bg-premium-red text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="bg-premium-red text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded">
            {product.brand}
          </span>
          {product.stock < 5 && product.stock > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded">
              Low Stock
            </span>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] uppercase tracking-widest text-premium-red font-extrabold">{product.category}</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-black text-white/40 tracking-widest">{product.brand}</span>
          </div>
        </div>
        <h3 className="text-xl font-display mb-2 group-hover:text-premium-red transition-colors line-clamp-1 h-7 uppercase tracking-wide">{product.name}</h3>
        <p className="text-sm text-white/50 line-clamp-2 mb-6 flex-grow font-sans leading-relaxed">{product.description}</p>
        
        <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-mono text-white tracking-tighter">
              Rs. {product.price.toLocaleString()}
              <span className="text-[10px] text-white/40 ml-1 font-sans uppercase font-bold">Wholesale</span>
            </span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onView(product)}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4 text-white/80" />
            </button>
            <button 
              onClick={() => onAddToCart(product)}
              className="p-3 bg-premium-red/10 hover:bg-premium-red rounded-full border border-premium-red/20 transition-all group/btn shadow-lg shadow-premium-red/10 hover:shadow-premium-red/30"
              title="Add to Cart"
            >
              <ShoppingCart className="w-4 h-4 text-premium-red group-hover/btn:text-white" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
