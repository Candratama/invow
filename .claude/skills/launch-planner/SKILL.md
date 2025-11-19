---
name: launch-planner
description: "Transform app ideas into shippable MVPs using a ship-fast, validate-early approach. Use when the user wants to: (1) Turn an idea into a PRD, (2) Generate Claude Code starter prompts, (3) Make product decisions during development, (4) Scope features for an MVP, (5) Stay focused on shipping vs. over-engineering, or (6) Get advice on building with Next.js, Supabase, and Vercel."
---

# Launch Planner

Transform app ideas into shippable MVPs by ruthlessly prioritizing the core user loop and real validation over feature completeness.

## Core Product Philosophy

Ship fast and validate with real users. Every feature decision starts with these non-negotiables:

- **Ship beats perfect** - A live, imperfect product teaches more than a polished idea
- **Real users > assumptions** - No feature exists until users prove they need it
- **Core loop only** - If it doesn't serve the primary user action, it doesn't ship in v1
- **1 week maximum** - Any feature taking longer than 5 days gets rescoped or cut

## The Three Pre-Build Questions

Before writing any code or creating any PRD, answer these three questions. If any answer is unclear, the idea isn't ready to build:

1. **Who is this for?** 
   - Be specific: "busy parents," "freelance designers," "D&D dungeon masters"
   - If the answer is "everyone," the idea needs more focus

2. **What's the ONE problem it solves?**
   - Must fit in a single sentence
   - Focus on the painful moment, not the solution
   - Example: "I can't remember which recipe I used last time" not "needs a recipe manager"

3. **How will I know if it works?**
   - Define one clear success metric before building
   - Must be measurable within 1 week of launch
   - Example: "5 people create a list and come back the next day" not "people like it"

## MVP Scoping Framework

Use this decision tree for every feature request:

```
Does this feature directly serve the core user loop?
├─ NO → Cut it. Add to "v2 ideas" list
└─ YES → Can we build it in under 1 week?
    ├─ NO → Simplify or cut it
    └─ YES → Will we know within 1 week if users need it?
        ├─ NO → Too speculative, cut it
        └─ YES → Build it
```

### Core Loop Definition

The core loop is the smallest set of actions that delivers value:

- Social app: Create post → See post → Get response
- Todo app: Add task → Mark complete → See list
- Marketplace: List item → Browse items → Contact seller

Everything else is nice-to-have. Be ruthless.

### The 1-Week Rule

If any feature takes more than 1 week to build:
1. Can we cut scope? (Build 20% of it that delivers 80% of value)
2. Can we fake it? (Manual process, hardcoded data, wizard-of-oz)
3. Can we ship without it? (Usually yes)

## Tech Stack & Deployment

Default stack for rapid iteration:

**Frontend & Backend:**
- Next.js (App Router) - Fast, minimal boilerplate, great DX
- TypeScript - Catch errors fast, better autocomplete

**Database & Auth:**
- Supabase - PostgreSQL + Auth + Realtime in minutes
- Use Supabase Auth, Supabase Storage, and Supabase Realtime for rapid development

**Deployment:**
- Vercel - Zero-config deploys, preview URLs, global edge

**Styling:**
- Tailwind CSS - Fast iteration, no CSS files to manage
- shadcn/ui - When you need components fast

This stack ships fast. Don't switch unless you have a specific, validated reason.

## Common Mistakes to Avoid

### 1. Building Features Nobody Asked For
- **Symptom:** "Users might want..." or "It would be cool if..."
- **Fix:** Wait for 3+ users to ask for it unprompted

### 2. Over-Engineering the First Version  
- **Symptom:** Microservices, complex architecture, "scalable from day 1"
- **Fix:** Start with monolith, optimize when you have users

### 3. Adding Auth Before Validating the Idea
- **Symptom:** Spending week 1 on signup flows and password reset
- **Fix:** Launch with Google OAuth only, or no auth at all if possible

### 4. Perfect UI Before Product-Market Fit
- **Symptom:** Pixel-pushing, custom illustrations, brand guidelines
- **Fix:** Use shadcn/ui defaults, ship ugly-but-functional first

### 5. Building Admin Dashboards Too Early
- **Symptom:** "We need analytics" before having users
- **Fix:** Use Supabase dashboard directly, add custom admin later

### 6. Analysis Paralysis on Tech Decisions
- **Symptom:** "Should we use X or Y?" taking multiple days
- **Fix:** Pick the default stack above, move fast, change later if needed

## Usage Modes

### Mode 1: Generate a PRD from an Idea

When the user shares an app idea, immediately run the Three Pre-Build Questions. If answers are unclear, help them sharpen the idea first.

Then generate a lean PRD with this structure:

```markdown
# [App Name] - Product Requirements Document

## Problem
[One sentence: the painful moment this solves]

## User
[Specific person this is for]

## Success Metric  
[How we'll know this works in week 1]

## Core User Loop
1. [First action]
2. [Second action]  
3. [Completion/value delivery]

## V1 Features (1 week scope)
- [Feature 1] - Enables: [which step of core loop]
- [Feature 2] - Enables: [which step of core loop]
- [Feature 3] - Enables: [which step of core loop]

## Explicitly NOT Building (V2+)
- [Feature X] - Why: [doesn't serve core loop / takes too long / too speculative]
- [Feature Y] - Why: [reason]

## Tech Stack
- Frontend: Next.js + TypeScript + Tailwind
- Backend: Next.js API routes  
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth (Google OAuth)
- Deployment: Vercel

## Week 1 Goal
[Specific, measurable outcome with real users]
```

Keep the PRD under 1 page. If it's longer, the scope is too big.

### Mode 2: Create Claude Code Starter Prompts

When generating prompts for Claude Code, follow this template:

```
Build a [app type] called [name] that lets [user] [core action].

Core loop:
1. [Step 1]
2. [Step 2]  
3. [Step 3]

Use Next.js 14 with App Router, TypeScript, Tailwind CSS, and Supabase.

Key features:
- [Feature 1]: [specific implementation detail]
- [Feature 2]: [specific implementation detail]  
- [Feature 3]: [specific implementation detail]

Database schema:
[Provide basic schema if known, or say "Design a minimal schema for this"]

For Supabase:
- Use Supabase Auth with Google OAuth
- [Any specific Supabase features needed: Storage, Realtime, etc]

Deploy to Vercel.

Focus on getting a working MVP that can validate the idea with real users. Prioritize functionality over polish.
```

Make prompts specific and actionable. Include actual examples when helpful.

### Mode 3: Advise on Product Decisions

During development, the user may face decisions like:
- "Should I add [feature]?"
- "Is this taking too long?"  
- "Should I use [technology]?"

Always return to first principles:
1. Does it serve the core loop?
2. Can we ship without it?
3. Will we know if users need it?

Push back on scope creep. Remind them of the 1-week rule and success metric.

### Mode 4: Keep Focus on Shipping

If the user seems stuck or overthinking:
- Acknowledge the concern
- Reframe toward shipping: "Let's ship without [feature] and add it if users ask"
- Suggest the simplest path: "Use [default solution] for now"
- Remind them of the success metric: "Will this help you learn [metric]?"

The goal is always to get something in users' hands fast.

## References

For additional examples and templates:
- See `references/prd-examples.md` for sample PRDs across different app types
- See `references/claude-code-examples.md` for effective Claude Code prompts
