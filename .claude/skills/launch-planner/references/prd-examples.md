# PRD Examples

Sample PRDs demonstrating the Launch Planner format across different app types.

---

## Example 1: Task Management App

# TaskSnap - Product Requirements Document

## Problem
People forget tasks because switching between apps and notebooks is too much friction.

## User
Busy professionals who need to capture tasks quickly during meetings or on-the-go.

## Success Metric  
10 users capture at least 5 tasks each and mark 50% complete within 1 week.

## Core User Loop
1. Open app and add task (with voice or typing)
2. See today's task list
3. Mark task complete

## V1 Features (1 week scope)
- **Quick add input** - Enables: task capture with autofocus on load
- **Today view** - Enables: seeing current tasks in simple list
- **Complete/uncomplete toggle** - Enables: task completion tracking
- **Voice input** - Enables: hands-free task capture (browser speech API)

## Explicitly NOT Building (V2+)
- Projects/tags - Why: Adds complexity, doesn't serve core loop
- Due dates - Why: Core loop is about today only
- Collaboration/sharing - Why: Single-player mode validates faster
- Mobile app - Why: PWA works for week 1
- Reminders/notifications - Why: Over-engineering, requires infrastructure

## Tech Stack
- Frontend: Next.js + TypeScript + Tailwind
- Backend: Next.js API routes  
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth (Google OAuth)
- Deployment: Vercel

## Week 1 Goal
Launch to 10 beta users (colleagues/friends), get 5 to use it for 3+ consecutive days.

---

## Example 2: Content Curation Tool

# LinkStash - Product Requirements Document

## Problem
Saving interesting articles to read later means they disappear into a black hole and never get read.

## User
Curious learners who save 10+ articles per week but read fewer than 2.

## Success Metric  
5 users save 10+ links and open 30%+ of them within 1 week.

## Core User Loop
1. Save link via browser extension or paste
2. Browse saved links in clean reading view
3. Click to read article

## V1 Features (1 week scope)
- **Bookmarklet save** - Enables: one-click saving from any site
- **Link list with thumbnails** - Enables: browsing saved content
- **Open in new tab** - Enables: reading articles
- **Archive button** - Enables: clearing read articles

## Explicitly NOT Building (V2+)
- Full-text search - Why: Premature, need usage data first
- Tags/categories - Why: Organization before content = analysis paralysis
- Reading view integration - Why: External links work fine for MVP
- Sharing/social features - Why: Single-player validation first
- Mobile app - Why: Desktop-first workflow, web works
- Chrome extension - Why: Bookmarklet works for testing

## Tech Stack
- Frontend: Next.js + TypeScript + Tailwind
- Backend: Next.js API routes  
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth (Google OAuth)
- Deployment: Vercel

## Week 1 Goal
Get 5 power-users (people who save 20+ links/week) to try it and report if they read more links than usual.

---

## Example 3: Community/Social App

# DailyPrompt - Product Requirements Document

## Problem
People want to journal but blank pages are intimidating and inconsistent.

## User
Adults interested in journaling but who struggle with consistency (tried journaling apps before, quit after 2 weeks).

## Success Metric  
8 users write entries for 5 out of 7 consecutive days.

## Core User Loop
1. See today's creative writing prompt
2. Write response (min 50 words)
3. See other people's responses (after submitting own)

## V1 Features (1 week scope)
- **Daily prompt display** - Enables: seeing today's prompt (hardcoded set of 30 prompts)
- **Text editor with word count** - Enables: writing responses
- **Submit button (50 word minimum)** - Enables: posting entries
- **Public feed of responses** - Enables: reading others' entries (shows after user submits)

## Explicitly NOT Building (V2+)
- Custom prompts - Why: Curated prompts reduce decision fatigue
- Rich text editing - Why: Plain text works, complexity = slower shipping
- Comments/likes - Why: Read-only feed validates engagement first
- Private entries - Why: Public accountability drives consistency
- Edit after posting - Why: Encourages authentic, unpolished writing
- Past entries view - Why: Today-focused experience, history = feature creep
- Prompt scheduling - Why: Manual rotation fine for 30-day test

## Tech Stack
- Frontend: Next.js + TypeScript + Tailwind
- Backend: Next.js API routes  
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth (Google OAuth)
- Deployment: Vercel

## Week 1 Goal
Launch to 10 test users, track daily engagement, validate if seeing others' responses drives consistency.

---

## Example 4: Marketplace/Directory

# LocalLessons - Product Requirements Document

## Problem
Parents can't find qualified local tutors without going through expensive platforms that take 30%+ commissions.

## User
Parents looking for after-school tutors (music, art, sports, academics) in their neighborhood.

## Success Metric  
3 parents request contact with tutors, 2 tutors list themselves.

## Core User Loop
1. Browse tutor listings by subject/location
2. See profile with availability and rate
3. Click "Request Intro" to get tutor's contact

## V1 Features (1 week scope)
- **Browse tutors page** - Enables: viewing all listings with filters (subject, location)
- **Create tutor profile** - Enables: tutors listing themselves (name, subject, rate, bio, email)
- **Request intro button** - Enables: showing tutor's email to parents (no messaging system)
- **Simple search by zip code** - Enables: local discovery

## Explicitly NOT Building (V2+)
- Payment processing - Why: Direct contact validates need first, payments = complex
- Booking system - Why: Email coordination works for MVP, avoids calendar integration
- Reviews/ratings - Why: Need active users first
- Background checks - Why: Parents validate tutors directly for now
- In-app messaging - Why: Email/text works, messaging = feature creep
- Mobile apps - Why: Web responsive is enough
- Tutor verification - Why: Trust = social validation, not platform guarantee
- Photo uploads - Why: Text profiles launch faster

## Tech Stack
- Frontend: Next.js + TypeScript + Tailwind
- Backend: Next.js API routes  
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth (Google OAuth)
- Deployment: Vercel

## Week 1 Goal
Get 5 tutors to create profiles, send to parent network (20 people), measure if 3+ request intros.

---

## Key Patterns Across Examples

Notice how each PRD:
- **Fits on one page** - Forces ruthless prioritization
- **Names the painful moment** - Not just the category
- **Defines specific users** - Not "everyone" or broad demographics
- **Measures within 1 week** - Real validation, not vanity metrics
- **Cuts aggressively** - More features in "NOT building" than V1
- **Uses same tech stack** - Proven, fast, lets you focus on product
- **States week 1 goal clearly** - Exact outcome with real people

Use these as templates for your own PRDs.
