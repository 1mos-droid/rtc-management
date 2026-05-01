-- 🧹 CLEANUP: Remove old tables if they exist
drop table if exists public.attendance cascade;
drop table if exists public.events cascade;
drop table if exists public.transactions cascade;
drop table if exists public.members cascade;
drop table if exists public.profiles cascade;
drop table if exists public.bible_studies cascade;
drop table if exists public.resources cascade;

-- 🌿 THE LIVING VINE - NEW CENTRALIZED SCHEMA

-- 1. PROFILES TABLE
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text,
  role text default 'member', -- developer, admin, department_head, member
  department text, -- nullable, used for department_head and member scoping
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

-- Helper function to get current user's role
create or replace function public.get_my_role() 
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- Helper function to get current user's department
create or replace function public.get_my_department() 
returns text as $$
  select department from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- Profiles Policies
create policy "Users can view their own profile."
  on profiles for select using ( auth.uid() = id );

create policy "Dept Heads can view profiles in their department."
  on profiles for select using (
    get_my_role() = 'department_head' and department = get_my_department()
  );

create policy "Admins and Developers can view all profiles."
  on profiles for select using (
    get_my_role() in ('admin', 'developer')
  );

create policy "Users can insert their own profile."
  on profiles for insert with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update using ( auth.uid() = id );

create policy "Developers and Admins can update any profile."
  on profiles for update using (
    get_my_role() in ('admin', 'developer')
  );

-- 2. MEMBERS TABLE
create table public.members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  address text,
  dob date,
  department text,
  membership_type text,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.members enable row level security;

create policy "Dept Heads can view members in their department."
  on members for select using (
    get_my_role() = 'department_head' and department = get_my_department()
  );

create policy "Admins and Developers can view all members."
  on members for select using (
    get_my_role() in ('admin', 'developer')
  );

create policy "Dept Heads can manage members in their department."
  on members for all using (
    get_my_role() = 'department_head' and department = get_my_department()
  );

create policy "Admins and Developers can manage all members."
  on members for all using (
    get_my_role() in ('admin', 'developer')
  );

-- 3. TRANSACTIONS TABLE
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete set null,
  description text,
  amount numeric not null,
  type text, -- contribution, expense
  category text, 
  department text, -- Added for scoping
  date timestamp with time zone default timezone('utc'::text, now())
);

alter table public.transactions enable row level security;

create policy "Dept Heads can view transactions in their department."
  on transactions for select using (
    get_my_role() = 'department_head' and department = get_my_department()
  );

create policy "Admins and Developers can view all transactions."
  on transactions for select using (
    get_my_role() in ('admin', 'developer')
  );

create policy "Dept Heads can manage transactions in their department."
  on transactions for all using (
    get_my_role() = 'department_head' and department = get_my_department()
  );

create policy "Admins and Developers can manage all transactions."
  on transactions for all using (
    get_my_role() in ('admin', 'developer')
  );

-- 4. EVENTS TABLE
create table public.events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  date timestamp with time zone not null,
  time text,
  location text,
  is_online boolean default false,
  department text, -- NULL means Admin/Church-wide
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.events enable row level security;

create policy "Users can view relevant events."
  on events for select using (
    department is null 
    or get_my_role() in ('admin', 'developer')
    or department = get_my_department()
  );

create policy "Dept Heads can manage events for their department."
  on events for all using (
    get_my_role() = 'department_head' and department = get_my_department()
  );

create policy "Admins and Developers can manage all events."
  on events for all using (
    get_my_role() in ('admin', 'developer')
  );

-- 5. ATTENDANCE TABLE
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  date timestamp with time zone not null,
  attendees jsonb, 
  department text, -- Added for scoping
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.attendance enable row level security;

create policy "Dept Heads can view attendance for their department."
  on attendance for select using (
    get_my_role() = 'department_head' and department = get_my_department()
  );

create policy "Admins and Developers can view all attendance."
  on attendance for select using (
    get_my_role() in ('admin', 'developer')
  );

create policy "Dept Heads can manage attendance for their department."
  on attendance for all using (
    get_my_role() = 'department_head' and department = get_my_department()
  );

create policy "Admins and Developers can manage all attendance."
  on attendance for all using (
    get_my_role() in ('admin', 'developer')
  );

-- 6. BIBLE STUDIES & RESOURCES
create table public.bible_studies (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subtitle text,
  sessions integer default 1,
  progress integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table public.resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.bible_studies enable row level security;
alter table public.resources enable row level security;

create policy "Authenticated users can view curriculum."
  on bible_studies for select using ( auth.role() = 'authenticated' );
create policy "Authenticated users can view resources."
  on resources for select using ( auth.role() = 'authenticated' );

create policy "Developers and Admins can manage curriculum."
  on bible_studies for all using (
    get_my_role() in ('admin', 'developer')
  );
create policy "Developers and Admins can manage resources."
  on resources for all using (
    get_my_role() in ('admin', 'developer')
  );

-- 7. TRIGGER FOR AUTOMATIC PROFILE CREATION
-- This ensures every new user gets a profile even if client-side insert fails (e.g. due to RLS + email confirmation)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Fail-safe: Use a begin-exception block so that if profile creation fails,
  -- the user is still created in auth.users (prevents the 500 error).
  begin
    insert into public.profiles (id, email, name, role, department)
    values (
      new.id, 
      new.email, 
      coalesce(new.raw_user_meta_data->>'name', ''), 
      coalesce(new.raw_user_meta_data->>'role', 'member'),
      new.raw_user_meta_data->>'department'
    )
    on conflict (id) do nothing;
  exception when others then
    -- Log the error if needed (Postgres logs)
    return new;
  end;
  
  return new;
end;
$$;

-- Trigger should only run after insert into auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. REALTIME: Enable for all tables
drop publication if exists supabase_realtime;
create publication supabase_realtime for table members, transactions, events, bible_studies, resources, attendance, profiles;
