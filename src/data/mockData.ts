import { Product, Testimonial } from '@/src/types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Hikvision 2MP IP Bullet Camera',
    description: 'High quality imaging with 2MP resolution, efficient H.265+ compression technology, Water and dust resistant (IP67).',
    price: 5500,
    category: 'Bullet',
    brand: 'Hikvision',
    resolution: '2MP',
    stock: 45,
    images: ['https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80&auto=format&fit=crop'],
    specifications: {
      Sensor: '1/2.8" Progressive Scan CMOS',
      Resolution: '1920 × 1080',
      Lens: '2.8mm Fixed',
      Protection: 'IP67 Waterproof'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Hikvision 5MP Dome Audio Camera',
    description: 'High quality imaging with 5MP resolution, efficient H.265+ compression technology, Water and dust resistant (IP67).',
    price: 9200,
    category: 'Dome',
    brand: 'Hikvision',
    resolution: '5MP',
    stock: 15,
    images: ['https://images.unsplash.com/photo-1549109926-58f039549485?w=800&q=80&auto=format&fit=crop'],
    specifications: {
      Resolution: '2560 × 1944',
      Audio: 'Built-in Mic',
      IRRange: 'Up to 30m'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Hikvision 4-Inch 2MP PTZ',
    description: '25× optical zoom, excellent low-light performance, up to 100 m IR distance.',
    price: 32000,
    category: 'PTZ',
    brand: 'Hikvision',
    resolution: '2MP',
    stock: 8,
    images: ['https://images.unsplash.com/photo-1563514757620-1a76c8c4bb58?w=800&q=80&auto=format&fit=crop'],
    specifications: {
      Zoom: '25x Optical',
      NightVision: 'IR 100m',
      Feature: 'Continuous Panning'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Hikvision 8CH PoE NVR',
    description: 'Up to 8-ch IP camera inputs. Plug & Play with 8 Power-over-Ethernet (PoE) interfaces.',
    price: 18000,
    category: 'NVR/DVR',
    brand: 'Hikvision',
    stock: 12,
    images: ['https://images.unsplash.com/photo-1621360841013-c76831f1e31e?w=800&q=80&auto=format&fit=crop'],
    specifications: {
      Channels: '8 CH PoE',
      Compression: 'H.265+',
      Recording: 'Up to 8MP'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Hikvision 8CH Turbo HD DVR',
    description: '8 channels and 1 HDD 1U DVR. Efficient H.265 pro+ compression technology.',
    price: 11000,
    category: 'NVR',
    brand: 'Hikvision',
    resolution: '4MP Lite',
    stock: 25,
    images: ['https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?w=800&q=80&auto=format&fit=crop'],
    specifications: {
      Channels: '8 CH Analog',
      Network: '1 RJ45',
      Storage: '1 SATA up to 4TB'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Dahua 4MP ColorVu Bullet',
    description: 'Full Color 24/7 imaging, Smart IR, built-in mic, Water and dust resistant.',
    price: 7800,
    category: 'Bullet',
    brand: 'Dahua',
    resolution: '4MP',
    stock: 30,
    images: ['https://images.unsplash.com/photo-1485600669145-a4ee1105e466?w=800&q=80&auto=format&fit=crop'],
    specifications: {
      NightStyle: 'Full Color 24/7',
      Housing: 'Metal + Plastic',
      Warranty: '2 Years'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Imran Khan',
    role: 'Warehouse Manager',
    text: 'Hussain Electronics is our go-to for all security needs. Their wholesale rates are unbeatable in Faisalabad.',
    photo: 'https://i.pravatar.cc/150?u=imran'
  },
  {
    id: '2',
    name: 'Sajid Mehmood',
    role: 'Tech Consultant',
    text: 'Highly professional team. Malik Abid is very knowledgeable and helped us design the perfect security layout.',
    photo: 'https://i.pravatar.cc/150?u=sajid'
  },
  {
    id: '3',
    name: 'Zubair Ahmad',
    role: 'Shop Owner',
    text: 'Original Dahua and Hikvision products at genuine prices. Fast delivery and excellent after-sales support.',
    photo: 'https://i.pravatar.cc/150?u=zubair'
  }
];
