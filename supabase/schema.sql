-- Jalankan di Supabase SQL Editor.
create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  display_name varchar(100) not null default 'Pembaca',
  username varchar(50),
  organization varchar(150),
  avatar_url text,
  role text not null default 'reader' check (role in ('reader', 'author', 'admin', 'superadmin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists username varchar(50);
alter table public.profiles add column if not exists organization varchar(150);
alter table public.profiles add column if not exists avatar_url text;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))) on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  article_slug text not null,
  display_name varchar(60) not null,
  body varchar(2000) not null,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists comments_article_status_idx on public.comments(article_slug, status, created_at desc);

create table if not exists public.article_reactions (
  id uuid primary key default gen_random_uuid(),
  article_slug text not null,
  visitor_id text not null,
  reaction text not null check (reaction in ('like', 'insightful', 'celebrate')),
  created_at timestamptz not null default now(),
  unique(article_slug, visitor_id)
);
create index if not exists article_reactions_article_idx on public.article_reactions(article_slug);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_slug text not null,
  created_at timestamptz not null default now(),
  unique(user_id, article_slug)
);

alter table public.comments enable row level security;
alter table public.article_reactions enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.bookmarks enable row level security;
alter table public.profiles enable row level security;

-- Public reads are intentionally limited to published comments.
create policy "published comments are readable" on public.comments for select using (status = 'published');
create policy "anonymous comments are submitted for moderation" on public.comments for insert with check (status = 'pending');
create policy "reaction counts are readable" on public.article_reactions for select using (true);
create policy "visitors can react" on public.article_reactions for insert with check (length(visitor_id) >= 8);
create policy "newsletter signup" on public.newsletter_subscribers for insert with check (true);
create policy "users manage own bookmarks" on public.bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own profile" on public.profiles for select using (auth.uid() = id);

-- Enable Supabase Realtime for live comment updates.
alter publication supabase_realtime add table public.comments;
