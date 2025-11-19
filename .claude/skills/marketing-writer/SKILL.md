---
name: marketing-writer
description: Write marketing content (landing pages, tweets, launch emails) for product features and launches. Use when the user needs marketing copy, ships a feature, announces something, or asks to promote/market their product. Automatically reads the codebase to understand the product context.
---

# Marketing Writer

Writes marketing content for product features and launches using a casual, direct brand voice. Automatically understands product context by reading the codebase.

## Brand Voice Guidelines

Write in a casual, direct tone like talking to a friend:
- **No corporate buzzwords** - Avoid "leverage," "synergy," "innovative," "cutting-edge," "revolutionize"
- **No cringe marketing speak** - Skip "game-changer," "unlock," "transform your workflow," excessive emojis
- **Focus on real benefits** - Tell readers exactly what they get, not vague promises
- **Simple language** - Use everyday words, avoid jargon unless necessary for technical accuracy
- **Be specific** - "Save 2 hours per week" beats "boost productivity"

## Workflow

When creating marketing content:

1. **Understand the product context**
   - Check if codebase files are in `/mnt/user-data/uploads` or `/home/claude`
   - Read key files: README, package.json, main code files, config files
   - Identify: What does the app do? Who is it for? What problems does it solve?
   - Note specific features, tech stack, and unique value props

2. **Ask clarifying questions if needed**
   - What specific feature are you marketing?
   - Who's the target audience?
   - What's the main benefit or use case?
   - Any specific messaging or positioning?

3. **Choose the right template** based on the request:
   - Landing page sections for website content
   - Tweet threads for social media announcements
   - Launch emails for direct communication

4. **Write the content** following the templates and brand voice
   - Focus on one clear benefit per section
   - Use problem → solution → benefit structure
   - Keep it conversational and specific
   - Include a clear call-to-action

## Content Templates

### Landing Page Feature Section

Format: Problem → Solution → Benefit

**Structure:**
```
## [Feature Name - Clear, Descriptive]

[Problem statement in 1-2 sentences. What sucks about the current way?]

[Solution in 1-2 sentences. How does your feature fix it?]

[Benefit in 1 sentence. What does the user actually get?]

[Optional: CTA button or next step]
```

**Example:**
```
## One-Click Deployments

Deploying your app shouldn't require a PhD in DevOps. Most developers waste hours configuring servers, setting up CI/CD pipelines, and debugging deployment scripts.

We handle all of that. Connect your GitHub repo, and we'll deploy your app in under 60 seconds. No config files, no setup, no headaches.

You write code. We make it live. Get back to building what matters.

[Try it free →]
```

### Tweet Thread

Format: Hook → Credibility → Value → CTA

**Structure:**
```
1/ [Hook tweet - surprising stat, bold claim, or question that makes people stop scrolling]

2/ [Credibility - quick context on why this matters or why you built it]

3-5/ [Value tweets - each highlighting ONE specific benefit or feature. Use real numbers/examples]

6/ [CTA - clear next step with link]
```

**Example:**
```
1/ Most developers spend 4+ hours per week just deploying code.

That's 200+ hours per year doing DevOps work instead of building features.

We just shipped something to fix that →

2/ After talking to 100+ developers, we kept hearing the same pain point:

"I just want to push code and have it work. I don't want to be a DevOps expert."

So we built one-click deployments.

3/ Here's how it works:

Connect your GitHub repo. That's it.

Every push to main automatically deploys in ~60 seconds. No config files, no build scripts, no server management.

4/ The results so far:

• Average deployment time: 58 seconds (vs 45 minutes manually)
• Zero failed deploys in the last 1000 pushes
• 127 teams using it daily

Real developers, real apps, zero DevOps headaches.

5/ We're keeping it free while in beta.

If you're tired of fighting with deployments, give it a try:

[link]
```

### Launch Email

Format: Personal → Specific Value → Easy CTA

**Structure:**
```
Subject: [Casual, benefit-focused - no clickbait]

Hey [name/there],

[Personal opening - 1-2 sentences connecting to their situation]

[What you built - 1 sentence]

[The specific problem it solves - 2-3 sentences with concrete details]

[The benefit they'll get - 1-2 sentences, specific numbers if possible]

[How to try it - clear, single action]

[Casual sign-off]
[Your name]

P.S. [Optional: Address obvious objection or offer to help]
```

**Example:**
```
Subject: Deploy your app in 60 seconds (seriously)

Hey there,

If you're like most developers, you've lost entire afternoons to deployment issues. Config files that don't work, build scripts that fail randomly, servers that need babysitting.

We just launched one-click deployments that actually work.

Connect your GitHub repo, and every push to main goes live automatically. No setup, no config files, no DevOps knowledge required. It just works.

Early testers are saving 4+ hours per week. One dev told us "I literally forgot deploying was supposed to be hard."

Try it free: [link]

- [Your name]

P.S. Free while we're in beta. If anything breaks (it won't), just reply to this email and I'll fix it personally.
```

## Tips for Great Marketing Content

**Do:**
- Lead with the benefit, not the feature
- Use "you" language (talk to the reader)
- Be specific with numbers and examples
- Show, don't tell (screenshots, demos, real stories)
- Make the CTA obvious and easy

**Don't:**
- Use multiple exclamation marks!!!
- Make vague claims without proof
- List features without explaining why they matter
- Use corporate speak or jargon unnecessarily
- Bury the value proposition

## Finding Codebase Information

When analyzing codebases to understand the product:

**Priority files to check:**
1. README.md - overview, description, value prop
2. package.json / Cargo.toml / requirements.txt - project name, description
3. Main application files - core functionality
4. Documentation or docs/ folder - features, use cases
5. Landing page / website files - existing marketing copy

**What to extract:**
- Product name and tagline
- Core functionality and features
- Target users / use cases
- Technical approach or unique aspects
- Problems being solved
- Tech stack (helps understand positioning)

**If codebase isn't available:**
Ask the user for key details instead of making assumptions.
