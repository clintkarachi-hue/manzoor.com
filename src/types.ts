export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "Bullet" | "Dome" | "PTZ" | "NVR/DVR" | "Accessories" | "Solar" | "IP Camera";
  brand: "Dahua" | "Hikvision" | "Uniview" | "Tiandy" | "Other";
  resolution?: string;
  stock: number;
  images: string[];
  specifications: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: { productId: string; quantity: number; priceAtOrder: number; name: string }[];
  total: number;
  status: "Pending" | "Confirmed" | "Dispatched" | "Delivered";
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  photo?: string;
}
