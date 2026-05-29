-- 🧹 CLEANUP: Remove old tables if they exist
drop table if exists public.attendance cascade;
drop table if exists public.events cascade;
drop table if exists public.transactions cascade;
drop table if exists public.members cascade;
drop table if exists public.profiles cascade;
drop table if exists public.bible_studies cascade;
drop table if exists public.resources cascade;
drop table if exists public.pledges cascade;
drop table if exists public.prayer_requests cascade;
drop table if exists public.groups cascade;
drop table if exists public.group_members cascade;
drop table if exists public.child_checkins cascade;

-- RTCI - NEW CENTRALIZED SCHEMA

-- 1. PROFILES TABLE
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text,
  title text, -- ministerial title, e.g. "Head of Music", "Resident Pastor"
  avatar_url text, -- profile picture
  role text default 'member', -- developer, admin, department_head, member
  department text, -- nullable, used for department_head and member scoping
  campus text, -- Added for multi-campus support
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

-- 2. RBAC HELPER FUNCTIONS (Created after profiles table)
create or replace function public.get_my_role() 
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function public.get_my_department() 
returns text as $$
  select department from public.profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function public.get_my_campus() 
returns text as $$
  select campus from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- 3. PROFILES POLICIES
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

-- 4. MEMBERS TABLE
create table public.members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique, 
  phone text,
  address text,
  dob date,
  department text,
  membership_type text,
  status text default 'active',
  occupation text,
  family_id text,
  baptism_date date,
  confirmation_date date,
  campus text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.members enable row level security;

create policy "Dept Heads can view members in their department."
  on members for select using (
    get_my_role() = 'department_head' and (department = get_my_department() and get_my_department() is not null)
  );

create policy "Admins, Developers and Pastors can view all members."
  on members for select using (
    get_my_role() in ('admin', 'developer', 'pastor')
  );

create policy "Members can view their own record."
  on members for select using (
    email = (select email from public.profiles where id = auth.uid())
  );

create policy "Dept Heads can manage members in their department."
  on members for all using (
    get_my_role() = 'department_head' and (department = get_my_department() and get_my_department() is not null)
  );

create policy "Admins, Developers and Pastors can manage all members."
  on members for all using (
    get_my_role() in ('admin', 'developer', 'pastor')
  );

-- 5. TRANSACTIONS TABLE
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete set null,
  description text,
  amount numeric not null,
  type text, -- contribution, expense
  category text, 
  department text, 
  campus text,
  date timestamp with time zone default timezone('utc'::text, now())
);

alter table public.transactions enable row level security;

create policy "Users can view their own transactions."
  on transactions for select using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.email = p.email
      where p.id = auth.uid() and m.id = transactions.member_id
    )
  );

create policy "Dept Heads can view transactions in their department."
  on transactions for select using (
    get_my_role() = 'department_head' and (department = get_my_department() or get_my_department() is null)
  );

create policy "Admins and Developers can view all transactions."
  on transactions for select using (
    get_my_role() in ('admin', 'developer')
  );

-- 6. PRAYER REQUESTS
create table public.prayer_requests (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade,
  request text not null,
  status text default 'pending', -- pending, praying, answered
  is_private boolean default false,
  campus text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.prayer_requests enable row level security;

create policy "Users can view their own prayer requests."
  on prayer_requests for select using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.email = p.email
      where p.id = auth.uid() and m.id = prayer_requests.member_id
    )
  );

create policy "Pastors and Admins can view all prayer requests."
  on prayer_requests for select using (
    get_my_role() in ('admin', 'developer', 'pastor')
  );

create policy "Users can submit their own prayer requests."
  on prayer_requests for insert with check (
    exists (
      select 1 from public.profiles p
      join public.members m on m.email = p.email
      where p.id = auth.uid() and m.id = member_id
    )
  );

-- 7. PLEDGES & WELFARE
create table public.pledges (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade,
  amount numeric not null,
  purpose text,
  status text default 'pending', -- pending, partially_paid, paid
  due_date date,
  campus text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.pledges enable row level security;

create policy "Users can view their own pledges."
  on pledges for select using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.email = p.email
      where p.id = auth.uid() and m.id = pledges.member_id
    )
  );

create policy "Admins and Dept Heads can view all pledges."
  on pledges for select using (
    get_my_role() in ('admin', 'developer', 'department_head')
  );

-- 8. GROUPS / CELLS
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  leader_id uuid references public.members(id) on delete set null,
  type text, -- home_cell, ministry, volunteer_rota
  campus text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.groups enable row level security;

create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  primary key (group_id, member_id)
);

alter table public.group_members enable row level security;

create policy "Anyone authenticated can view groups."
  on groups for select using ( auth.role() = 'authenticated' );

create policy "Admins and Dept Heads can manage groups."
  on groups for all using (
    get_my_role() in ('admin', 'developer', 'department_head')
  );

create policy "Anyone authenticated can view group memberships."
  on group_members for select using ( auth.role() = 'authenticated' );

create policy "Admins and Dept Heads can manage group memberships."
  on group_members for all using (
    get_my_role() in ('admin', 'developer', 'department_head')
  );

-- 9. CHILD SAFETY CHECK-IN
create table public.child_checkins (
  id uuid default gen_random_uuid() primary key,
  child_name text not null,
  parent_name text not null,
  parent_phone text not null,
  tag_number text not null,
  status text default 'checked_in', -- checked_in, checked_out
  checked_in_at timestamp with time zone default timezone('utc'::text, now()),
  checked_out_at timestamp with time zone,
  campus text
);

alter table public.child_checkins enable row level security;

create policy "Admins and Dept Heads can view child check-ins."
  on child_checkins for select using (
    get_my_role() in ('admin', 'developer', 'department_head')
  );

create policy "Admins and Dept Heads can manage child check-ins."
  on child_checkins for all using (
    get_my_role() in ('admin', 'developer', 'department_head')
  );

-- 10. EVENTS TABLE
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

-- 11. ATTENDANCE TABLE
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  date timestamp with time zone not null,
  attendees jsonb, -- Array of member objects (legacy/detailed)
  headcount integer, -- Simple numeric count (new preferred method)
  department text, -- Added for scoping
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.attendance enable row level security;

create policy "Dept Heads can view attendance for their department."
  on attendance for select using (
    get_my_role() = 'department_head' and department = get_my_department()
  );

create policy "Admins, Developers and Pastors can view all attendance."
  on attendance for select using (
    get_my_role() in ('admin', 'developer', 'pastor')
  );

create policy "Dept Heads can manage attendance for their department."
  on attendance for all using (
    get_my_role() = 'department_head' and department = get_my_department()
  );

create policy "Admins, Developers and Pastors can manage all attendance."
  on attendance for all using (
    get_my_role() in ('admin', 'developer', 'pastor')
  );

-- 12. BIBLE STUDIES & RESOURCES
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

-- 13. TRIGGER FOR AUTOMATIC PROFILE CREATION
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, department)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', ''), 
    'member',
    new.raw_user_meta_data->>'department'
  )
  on conflict (id) do nothing;
    
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 14. REALTIME: Enable for all tables
drop publication if exists supabase_realtime;
create publication supabase_realtime for table members, transactions, events, bible_studies, resources, attendance, profiles, pledges, prayer_requests, groups, group_members, child_checkins;

-- 15. DAILY INSIGHTS (Verse of the Day & Quotes)
create table public.daily_insights (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  reference text, -- For bible verses
  author text,    -- For quotes
  type text not null, -- 'verse', 'quote'
  is_active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.daily_insights enable row level security;

create policy "Anyone authenticated can view active insights."
  on daily_insights for select using ( auth.role() = 'authenticated' and is_active = true );

create policy "Admins and Pastors can manage insights."
  on daily_insights for all using (
    get_my_role() in ('admin', 'developer', 'pastor')
  );

-- Update realtime to include daily_insights
alter publication supabase_realtime add table daily_insights;

-- 16. SERVICE MEDIA / GALLERY
create table public.service_images (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  description text,
  service_date timestamp with time zone default timezone('utc'::text, now()),
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.service_images enable row level security;

create policy "Anyone authenticated can view gallery."
  on service_images for select using ( auth.role() = 'authenticated' );

create policy "Pastors, Admins and Dept Heads can manage gallery."
  on service_images for all using (
    get_my_role() in ('admin', 'developer', 'pastor', 'department_head')
  );

-- Update realtime to include service_images
alter publication supabase_realtime add table service_images;


-- 17. SUPABASE STORAGE BUCKETS & RLS POLICIES
-- Create buckets if they do not already exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('service-gallery', 'service-gallery', true),
  ('official-profiles', 'official-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Row-Level Security for storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Set up Policies for "service-gallery" Bucket
-- Allow public (anyone) to read/select images in the service gallery
CREATE POLICY "Public Access to service-gallery"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-gallery');

-- Allow authenticated users with admin/developer/pastor/department_head role to upload to service-gallery
CREATE POLICY "Authenticated users can upload to service-gallery"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-gallery' 
  AND auth.role() = 'authenticated'
  AND (public.get_my_role() IN ('admin', 'developer', 'pastor', 'department_head'))
);

-- Allow authorized users to delete from service-gallery
CREATE POLICY "Authenticated users can delete from service-gallery"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'service-gallery'
  AND auth.role() = 'authenticated'
  AND (public.get_my_role() IN ('admin', 'developer', 'pastor', 'department_head'))
);

-- Set up Policies for "official-profiles" Bucket (Avatars)
-- Allow public (anyone) to view profile pictures
CREATE POLICY "Public Access to official-profiles"
ON storage.objects FOR SELECT
USING (bucket_id = 'official-profiles');

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload to official-profiles"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'official-profiles' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update/delete avatars
CREATE POLICY "Authenticated users can update official-profiles"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'official-profiles'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete from official-profiles"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'official-profiles'
  AND auth.role() = 'authenticated'
);

-- 15. CARE RECOMMENDATIONS (FELLOWSHIP CARE QUEUE)
create table public.care_recommendations (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade not null,
  absence_count integer default 4,
  last_attended_date timestamp with time zone,
  status text default 'Pending', -- Pending, Contacted, Visited, Resolved, Ignored
  pastoral_notes text,
  campus text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.care_recommendations enable row level security;

create policy "Pastors, Admins and Developers can view care recommendations."
  on care_recommendations for select using (
    get_my_role() in ('admin', 'developer', 'pastor')
  );

create policy "Pastors, Admins and Developers can manage care recommendations."
  on care_recommendations for all using (
    get_my_role() in ('admin', 'developer', 'pastor')
  );


