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
  content: string[];
  contentBlocks?: ArticleBlock[];
  status?: "draft" | "pending" | "published" | "rejected";
  authorId?: string;
  authorEmail?: string;
  rejectionReason?: string;
  submittedAt?: string;
  updatedAt?: string;
}

export type ArticleBlock =
  | { id: string; type: "text"; text: string }
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "image"; url: string; alt: string; caption?: string }
  | { id: string; type: "quote"; text: string; attribution?: string }
  | { id: string; type: "divider" };

export type Comment = {
  id: string;
  articleSlug: string;
  displayName: string;
  body: string;
  createdAt: string;
  status: "published" | "pending";
};

export type ReactionSummary = { like: number; insightful: number; celebrate: number };

export type UserRole = "reader" | "author" | "admin" | "superadmin";
export type Profile = { id: string; email: string; displayName: string; role: UserRole; username?: string; organization?: string; avatarUrl?: string; provider?: "supabase" | "google" | "funikin"; emailConfirmed?: boolean };
