-- ============ ENUMS ============
create type public.app_role as enum ('admin', 'user');
create type public.listing_category as enum (
  'electronics', 'vehicles', 'property', 'fashion', 'home', 'jobs', 'services', 'hobbies', 'other'
);
create type public.listing_status as enum ('active', 'sold', 'pending', 'removed');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  avatar_url text,
  phone text,
  bio text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Roles are viewable by self or admin"
  on public.user_roles for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ LISTINGS ============
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'USD',
  category listing_category not null,
  location text not null,
  images text[] not null default '{}',
  status listing_status not null default 'active',
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_seller_idx on public.listings(seller_id);
create index listings_category_idx on public.listings(category);
create index listings_status_idx on public.listings(status);
create index listings_created_idx on public.listings(created_at desc);
create index listings_price_idx on public.listings(price);

alter table public.listings enable row level security;

create policy "Active listings are viewable by everyone"
  on public.listings for select
  using (status = 'active' or seller_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Users can create their own listings"
  on public.listings for insert
  with check (auth.uid() = seller_id);
create policy "Sellers can update their own listings"
  on public.listings for update
  using (auth.uid() = seller_id or public.has_role(auth.uid(), 'admin'));
create policy "Sellers can delete their own listings"
  on public.listings for delete
  using (auth.uid() = seller_id or public.has_role(auth.uid(), 'admin'));

-- ============ WISHLISTS ============
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);
alter table public.wishlists enable row level security;
create index wishlists_user_idx on public.wishlists(user_id);

create policy "Users view own wishlist"
  on public.wishlists for select using (auth.uid() = user_id);
create policy "Users add to own wishlist"
  on public.wishlists for insert with check (auth.uid() = user_id);
create policy "Users remove from own wishlist"
  on public.wishlists for delete using (auth.uid() = user_id);

-- ============ CONVERSATIONS ============
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);
alter table public.conversations enable row level security;
create index conversations_buyer_idx on public.conversations(buyer_id);
create index conversations_seller_idx on public.conversations(seller_id);

create policy "Participants view conversations"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Buyers create conversations"
  on public.conversations for insert
  with check (auth.uid() = buyer_id and auth.uid() <> seller_id);
create policy "Participants update conversations"
  on public.conversations for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ============ MESSAGES ============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create index messages_conversation_idx on public.messages(conversation_id, created_at);

create policy "Participants view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );
create policy "Participants send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );
create policy "Senders update own messages"
  on public.messages for update
  using (auth.uid() = sender_id);

-- ============ TRIGGERS ============
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger listings_set_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

-- Bump conversation last_message_at on new message
create or replace function public.bump_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = now() where id = new.conversation_id;
  return new;
end;
$$;
create trigger messages_bump_conversation after insert on public.messages
  for each row execute function public.bump_conversation();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ STORAGE ============
insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Listing images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'listings');
create policy "Authenticated users can upload listing images to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'listings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users can update own listing images"
  on storage.objects for update
  using (bucket_id = 'listings' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own listing images"
  on storage.objects for delete
  using (bucket_id = 'listings' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatars are publicly readable"
  on storage.objects for select using (bucket_id = 'avatars');
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============ REALTIME ============
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
