-- WISER database setup. Run once in the Supabase SQL Editor,
-- AFTER creating your own user under Authentication > Users.

-- Only users listed here can write. The last statement adds your account.
create table public.authors (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table public.articles (
  id uuid primary key,
  slug text unique,
  title text not null default '',
  subtitle text not null default '',
  body text not null default '',
  cover text not null default '',
  tags text[] not null default '{}',
  read_time integer not null default 1,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_published_at_idx on public.articles (published_at desc);

alter table public.authors enable row level security;
alter table public.articles enable row level security;

grant select on public.authors to authenticated;
grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;

create policy "Users can see their own author row"
  on public.authors for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Anyone can read published articles"
  on public.articles for select to anon, authenticated
  using (published_at is not null);

create policy "Authors can manage all articles"
  on public.articles for all to authenticated
  using (exists (select 1 from public.authors where user_id = (select auth.uid())))
  with check (exists (select 1 from public.authors where user_id = (select auth.uid())));

-- Article images: readable by URL, 5 MB max, uploaded only by authors.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-images',
  'article-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
);

create policy "Authors can upload article images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'article-images'
    and exists (select 1 from public.authors where user_id = (select auth.uid()))
  );

-- Makes every user that exists right now an author.
insert into public.authors (user_id) select id from auth.users;
