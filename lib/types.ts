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
  promoted?: boolean;
  publishedAt?: string;
  takenDownAt?: string;
  shares?: number;
  thumbnailUrl: string;
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
  | { id: string; type: "text"; text: string; html?: string }
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "image"; url: string; alt: string; caption?: string }
  | { id: string; type: "quote"; text: string; attribution?: string }
  | { id: string; type: "divider" };

export type Comment = {
  role?: UserRole;
  id: string;
  articleSlug: string;
  parentId?: string | null;
  avatarUrl?: string | null;
  displayName: string;
  body: string;
  createdAt: string;
  status: "published" | "pending";
  likes: number;
  dislikes: number;
  viewerReaction?: "like" | "dislike" | null;
};

export type ReactionSummary = {
  like: number;
  insightful: number;
  celebrate: number;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  href?: string;
  readAt?: string | null;
  createdAt: string;
};

export type UserRole = "reader" | "author" | "admin" | "superadmin";
export type Profile = {
  verified?: boolean;
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  username?: string;
  organization?: string;
  avatarUrl?: string;
  backgroundUrl?: string;
  bio?: string;
  provider?: "supabase" | "google" | "funikin";
  emailConfirmed?: boolean;
  linkedOAuth?: boolean;
};
