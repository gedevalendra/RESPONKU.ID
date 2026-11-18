begin;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title varchar(120) not null,
  body varchar(500) not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Akun OAuth memakai ID teks yang tidak berasal dari auth.users.
drop policy if exists "users read own notifications" on public.notifications;
drop policy if exists "users mark own notifications" on public.notifications;
alter table public.notifications drop constraint if exists notifications_user_id_fkey;
alter table public.notifications alter column user_id type text using user_id::text;
alter table public.notifications enable row level security;
create policy "users read own notifications" on public.notifications
  for select using (auth.uid()::text = user_id);
create policy "users mark own notifications" on public.notifications
  for update using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);
grant select, insert, update on public.notifications to service_role;
create index if not exists notifications_unread_user_idx
  on public.notifications (user_id) where read_at is null;
notify pgrst, 'reload schema';

commit;
