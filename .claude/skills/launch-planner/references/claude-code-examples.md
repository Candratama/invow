# Claude Code Prompt Examples

Effective Claude Code prompts for different MVP types using the Launch Planner tech stack.

---

## Example 1: Simple CRUD App (Task Manager)

```
Build a task management app called TaskSnap that lets busy professionals quickly capture and complete tasks.

Core loop:
1. User adds task via quick-input form (autofocused)
2. User sees today's tasks in a simple list
3. User marks tasks complete/incomplete with a toggle

Use Next.js 14 with App Router, TypeScript, Tailwind CSS, and Supabase.

Key features:
- Landing page with auto-focused task input at top
- Task list below showing only incomplete tasks for today
- Each task has a checkbox to toggle complete/incomplete
- Completed tasks show with strikethrough and fade out after 2 seconds
- Voice input button using browser Speech Recognition API

Database schema:
```sql
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  title text not null,
  completed boolean default false,
  created_at timestamp with time zone default now()
);

-- Row Level Security
alter table tasks enable row level security;

create policy "Users can CRUD their own tasks"
  on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

For Supabase:
- Use Supabase Auth with Google OAuth
- Set up RLS policies as shown above
- Use Supabase client for real-time task updates

Deploy to Vercel.

Focus on getting a working MVP that can validate the idea with real users. Prioritize functionality over polish.
```

---

## Example 2: Content/Feed App (Link Saver)

```
Build a link-saving app called LinkStash that helps users save interesting articles and actually read them later.

Core loop:
1. User saves link by pasting URL or via bookmarklet
2. User browses saved links in a clean grid with thumbnails
3. User clicks links to read or archives them when done

Use Next.js 14 with App Router, TypeScript, Tailwind CSS, and Supabase.

Key features:
- Save form at top: paste URL, click save
- Grid of saved links with auto-generated thumbnails (use og:image or first image)
- Each card shows title, domain, thumbnail, and "Archive" button
- Archived links move to separate "Archive" tab
- Generate bookmarklet code users can drag to bookmark bar

Database schema:
```sql
create table links (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  url text not null,
  title text,
  thumbnail_url text,
  domain text,
  archived boolean default false,
  created_at timestamp with time zone default now()
);

alter table links enable row level security;

create policy "Users can CRUD their own links"
  on links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

For Supabase:
- Use Supabase Auth with Google OAuth
- Fetch URL metadata on the server side (using CORS proxy if needed)
- Store thumbnails as URLs (don't use Supabase Storage for MVP)

For the bookmarklet:
Generate JavaScript code users can add to bookmarks that sends current page URL to your app

Deploy to Vercel.

Focus on getting a working MVP that can validate the idea with real users. Prioritize functionality over polish.
```

---

## Example 3: Social/Community App (Daily Prompts)

```
Build a journaling app called DailyPrompt where users write responses to daily creative prompts and read others' entries.

Core loop:
1. User sees today's writing prompt
2. User writes response (minimum 50 words)
3. After submitting, user can read other people's responses

Use Next.js 14 with App Router, TypeScript, Tailwind CSS, and Supabase.

Key features:
- Homepage shows today's prompt (from hardcoded array of 30 prompts, rotating daily)
- Text editor with live word count (must hit 50 words to submit)
- Submit button unlocks the feed
- After submitting, show public feed of all today's responses
- Users can only see feed after they've submitted today's entry

Database schema:
```sql
create table prompts (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  date date not null unique
);

create table entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  prompt_id uuid references prompts not null,
  content text not null,
  word_count int not null,
  created_at timestamp with time zone default now()
);

alter table entries enable row level security;

create policy "Users can create their own entries"
  on entries for insert
  with check (auth.uid() = user_id);

create policy "Users can read entries after submitting"
  on entries for select
  using (
    exists (
      select 1 from entries e
      where e.user_id = auth.uid()
      and e.prompt_id = entries.prompt_id
    )
  );
```

For Supabase:
- Use Supabase Auth with Google OAuth
- Pre-seed prompts table with 30 creative prompts
- Use function to get today's prompt based on date
- Implement RLS so feed only shows after user submits

Deploy to Vercel.

Focus on getting a working MVP that can validate the idea with real users. Prioritize functionality over polish.
```

---

## Example 4: Marketplace/Directory (Local Tutors)

```
Build a local tutor directory called LocalLessons that connects parents with tutors in their area.

Core loop:
1. Parents browse tutor listings filtered by subject and location
2. Parents click on tutor profile to see details
3. Parents click "Request Intro" to reveal tutor's contact email

Use Next.js 14 with App Router, TypeScript, Tailwind CSS, and Supabase.

Key features:
- Browse page with tutor cards (photo, name, subjects, rate, location)
- Filter by subject (dropdown) and zip code (input)
- Tutor profile page with full bio, availability, and rate
- "Request Intro" button reveals tutor email (logged-in users only)
- Tutor signup flow: create profile with name, subjects, rate, bio, email, zip code
- Track intro requests count per tutor

Database schema:
```sql
create table tutors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  email text not null,
  bio text not null,
  subjects text[] not null,
  rate_per_hour int not null,
  zip_code text not null,
  intro_requests_count int default 0,
  created_at timestamp with time zone default now()
);

create table intro_requests (
  id uuid primary key default uuid_generate_v4(),
  parent_user_id uuid references auth.users not null,
  tutor_id uuid references tutors not null,
  created_at timestamp with time zone default now(),
  unique(parent_user_id, tutor_id)
);

alter table tutors enable row level security;
alter table intro_requests enable row level security;

create policy "Anyone can view tutors"
  on tutors for select
  using (true);

create policy "Users can create their tutor profile"
  on tutors for insert
  with check (auth.uid() = user_id);

create policy "Users can request intros"
  on intro_requests for insert
  with check (auth.uid() = parent_user_id);

create policy "Users can view their intro requests"
  on intro_requests for select
  using (auth.uid() = parent_user_id);
```

For Supabase:
- Use Supabase Auth with Google OAuth
- Create function to increment intro_requests_count
- Filter tutors by subject using array contains operator
- Search by zip code (exact match for MVP, can expand later)

Deploy to Vercel.

Focus on getting a working MVP that can validate the idea with real users. Prioritize functionality over polish.
```

---

## Example 5: Data Visualization App (Personal Analytics)

```
Build a habit tracker called StreakFlow that visualizes daily check-ins with beautiful calendar views.

Core loop:
1. User checks in for today with one click
2. User sees calendar heatmap of past check-ins
3. User views current streak count

Use Next.js 14 with App Router, TypeScript, Tailwind CSS, and Supabase.

Key features:
- Big "Check In Today" button (disabled if already checked in today)
- Calendar heatmap showing last 12 months (like GitHub contributions)
- Current streak counter with animation when incrementing
- Total check-ins counter
- Simple list view of check-in history

Database schema:
```sql
create table check_ins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  date date not null,
  created_at timestamp with time zone default now(),
  unique(user_id, date)
);

alter table check_ins enable row level security;

create policy "Users can CRUD their own check-ins"
  on check_ins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

For Supabase:
- Use Supabase Auth with Google OAuth
- Query check-ins for the last year on page load
- Calculate streak on client side from check-ins array
- Use Supabase Realtime to update when check-in is added

For visualization:
- Use a simple grid of divs for the heatmap (one per day)
- Color intensity based on check-in (binary: checked in or not)
- Show tooltip with date on hover

Deploy to Vercel.

Focus on getting a working MVP that can validate the idea with real users. Prioritize functionality over polish.
```

---

## Prompt Template Structure

All effective Launch Planner prompts follow this structure:

1. **One-line description** - App name + who it's for + core action
2. **Core loop** - 3 numbered steps showing the user flow
3. **Tech stack** - Always the same default stack
4. **Key features** - Specific implementation details (3-5 features)
5. **Database schema** - Actual SQL with RLS policies
6. **Supabase specifics** - Auth setup and any special features
7. **Deploy** - Vercel (always)
8. **Closing** - "Focus on MVP, functionality over polish"

### Tips for Better Prompts

**Be specific about implementation:**
- Good: "Text editor with live word count (must hit 50 words to submit)"
- Bad: "Text editor for writing"

**Include actual database schemas:**
- Always provide CREATE TABLE statements
- Always include RLS policies
- Show table relationships clearly

**Specify edge cases:**
- "Disabled if already checked in today"
- "Only visible after user submits"
- "Fade out after 2 seconds"

**Keep it under 200 lines:**
- Long prompts cause Claude Code to miss details
- Split complex apps into phases

**Request specific libraries when needed:**
- "Using browser Speech Recognition API"
- "Like GitHub contributions heatmap"
- "Generate bookmarklet code"

### What NOT to Include

Don't ask for:
- ❌ Complex authentication flows (just Google OAuth)
- ❌ Payment processing (validate first, monetize later)
- ❌ Admin dashboards (use Supabase directly)
- ❌ Mobile apps (responsive web first)
- ❌ Perfect UI (functional is enough)
- ❌ Comprehensive error handling (Claude Code adds this)
- ❌ Testing setup (add after MVP validates)

Remember: These prompts should help you ship in 1 week or less.
