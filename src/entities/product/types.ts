export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  stemNote?: string;
  price: number;
  imageUrl: string;
  category: string;
  aiPrompt?: string;
}
