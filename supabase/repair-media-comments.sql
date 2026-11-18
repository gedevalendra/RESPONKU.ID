-- Jika SUPABASE_STORAGE_BUCKET bukan 'articles', ganti kedua nilai di bawah.
-- Gunakan bucket khusus gambar publik ResponKu.
begin;

insert into storage.buckets (id, name, public)
values ('articles', 'articles', true)
on conflict (id) do update set public = true;

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists background_url text;
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
alter table public.comments add column if not exists author_id uuid references public.profiles(id) on delete set null;
alter table public.comments add column if not exists oauth_author_id text;

create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  visitor_id text not null,
  reaction text not null check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  unique (comment_id, visitor_id)
);

alter table public.comment_reactions enable row level security;
grant select, insert, update, delete on public.comment_reactions to service_role;
create index if not exists comments_parent_idx on public.comments(parent_id, created_at asc);
notify pgrst, 'reload schema';

commit;
