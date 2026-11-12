-- WISER update 2: reader accounts, views, hearts and comments.
-- Run once in the Supabase SQL Editor, after schema.sql.
--
-- Anyone can now sign up, but only rows in public.authors can write articles.
-- Never again run "insert into public.authors select id from auth.users":
-- with public sign-ups that would make every reader an author.

-- Public profile shown next to comments. Email is never exposed.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Reader'
    check (char_length(display_name) between 1 and 80),
  avatar_url text not null default ''
);

alter table public.profiles enable row level security;
grant select on public.profiles to anon, authenticated;

create policy "Profiles are public"
  on public.profiles for select to anon, authenticated
  using (true);

-- Name comes from the sign-up form or Google. Avatars only come from Google,
-- because email sign-up metadata is whatever the browser sends.
create function public.profile_name(meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(coalesce(
    nullif(trim(meta ->> 'display_name'), ''),
    nullif(trim(meta ->> 'full_name'), ''),
    nullif(trim(meta ->> 'name'), ''),
    'Reader'
  ), 80);
$$;

create function public.profile_avatar(app_meta jsonb, meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when app_meta ->> 'provider' = 'google'
      and coalesce(meta ->> 'avatar_url', meta ->> 'picture', '') like 'https://%'
    then coalesce(meta ->> 'avatar_url', meta ->> 'picture')
    else ''
  end;
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    public.profile_name(new.raw_user_meta_data),
    public.profile_avatar(new.raw_app_meta_data, new.raw_user_meta_data)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, display_name, avatar_url)
select
  id,
  public.profile_name(raw_user_meta_data),
  public.profile_avatar(raw_app_meta_data, raw_user_meta_data)
from auth.users
on conflict (id) do nothing;

-- Counters live on the article so the page needs one request to show them.
alter table public.articles
  add column views integer not null default 0,
  add column hearts_count integer not null default 0,
  add column comments_count integer not null default 0;

create function public.record_view(article_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.articles
  set views = views + 1
  where id = article_id and published_at is not null;
$$;

revoke execute on function public.record_view(uuid) from public;
grant execute on function public.record_view(uuid) to anon, authenticated;

-- One heart per reader per article.
create table public.hearts (
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

alter table public.hearts enable row level security;
grant select, insert, delete on public.hearts to authenticated;

create policy "Readers see their own hearts"
  on public.hearts for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Readers heart published articles"
  on public.hearts for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.articles a
      where a.id = article_id and a.published_at is not null
    )
  );

create policy "Readers remove their own hearts"
  on public.hearts for delete to authenticated
  using (user_id = (select auth.uid()));

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index comments_article_idx on public.comments (article_id, created_at desc);

alter table public.comments enable row level security;
grant select on public.comments to anon, authenticated;
grant insert, delete on public.comments to authenticated;

create policy "Comments are public"
  on public.comments for select to anon, authenticated
  using (true);

create policy "Readers comment on published articles"
  on public.comments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.articles a
      where a.id = article_id and a.published_at is not null
    )
  );

create policy "Readers delete their own comments, authors delete any"
  on public.comments for delete to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.authors where user_id = (select auth.uid()))
  );

-- Recount instead of +1/-1 so the numbers can't drift.
create function public.sync_article_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  if tg_op = 'DELETE' then
    target := old.article_id;
  else
    target := new.article_id;
  end if;

  update public.articles
  set
    hearts_count = (select count(*) from public.hearts where article_id = target),
    comments_count = (select count(*) from public.comments where article_id = target)
  where id = target;
  return null;
end;
$$;

create trigger hearts_count_sync
  after insert or delete on public.hearts
  for each row execute function public.sync_article_counts();

create trigger comments_count_sync
  after insert or delete on public.comments
  for each row execute function public.sync_article_counts();
