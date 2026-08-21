export type Category =
  | "Ekonomi"
  | "Teknologi"
  | "Politik"
  | "Olahraga"
  | "Budaya";

export interface Article {
  id: string;
  slug: string;
  title: string;
  dek: string;
  category: Category;
  author: string;
  date: string;
  readTime: number;
  views: number;
  breaking?: boolean;
  featured?: boolean;
}
