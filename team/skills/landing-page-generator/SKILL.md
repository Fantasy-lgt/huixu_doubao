---
name: landing-page-generator
label: 落地页生成器
icon: "https://lf3-static.bytednsdoc.com/obj/eden-cn/evithyeh7vibfuhpe/doubao_skill_icon_528/landing-page-generator.png"
description: "根据需求简报生成高转化、移动端自适应的落地页。适用于为客户构建落地页、销售页或营销页面。"
argument-hint: "[product-or-service-description]"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Landing Page Generator

Generate complete, conversion-oriented landing-page prototypes from a product/service brief. Default delivery uses the Agent's web app construction capability (`app_builder`, `create_html`, WebPage, or equivalent) to produce a verified online page. Create local HTML/CSS files only when the user explicitly requires an HTML file/source, offline single-file HTML, or a local file path; call any output production-ready only after the real integrations, content, accessibility, security, analytics, and target environment have been verified.

## How to Use

```
/landing-page-generator "SaaS project management tool for remote teams, $29/mo, free trial"
/landing-page-generator brief.txt
/landing-page-generator "Freelance web developer portfolio — book a call CTA"
```

Provide as much context as possible:
- What the product/service is
- Target audience
- Primary CTA (sign up, buy, book a call, download)
- Pricing (if applicable)
- Key features/benefits
- Brand colors (optional, defaults to professional blue/dark theme)

## Page Generation Process

### Step 1: Analyze the Brief

Extract:
- **Product type**: SaaS, physical product, service, portfolio, lead magnet, event
- **Target audience**: Who is this for?
- **Primary CTA**: What action should visitors take?
- **Value proposition**: Why should they care?
- **Tone**: Professional, casual, bold, minimal, luxurious

### Step 2: Select Page Template

Based on product type:

| Type | Sections | Typical Length |
|------|----------|---------------|
| SaaS | Hero, Features, How It Works, Pricing, Testimonials, FAQ, CTA | Long |
| Service | Hero, Services, Process, Portfolio, Testimonials, CTA | Medium |
| Portfolio | Hero, Work Samples, About, Services, Contact | Medium |
| Lead Magnet | Hero, Benefits, Social Proof, Form, CTA | Short |
| E-commerce | Hero, Product Features, Gallery, Reviews, Buy CTA | Medium |
| Event | Hero, Speakers/Details, Schedule, Tickets, FAQ | Medium |

### Step 3: Generate the Page

Prepare the full page specification for the Agent's web app construction capability. The delivered page must be mobile-responsive, conversion-oriented, and accessible through a verified online URL.

If the user explicitly requires an HTML file/source, offline single-file HTML, or a local file path, create a single self-contained HTML file with embedded CSS. No external dependencies except Google Fonts.

**Required sections** (adapt to product type):

#### Hero Section
```
- Headline: Clear value proposition (max 10 words)
- Subheadline: Supporting detail (max 25 words)
- CTA button: High-contrast, action-oriented text ("Start Free Trial", not "Submit")
- Optional: Hero image placeholder or background
- Optional: Verified social proof badge supplied by the user; otherwise omit it or label it visibly as placeholder copy
```

#### Features/Benefits
```
- 3-4 feature cards with icons (use Unicode/emoji icons)
- Each card: Icon + Feature name + 1-2 sentence benefit (focus on outcome, not feature)
- Grid layout: 3 columns on desktop, 1 on mobile
```

#### Social Proof
```
- 2-3 testimonial cards only when the user supplies attributable, verified testimonials; otherwise omit this section or use visibly labelled placeholders that cannot be mistaken for real endorsements:
  - Quote text
  - Name and title/company
  - Star rating (if applicable)
- Optional: Logo bar of client/partner logos (placeholder boxes with company names)
```

#### How It Works (if applicable)
```
- 3-step process with numbered steps
- Step title + brief description
- Visual connector between steps
```

#### Pricing (if applicable)
```
- 1-3 pricing tiers in card format
- Highlight the recommended tier
- Feature comparison list
- CTA button on each tier
```

#### FAQ
```
- 4-6 common questions
- Accordion-style (click to expand) using pure CSS/HTML <details>
```

#### Final CTA
```
- Repeat the primary CTA with urgency
- Different angle from hero (address remaining objections)
- Strong contrasting background
```

### Step 4: Design System

Apply these design principles:

**Typography**:
- Font: `Inter` from Google Fonts (clean, modern, high readability)
- Heading scale: 3rem, 2rem, 1.5rem, 1.25rem
- Body: 1rem / 1.6 line-height
- Max line width: 65ch for readability

**Colors** (default, override with brand colors if provided):
```css
--primary: #2563eb;        /* Blue - CTAs, links */
--primary-dark: #1d4ed8;   /* Hover state */
--bg: #ffffff;             /* Background */
--bg-alt: #f8fafc;         /* Alternating section bg */
--text: #1e293b;           /* Body text */
--text-light: #64748b;     /* Secondary text */
--accent: #f59e0b;         /* Highlights, badges */
```

**Layout**:
- Max width: 1200px, centered
- Section padding: 80px vertical (48px on mobile)
- Consistent spacing scale: 4, 8, 16, 24, 32, 48, 64, 80px

**Responsive breakpoints**:
- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px

### Step 5: Conversion Optimization

Apply these conversion principles to the generated page:

1. **Above the fold**: Headline + CTA visible without scrolling
2. **Single CTA focus**: One primary action, repeated 2-3 times throughout
3. **Contrast ratio**: CTA buttons must have WCAG AA contrast (4.5:1 minimum)
4. **Loading speed**: No external JS, minimal CSS, no images (placeholders only)
5. **Scannability**: Users should understand the offer in 5 seconds
6. **Objection handling**: FAQ and testimonials address common concerns
7. **Urgency/scarcity**: Optional — only if authentic ("Limited beta spots", not fake countdowns)

### Evidence and safety gates

1. Do not invent customer counts, testimonials, logos, ratings, prices, certifications, benchmark results, conversion lifts, deployment logs, or user-validation outcomes.
2. Mark Mock data, sample people, scoring weights, thresholds, forecasts, and placeholder copy as unvalidated demo assumptions.
3. Distinguish local files, static demos, test deployments, and production systems. A generated file or reachable URL is not evidence that forms, authentication, persistence, analytics, payments, or compliance work.
4. Before publishing, connecting real data, sending notifications, charging money, or changing an external system, state the target, scope, permission, rollback, and verification plan, then obtain explicit authorization.
5. For employment, medical, legal, financial, investment, or other consequential uses, keep the page and any embedded scoring flow informational or decision-support only; require accountable human and applicable professional review.

### Step 6: Output

Default output:

- Use the Agent's web app construction capability (`app_builder`, `create_html`, WebPage, or equivalent).
- Return the verified online page URL after checking that the page opens, primary CTA is visible, FAQ interaction works, and mobile width has no horizontal overflow.
- Do not provide local source, ZIP, or file paths as the final deliverable unless the user explicitly requires that format.

Only when the user explicitly requires a local HTML file, save to `output/landing-page/`:

```
output/landing-page/
  index.html          # Complete self-contained page
  README.md           # Customization guide for the client
```

**`README.md`** includes:
- How to customize colors (CSS variables at top of file)
- How to replace placeholder content
- How to add real images
- How to connect forms to their email service
- How to deploy (Netlify drag-and-drop, GitHub Pages, any static host)

### Step 7: Present to User

Show:
1. Brief summary of what was generated
2. Key design decisions made
3. Verified online page URL, or the local file path only when the user explicitly required a local HTML file
4. Suggestions for what the client should customize (images, testimonials, specific copy)
5. Exact status: what was actually generated and checked, what remains placeholder or unverified, and whether no deployment occurred

## Quality Standards

- [ ] Online page URL opens successfully; if the user explicitly required local HTML, the file opens with no external dependencies except Google Fonts
- [ ] Fully responsive at 320px, 768px, and 1200px widths
- [ ] All CTA buttons have hover states
- [ ] Color contrast meets WCAG AA
- [ ] Page has proper `<meta>` viewport tag
- [ ] Semantic structure (`<header>`, `<main>`, `<section>`, `<footer>`) is represented in the generated page or local HTML
- [ ] No horizontal scroll at any breakpoint
- [ ] FAQ sections are interactive (expand/collapse)
- [ ] Local HTML file size under 50KB when the user explicitly required local HTML
