-- ============ REVIEWS ============
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A user can only review another user once per listing
  unique (reviewer_id, target_id, listing_id)
);

alter table public.reviews enable row level security;

create index reviews_target_idx on public.reviews(target_id);
create index reviews_reviewer_idx on public.reviews(reviewer_id);

-- Everyone can read reviews
create policy "Reviews are publicly readable"
  on public.reviews for select
  using (true);

-- Authenticated users can create reviews (but not for themselves)
create policy "Users can create reviews"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id and auth.uid() <> target_id);

-- Users can update their own reviews
create policy "Users can update own reviews"
  on public.reviews for update
  using (auth.uid() = reviewer_id);

-- Users can delete their own reviews
create policy "Users can delete own reviews"
  on public.reviews for delete
  using (auth.uid() = reviewer_id);

create trigger handle_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();
