create table habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text,
  completed boolean default false,
  created_at timestamp with time zone default now()
);
