import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Shield, Phone, MapPin, CheckCircle, 
  MessageCircle, ArrowRight, Filter, ChevronRight,
  Truck, ShieldCheck, BadgePercent, Clock, Star, User,
  Trash2, Edit, Save, Plus
} from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { productService } from './services/productService';
import { orderService } from './services/orderService';
import { MOCK_TESTIMONIALS } from './data/mockData';
import { Product, Order } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      try {
        await productService.seedProducts();
        const data = await productService.getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const categories = ['All', 'Bullet', 'Dome', 'PTZ', 'NVR/DVR', 'Solar', 'IP Camera'];

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return products;
    return products.filter(p => p.category === activeCategory);
  }, [activeCategory, products]);

  const addToCart = () => {
    setCartCount(prev => prev + 1);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const refreshProducts = async () => {
    const data = await productService.getProducts();
    setProducts(data);
  };

  return (
    <div className="min-h-screen bg-premium-black text-white selection:bg-premium-red selection:text-white font-sans antialiased">
      <Header 
        onAdminClick={() => setIsAdminOpen(true)} 
        onCartClick={() => {}} 
        cartCount={cartCount}
      />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] md:min-h-screen flex items-center overflow-hidden pt-24 md:pt-20 pb-40 md:pb-0">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[#050505] z-0" />
            <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-premium-red/10 rounded-full blur-[120px] z-10" />
          </div>

          <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-block px-3 py-1 mb-6 border border-premium-red/50 rounded-full text-[10px] uppercase tracking-[0.2em] text-premium-red font-black">
                Trusted Security Partners
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-display mb-6 md:mb-8 leading-tight tracking-wide uppercase font-black">
                Wholesale Dealer of <br /> 
                <span className="text-premium-red">Premium CCTV</span> <br /> 
                Solutions
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-8 md:mb-10 leading-relaxed max-w-sm mx-auto lg:mx-0 font-sans">
                Faisalabad&apos;s most trusted source for high-performance Dahua and Hikvision enterprise security hardware.
              </p>
              
              <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-4">
                <a 
                  href="#products"
                  className="px-8 py-4 bg-premium-red text-white font-black uppercase tracking-widest text-xs rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 group shadow-2xl shadow-premium-red/30"
                >
                  View Catalogue
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <button 
                  onClick={() => window.location.href = "tel:03336606657"}
                  className="px-8 py-4 bg-white/5 border border-white/20 text-white font-black uppercase tracking-widest text-xs rounded-lg hover:bg-white/10 transition-all backdrop-blur-md"
                >
                  Call Now
                </button>
              </div>
            </motion.div>

            {/* Hero Image / Card Area */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative hidden lg:flex justify-center items-center"
            >
              <div className="absolute w-96 h-96 bg-premium-red/20 blur-[120px] rounded-full"></div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-premium-red/20 to-transparent rounded-3xl -m-1"></div>
                <div className="w-[380px] h-[480px] bg-[#0a0a0a] rounded-3xl border border-white/10 flex flex-col p-8 shadow-2xl backdrop-blur-3xl">
                  <div className="flex justify-between items-center mb-10">
                    <div className="w-16 h-2 bg-premium-red rounded-full"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">Featured Product</span>
                    </div>
                  </div>
                  
                  <div className="w-full aspect-video bg-black rounded-2xl border border-white/5 overflow-hidden mb-8 relative flex items-center justify-center group-hover:border-premium-red/30 transition-colors">
                    <img 
                      src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800" 
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-700"
                      alt="Hikvision Camera Preview"
                    />
                    <div className="relative z-10 w-20 h-20 border-2 border-premium-red/30 rounded-full flex items-center justify-center">
                       <div className="w-10 h-10 bg-premium-red/40 rounded-full blur-md"></div>
                       <Camera className="w-8 h-8 text-white absolute" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="h-4 w-3/4 bg-white/5 rounded-full"></div>
                    <div className="h-4 w-1/2 bg-white/5 rounded-full"></div>
                  </div>

                  <div className="mt-auto flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Wholesale starting</span>
                      <span className="text-3xl font-mono font-bold text-white tracking-tighter">Rs. 4,500</span>
                    </div>
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-premium-red transition-all">
                       <Shield className="w-5 h-5 text-premium-red group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Feature Bar / Stats Overlay */}
          <div className="absolute bottom-0 left-0 right-0 hidden md:flex h-32 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/5 items-center px-12 gap-12 z-30">
            <div className="flex items-center gap-4 border-r border-white/10 pr-12">
              <div className="text-left">
                <div className="text-[10px] uppercase text-premium-red font-black tracking-widest mb-1">Malik Abid</div>
                <div className="text-xl font-mono font-bold text-white tracking-tighter">0333-6606657</div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-r border-white/10 pr-12 hidden sm:flex">
              <div className="text-left">
                <div className="text-[10px] uppercase text-premium-red font-black tracking-widest mb-1">Malik Abubakar</div>
                <div className="text-xl font-mono font-bold text-white tracking-tighter">0302-9214214</div>
              </div>
            </div>
            <div className="hidden lg:flex flex-col">
              <div className="text-[10px] uppercase text-white/40 font-black tracking-widest mb-1 font-mono">Landline: 041-2614508</div>
              <div className="text-[11px] text-white/60 uppercase tracking-widest font-bold">Bhowana Bazar, Faisalabad</div>
            </div>
            <div className="ml-auto hidden xl:flex">
              <div className="flex gap-3">
                {['4K IP Cameras', 'PTZ Systems', 'DVR/NVR'].map(tag => (
                  <span key={tag} className="px-4 py-2 bg-white/5 border border-white/10 text-xs rounded uppercase tracking-wider text-white/60 font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Bar for Mobile - part of the flow */}
        <div className="md:hidden flex flex-col items-center px-6 py-12 gap-8 bg-[#0a0a0a] border-y border-white/5">
          <div className="text-center">
            <div className="text-[10px] uppercase text-premium-red font-black tracking-widest mb-1">Malik Abid</div>
            <div className="text-xl font-mono font-bold text-white tracking-tighter hover:text-premium-red transition-colors cursor-pointer" onClick={() => window.open('tel:03336606657')}>0333-6606657</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase text-premium-red font-black tracking-widest mb-1">Malik Abubakar</div>
            <div className="text-xl font-mono font-bold text-white tracking-tighter hover:text-premium-red transition-colors cursor-pointer" onClick={() => window.open('tel:03029214214')}>0302-9214214</div>
          </div>
        </div>

        {/* Trust Signals */}
        <section className="py-24 bg-white/2 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <h2 className="text-center text-xs md:text-sm font-black text-premium-red uppercase tracking-[0.4em] mb-4">Core Features</h2>
            <h3 className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display mb-12 md:mb-16 tracking-wide uppercase">Why Choose Us</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[
                { icon: ShieldCheck, title: 'Official Warranty', desc: 'Secure brand coverage' },
                { icon: BadgePercent, title: 'Wholesale Rates', desc: 'Direct market pricing' },
                { icon: Truck, title: 'Safe Delivery', desc: 'All over Pakistan' },
                { icon: Clock, title: '24/7 Support', desc: 'Technical assistance' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center p-6 glass-card border-none hover:bg-white/10 transition-all group">
                  <item.icon className="w-8 h-8 md:w-10 md:h-10 text-premium-red mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] mb-2 text-white">{item.title}</h3>
                  <p className="text-[10px] md:text-xs text-white/60 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industry Solutions */}
        <section id="solutions" className="py-16 md:py-24 bg-[#0a0a0a] border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(204,0,0,0.05),transparent_50%)]" />
          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
            <div className="mb-12 md:mb-16">
              <h2 className="text-premium-red text-xs md:text-sm font-black uppercase tracking-[0.4em] mb-4">Industry Solutions</h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display uppercase tracking-wider mb-6">Reliable Surveillance</h3>
              <p className="text-sm md:text-base text-white/50 max-w-xl font-medium">From industrial zones to residential blocks, we provide end-to-end security architecture tailored to Pakistan&apos;s toughest environments.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { title: 'Warehouse Tracking', desc: '4K IP systems with long-distance night vision for industrial storage.' },
                { title: 'Smart Residential', desc: 'Secure your home with high-performance motion detection and mobile alerts.' },
                { title: 'Public Spaces', desc: 'PTZ cameras with 360-degree coverage for markets and community centers.' }
              ].map((sol, i) => (
                <div key={i} className="p-6 md:p-8 rounded-3xl bg-white/2 border border-white/5 hover:border-premium-red/30 transition-all group">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-premium-red rounded-2xl mb-6 flex items-center justify-center text-white font-black group-hover:scale-110 transition-transform">
                    0{i+1}
                  </div>
                  <h4 className="text-lg md:text-xl font-display uppercase tracking-wider mb-3 md:mb-4">{sol.title}</h4>
                  <p className="text-xs md:text-sm text-white/40 leading-relaxed font-sans">{sol.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Catalog */}
        <section id="products" className="py-16 md:py-24 px-6 md:px-12 bg-[#080808]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-12 gap-8">
              <div>
                <h2 className="text-xs md:text-sm font-black text-premium-red uppercase tracking-[0.4em] mb-4">Our Products</h2>
                <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display uppercase tracking-wider">Premium Catalogue</h3>
              </div>
              
              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-5 py-2 text-[10px] uppercase tracking-widest font-bold border transition-all rounded-full",
                      activeCategory === cat 
                        ? "bg-premium-red border-premium-red text-white" 
                        : "bg-white/5 border-white/10 text-metallic hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onView={handleViewProduct} 
                    onAddToCart={addToCart} 
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Showcase / CTA Section */}
        <section className="py-16 md:py-24 bg-premium-black relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(204,0,0,0.15),transparent_70%)]" />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-6 md:mb-8 tracking-tighter uppercase leading-[0.9]">Ready to <br /> Secure Your <br /> Future?</h2>
            <p className="text-sm md:text-lg lg:text-xl text-white/70 mb-8 md:mb-12 max-w-2xl mx-auto font-medium">
              Our experts provide free consultation, wholesale pricing, and direct technical support. 
              Punjab&apos;s most reliable security partner.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6">
              <button 
                onClick={() => window.location.href = "tel:03336606657"}
                className="px-12 py-6 bg-premium-red text-white font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-premium-red/40"
              >
                <Phone className="w-5 h-5" />
                Contact Expert
              </button>
              <button 
                onClick={() => window.open('https://wa.me/923336606657', '_blank')}
                className="px-12 py-6 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-white/10 transition-all backdrop-blur-md flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp Hub
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-16 md:py-24 bg-[#050505] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <h2 className="text-center text-xs md:text-sm font-black text-premium-red uppercase tracking-[0.4em] mb-4">Reviews</h2>
            <h3 className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display mb-10 md:mb-16 tracking-wide uppercase">Client Reviews</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {MOCK_TESTIMONIALS.map((t) => (
                <div key={t.id} className="p-8 glass-card border-white/5 hover:border-premium-red/30 transition-colors">
                  <div className="flex gap-1 text-premium-red mb-6">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-xl text-white font-serif italic leading-relaxed mb-8">&quot;{t.text}&quot;</p>
                  <div className="flex items-center gap-4">
                    <img src={t.photo} alt={t.name} className="w-14 h-14 rounded-full grayscale border-2 border-white/10" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="font-black text-sm tracking-tight uppercase">{t.name}</h4>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-premium-red font-black mt-1">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Floating WhatsApp */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
        <a 
          href="https://wa.me/923336606657"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-end gap-2 md:gap-3 group"
        >
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white px-4 py-2 rounded-xl text-black text-xs font-bold shadow-2xl relative"
          >
            Quick Quote?
            <div className="absolute -bottom-1 right-4 w-2 h-2 bg-white rotate-45"></div>
          </motion.div>
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-14 h-14 md:w-16 md:h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 group-hover:bg-green-400 group-hover:scale-110 active:scale-95 transition-all"
          >
            <MessageCircle className="w-7 h-7 md:w-8 md:h-8" />
          </motion.div>
        </a>
      </div>

      {/* Modals */}
      <ProductModal 
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={addToCart}
      />
      <AdminPanel 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        products={products}
        onRefresh={refreshProducts}
      />
    </div>
  );
}

function AdminPanel({ 
  isOpen, 
  onClose, 
  products, 
  onRefresh 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  products: Product[]; 
  onRefresh: () => void; 
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Inventory' | 'Orders'>('Overview');
  const [form, setForm] = useState({ user: '', pass: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (isLoggedIn && activeTab === 'Orders') {
      orderService.getOrders().then(setOrders);
    }
  }, [isLoggedIn, activeTab]);

  if (!isOpen) return null;

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(id);
        onRefresh();
      } catch (err) {
        alert("Failed to delete product");
      }
    }
  };

  const handleLogin = () => {
    if (form.user === 'admin' && form.pass === 'hussain786') {
      setIsLoggedIn(true);
    } else {
      alert('Invalid Credentials. Access Denied.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-white">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-premium-black/95 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-5xl h-[85vh] bg-premium-black border border-white/10 rounded-3xl overflow-hidden flex flex-col premium-shadow"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-premium-red rounded flex items-center justify-center font-black text-sm shadow-xl shadow-premium-red/30">H</div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Admin Dashboard</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white px-4 py-2 border border-white/10 rounded-full text-xs font-semibold uppercase tracking-wider transition-all hover:bg-white/5">Close</button>
        </div>

        {!isLoggedIn ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-premium-black/50">
            <div className="w-full max-w-sm space-y-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-premium-red/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-premium-red/20">
                  <User className="w-10 h-10 text-premium-red" />
                </div>
                <h3 className="text-3xl font-black tracking-tight mb-2 uppercase">Login</h3>
                <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">Enter your credentials to access inventory</p>
              </div>
              <div className="bg-white/2 p-8 md:p-10 rounded-3xl border border-white/10 space-y-6 shadow-2xl backdrop-blur-xl">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2 ml-1 block">USERNAME</label>
                    <input 
                      type="text" 
                      placeholder="Enter Username"
                      className="w-full bg-premium-black border border-white/10 p-4 rounded-xl text-sm font-medium focus:border-premium-red outline-none transition-all placeholder:text-white/20"
                      value={form.user}
                      onChange={e => setForm({...form, user: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2 ml-1 block">PASSWORD</label>
                    <input 
                      type="password" 
                      placeholder="Enter Password"
                      className="w-full bg-premium-black border border-white/10 p-4 rounded-xl text-sm font-medium focus:border-premium-red outline-none transition-all placeholder:text-white/20"
                      value={form.pass}
                      onChange={e => setForm({...form, pass: e.target.value})}
                    />
                  </div>
                  <button 
                    onClick={handleLogin}
                    className="w-full bg-premium-red py-4 rounded-xl text-sm font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-premium-red/20 mt-6 active:scale-95"
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-64 border-r border-white/10 p-4 hidden md:flex flex-col gap-2 bg-white/2">
              {['Overview', 'Inventory', 'Orders'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "text-left px-4 py-3 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                    activeTab === tab ? "bg-premium-red text-white" : "hover:bg-white/5 text-gray-500 hover:text-white"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold tracking-tight uppercase tracking-[0.2em]">{activeTab}</h3>
                {activeTab === 'Inventory' && (
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-white text-black text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-full hover:bg-premium-red hover:text-white transition-all shadow-xl shadow-white/5"
                  >
                    + Add New Stock
                  </button>
                )}
              </div>
              
              {activeTab === 'Overview' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="p-8 rounded-2xl border border-white/5 bg-white/2">
                      <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-4">Inventory Depth</p>
                      <p className="text-4xl font-bold tracking-tighter">{products.length} <span className="text-xs text-gray-600 font-mono">SKUs</span></p>
                    </div>
                    <div className="p-8 rounded-2xl border border-white/5 bg-white/2">
                      <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-4">Critical Stock</p>
                      <p className="text-4xl font-bold tracking-tighter text-premium-red">{products.filter(p => p.stock < 10).length}</p>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'Inventory' && (
                <div className="space-y-6">
                  {isAdding && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="p-8 bg-white/2 border border-white/10 rounded-2xl mb-8 space-y-6"
                    >
                      <h4 className="text-xs font-bold uppercase tracking-widest text-premium-red">Add New Product</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input id="new-name" placeholder="PRODUCT NAME" className="bg-black border border-white/10 p-4 rounded-xl text-sm font-medium outline-none focus:border-premium-red" />
                        <input id="new-price" type="number" placeholder="WHOLESALE PRICE (RS)" className="bg-black border border-white/10 p-4 rounded-xl text-sm font-medium outline-none focus:border-premium-red" />
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={async () => {
                            const name = (document.getElementById('new-name') as HTMLInputElement).value;
                            const price = Number((document.getElementById('new-price') as HTMLInputElement).value);
                            if (name && price) {
                              await productService.addProduct({
                                name,
                                price,
                                brand: 'Dahua',
                                category: 'Bullet',
                                stock: 10,
                                description: 'Premium surveillance hardware.',
                                images: ['https://picsum.photos/seed/new/800/800'],
                                specifications: { Resolution: '4MP' }
                              });
                              setIsAdding(false);
                              onRefresh();
                            }
                          }}
                          className="bg-premium-red text-white px-8 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest hover:brightness-110 shadow-lg shadow-premium-red/20"
                        >
                          Confirm & Save
                        </button>
                        <button onClick={() => setIsAdding(false)} className="px-8 py-3 border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all">Cancel</button>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="grid gap-3">
                    {products.map((p) => (
                      <div key={p.id} className="flex items-center gap-4 p-5 bg-white/2 border border-white/5 rounded-2xl hover:bg-white/5 transition-all">
                        <div className="flex-1">
                          <h4 className="text-xs font-bold uppercase tracking-wider">{p.name}</h4>
                          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">{p.brand} — {p.category}</p>
                        </div>
                        <div className="text-right px-8 border-x border-white/5">
                          <p className="text-sm font-mono font-bold text-premium-red">Rs. {p.price.toLocaleString()}</p>
                        </div>
                        <button onClick={() => handleDelete(p.id)} className="p-3 hover:bg-premium-red/10 rounded-full transition-all group">
                          <Trash2 className="w-4 h-4 text-gray-600 group-hover:text-premium-red" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Orders' && (
                <div className="flex flex-col items-center justify-center h-full text-white/10">
                  <Truck className="w-20 h-20 mb-6" />
                  <p className="text-sm uppercase tracking-widest font-bold">No Orders Yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-4 bg-black border-t border-white/5 flex justify-center items-center">
          <p className="text-[10px] text-gray-500 font-medium">
            &copy; 2026 Hussain Electronics Admin Dashboard
          </p>
        </div>
      </motion.div>
    </div>
  );
}
