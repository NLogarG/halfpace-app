-- Run this in your Supabase SQL Editor (one time setup)

-- Users profile (extends Supabase auth.users)
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text,
  level       text default 'intermediate',
  goal_time   text,
  race_date   date,
  train_days  int default 4,
  avatar_url  text,
  created_at  timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read own profile"  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Training sessions
create table public.sessions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles on delete cascade,
  date        date not null,
  type        text not null,
  km          numeric,
  duration    text,
  pace        text,
  hr_avg      int,
  rpe         int,
  notes       text,
  source      text default 'manual', -- 'manual' | 'strava'
  strava_id   bigint,
  created_at  timestamptz default now()
);
alter table public.sessions enable row level security;
create policy "Users manage own sessions" on public.sessions for all using (auth.uid() = user_id);

-- Training plan
create table public.plans (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles on delete cascade,
  week        int not null,
  day_of_week int not null, -- 0=Mon 6=Sun
  type        text not null,
  km          numeric,
  pace_target text,
  zone        text,
  notes       text
);
alter table public.plans enable row level security;
create policy "Users manage own plan" on public.plans for all using (auth.uid() = user_id);

-- Groups
create table public.groups (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  invite_code text unique default upper(substring(gen_random_uuid()::text, 1, 8)),
  created_by  uuid references public.profiles,
  created_at  timestamptz default now()
);
alter table public.groups enable row level security;

create table public.group_members (
  group_id  uuid references public.groups on delete cascade,
  user_id   uuid references public.profiles on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);
alter table public.group_members enable row level security;
create policy "Group members can read group" on public.groups for select
  using (id in (select group_id from public.group_members where user_id = auth.uid()));
create policy "Members can see each other" on public.group_members for select
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));

-- Strava tokens (server only via service role, never exposed to client)
create table public.strava_tokens (
  user_id         uuid references public.profiles primary key,
  access_token    text,
  refresh_token   text,
  expires_at      bigint,
  athlete_id      bigint,
  updated_at      timestamptz default now()
);
alter table public.strava_tokens enable row level security;
-- No client policies — only accessed via API routes with service role key

-- Personal records
create table public.records (
  id        uuid default gen_random_uuid() primary key,
  user_id   uuid references public.profiles on delete cascade,
  distance  text not null, -- '1k','5k','10k','21k'
  time_secs int  not null,
  date      date,
  source    text default 'manual'
);
alter table public.records enable row level security;
create policy "Users manage own records" on public.records for all using (auth.uid() = user_id);

-- Auto-generated session reviews (from Strava webhook)
create table public.session_reviews (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references public.profiles on delete cascade,
  date         date not null,
  strava_id    bigint unique,
  score        int,
  stars        int,
  headline     text,
  blocks       jsonb,
  next_tip     text,
  session_type text,
  seen         boolean default false,
  created_at   timestamptz default now()
);
alter table public.session_reviews enable row level security;
create policy "Users read own reviews" on public.session_reviews for select using (auth.uid() = user_id);
create policy "Users update own reviews" on public.session_reviews for update using (auth.uid() = user_id);
