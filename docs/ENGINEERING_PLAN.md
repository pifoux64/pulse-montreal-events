# Pulse Engineering Plan
## Complete Implementation Roadmap

**Version:** 1.0  
**Date:** January 2026  
**Stack:** Next.js 15 + TypeScript + Tailwind + Supabase (Postgres) + Prisma + Vercel

---

## Table of Contents

1. [Architecture Decisions](#architecture-decisions)
2. [Feature Checklist](#feature-checklist)
3. [Sprint Roadmap](#sprint-roadmap)
4. [File/Module Structure](#filemodule-structure)
5. [Performance, SEO, Security Requirements](#performance-seo-security-requirements)
6. [Execution Plan & Risks](#execution-plan--risks)

---

## Architecture Decisions

### 1. Role Model

**Decision:** Multi-role system with `UserRoleAssignment` join table + legacy `User.role` for backward compatibility.

**Schema:**
```prisma
model User {
  role UserRole @default(USER) // Legacy
  roleAssignments UserRoleAssignment[]
}

model UserRoleAssignment {
  userId String
  role UserRole
  @@unique([userId, role])
}
```

**Rationale:**
- Users can have multiple roles simultaneously (USER + ORGANIZER + VENUE)
- Progressive activation (no heavy signup forms)
- Backward compatible with existing `User.role`

**Implementation:**
- ✅ Already implemented (migration applied)
- Session includes `session.user.roles: UserRole[]`
- Middleware checks `roleAssignments` + legacy `role`

---

### 2. Venue Claim Model

**Decision:** Claim-based verification with status workflow.

**Schema:**
```prisma
enum VenueClaimStatus {
  UNCLAIMED
  PENDING
  VERIFIED
  REJECTED
}

model VenueClaim {
  venueId String
  userId String
  status VenueClaimStatus @default(PENDING)
  roleAtVenue String? // owner/manager/booker
  professionalEmail String?
  reviewedBy String?
  reviewedAt DateTime?
}
```

**Workflow:**
1. User submits claim → `PENDING`
2. Admin reviews → `VERIFIED` or `REJECTED`
3. On `VERIFIED`: add VENUE role + set `venue.ownerUserId`

**Implementation:**
- ✅ Already implemented
- Admin UI at `/admin/venue-claims`

---

### 3. AI Caching Strategy

**Decision:** Content-hash based caching with deterministic outputs.

**Implementation:**
```typescript
// Cache key: hash(event.title + event.description + event.startAt + event.venueId)
const cacheKey = `ai:${contentHash}`;

// Store in DB
model EventAICache {
  eventId String
  contentHash String
  category String
  tags Json
  insight String
  createdAt DateTime
  @@unique([eventId, contentHash])
}
```

**Rules:**
- Temperature: 0.2 (deterministic)
- Recompute only if `contentHash` changes
- Cache TTL: 30 days
- Fallback: return empty tags if AI fails (never block page)

**API:** `/api/ai/enrich-event` (POST, async, non-blocking)

---

### 4. Ingestion Health Dashboard

**Decision:** Admin-only dashboard with real-time metrics.

**Location:** `/admin/ingestion`

**Metrics:**
- Events per source (last 30 days)
- Last run time per connector
- Success/failure rates
- Error samples
- Coverage by category

**Implementation:**
- ✅ Already exists (`/admin/ingestion`)
- Extend with venue claims moderation link

---

### 5. Plan Gating Strategy

**Decision:** Feature flags in `Subscription` model + server-side checks.

**Schema:**
```prisma
model Subscription {
  plan SubscriptionPlan
  organizerId String?
  venueId String?
  active Boolean
  stripeSubscriptionId String?
}

enum SubscriptionPlan {
  ORGANIZER_FREE
  ORGANIZER_PRO
  ORGANIZER_STUDIO
  VENUE_FREE
  VENUE_PRO
  VENUE_PARTNER
}
```

**Gating Logic:**
```typescript
// lib/feature-gates.ts
export async function canCreateEvent(userId: string): Promise<boolean> {
  const subscription = await getActiveSubscription(userId, 'ORGANIZER');
  if (!subscription) return false;
  
  if (subscription.plan === 'ORGANIZER_FREE') {
    const activeCount = await countActiveEvents(userId);
    return activeCount < 2;
  }
  return true; // PRO/STUDIO unlimited
}
```

**Implementation:**
- Create `lib/feature-gates.ts`
- Add checks in API routes (`/api/events`, `/api/flyer/generate`, etc.)

---

## Feature Checklist

### Discovery

- [x] Home page (today/weekend filters)
- [x] Map view with clustering
- [x] Calendar view
- [x] Category filters (Music/Family/Culture/Sport/Nightlife)
- [x] Advanced filters (date range, price, accessibility, neighborhood)
- [x] Search (text + AI-powered)
- [x] "For You" personalized feed
- [ ] Pulse Picks pages (Top 5 by category)
- [ ] Venue pages (list events + calendar)
- [ ] Organizer pages (list events + follow)

### Event Detail Page

- [x] Header (title/date/venue/price/CTAs)
- [x] Hero/media section
- [x] Pulse Insight (AI summary + tags)
- [x] Structured description (collapsibles)
- [x] Social relevance (friends + taste match)
- [x] Contextual discovery (similar events, same venue/organizer)
- [x] Practical info (map, transport, sound level)
- [x] Music embeds (Spotify/YouTube/SoundCloud/Mixcloud)
- [ ] Organizer tools panel (role-gated, collapsed)
- [ ] Venue tools panel (role-gated, collapsed)

### Ingestion (Legal + Durable)

- [x] Ticketmaster API connector
- [x] ImportJob tracking
- [x] Orchestrator (cron every 2h)
- [ ] Open Data Montreal connector
- [ ] Direct organizer submissions (form + API)
- [ ] Direct venue submissions (form + API)
- [ ] ICS calendar import (organizer/venue upload)
- [ ] Eventbrite connector (organizer-owned only, via OAuth)
- [ ] Bandsintown connector (if partner approved)
- [ ] Deduplication (fuzzy match by title/date/venue)
- [ ] Source attribution (EventSourceLink table)
- [ ] Stale cleanup (expired events)
- [x] Health dashboard (`/admin/ingestion`)

### AI Enrichment

- [x] GPT-4.1-mini classifier
- [x] Category classification
- [x] Tag extraction (music genres, vibe, audience)
- [x] Pulse Insight generation
- [ ] Content-hash caching
- [ ] EventAICache table
- [ ] Recompute on content change
- [ ] Pulse Picks generation (weekly Top 5)
- [ ] Social content pack (caption + image plan)

### Organizer OS

- [x] Create event form
- [x] Edit event
- [x] Dashboard (stats + events list)
- [x] Import event (link + Facebook/Eventbrite)
- [ ] ICS import
- [x] AI Assistant (content generator, budget calculator)
- [x] Flyer generator (AI background + template)
- [ ] Printing integration (Zoubris + Stripe)
- [ ] Promotions/boosts (sponsored placements)
- [ ] Targeted notifications (paid campaigns)
- [x] Analytics (views, favorites, clicks)
- [ ] Billing (Stripe subscriptions)

### Venue OS

- [x] Venue page (mini-site)
- [x] Venue dashboard
- [ ] Venue info management
- [ ] ICS calendar sync
- [ ] Booking inquiry form (Request to book)
- [ ] Approve organizer submissions
- [ ] Venue analytics
- [ ] Relationship layer (organizers linked to venue)
- [x] Claim flow (PENDING → VERIFIED)

### Social (Pulsers)

- [x] Favorites
- [x] Follow friends (UserFollow)
- [ ] Friends activity feed (saved/interested events)
- [x] Share events (links + QR codes)
- [x] Invite friends to events
- [ ] Notifications (in-app)
- [ ] Push notifications (future)

### Monetization

- [x] Stripe integration
- [ ] Subscription plans (FREE/PRO/STUDIO for organizers, FREE/PRO/PARTNER for venues)
- [ ] Feature gating (lib/feature-gates.ts)
- [ ] Boost placements (sponsored slots)
- [ ] Targeted notifications (pay-per-campaign)
- [ ] Printing margin (Zoubris integration)
- [ ] Billing pages (subscription management)

### Compliance

- [x] Privacy Policy page
- [x] Terms of Service page
- [ ] Cookie policy (if needed)
- [x] Notification preferences
- [ ] Data minimization policies
- [ ] Audit logging (admin actions + paid actions)
- [ ] Rate limiting (write endpoints)
- [ ] Spam prevention (campaign caps, approval rules)

---

## Sprint Roadmap

### Sprint 1: Navigation Revamp + Role System (✅ COMPLETE)

**Scope:**
- Minimalist navigation (max 5 items)
- Profile dropdown with role-based sections
- Language switcher (flag-only)
- Multi-role system (UserRoleAssignment)
- Venue claim flow

**Tasks:**
- [x] Create NavigationMinimal component
- [x] Create ProfileMenu with role sections
- [x] Create ExploreMenu dropdown
- [x] Create LanguageSwitcherFlag (flag-only)
- [x] Implement UserRoleAssignment model
- [x] Implement VenueClaim model
- [x] Create middleware guards for role-protected routes
- [x] Create admin UI for venue claims moderation

**Acceptance Criteria:**
- Top nav has max 5 items (For You, Explore, Map, Favorites, Search)
- Profile menu shows sections based on user roles
- Language switcher shows only flag (no text)
- Users can activate ORGANIZER role progressively
- Users can claim venues (PENDING → VERIFIED)
- Admin can moderate venue claims

**Definition of Done:**
- All components render correctly
- Role checks work in middleware
- Translations exist (FR/EN/ES)
- No console errors
- Mobile responsive

---

### Sprint 2: Event Detail Page Enhancement

**Scope:**
- Complete event detail page with all sections
- Lazy loading for heavy content
- Organizer/Venue tools panels (role-gated)

**Tasks:**
- [ ] Add organizer tools panel (collapsed by default, role-gated)
  - Edit event
  - Boost visibility
  - Generate flyer
  - View analytics
- [ ] Add venue tools panel (collapsed by default, role-gated)
  - Edit venue info
  - View venue analytics
  - Manage booking requests
- [ ] Optimize lazy loading (iframes, map, AI)
- [ ] Add "Listen before you go" section (music embeds)
- [ ] Improve Pulse Insight display (tags + summary)

**Acceptance Criteria:**
- All 9 sections render in correct order
- Organizer tools only visible to event owner
- Venue tools only visible to venue owner
- Page loads in <2s (LCP < 2.5s)
- AI never blocks page render

**Definition of Done:**
- Lighthouse score >90 (Performance)
- No layout shift (CLS < 0.1)
- All sections tested with different roles
- Mobile responsive

---

### Sprint 3: AI Enrichment + Caching

**Scope:**
- Content-hash based caching
- EventAICache table
- Recompute logic
- Pulse Picks generation

**Tasks:**
- [ ] Create EventAICache model
- [ ] Implement content-hash generation
- [ ] Update `/api/ai/enrich-event` to use cache
- [ ] Add recompute trigger (on event update)
- [ ] Create Pulse Picks generator (weekly Top 5)
- [ ] Create `/api/ai/pulse-picks` endpoint
- [ ] Build Pulse Picks pages (`/top-5/[category]`)

**Acceptance Criteria:**
- AI responses cached for 30 days
- Recompute only on content change
- Pulse Picks generated weekly (cron)
- Cache hit rate >80%
- AI failures never block pages

**Definition of Done:**
- EventAICache table created
- Cache logic tested
- Pulse Picks pages render
- No AI blocking on event pages

---

### Sprint 4: Ingestion Expansion (Legal Sources)

**Scope:**
- Open Data Montreal connector
- Direct organizer/venue submissions
- ICS calendar import
- Deduplication improvements

**Tasks:**
- [ ] Create Open Data Montreal connector
  - Research available datasets
  - Implement API client
  - Normalize to canonical event model
- [ ] Build organizer submission form
  - Public form at `/publier`
  - API endpoint `/api/events` (POST)
  - Validation + moderation (if needed)
- [ ] Build venue submission form
  - Form at `/venue/submit`
  - API endpoint `/api/venues` (POST)
- [ ] Implement ICS import
  - Upload component (organizer/venue dashboard)
  - ICS parser library
  - Recurring event handling
- [ ] Improve deduplication
  - Fuzzy matching algorithm
  - Source attribution (EventSourceLink)

**Acceptance Criteria:**
- Open Data Montreal events ingested
- Organizers can submit events directly
- Venues can submit events directly
- ICS calendars can be imported
- Deduplication prevents duplicates
- All sources tracked in EventSourceLink

**Definition of Done:**
- All connectors tested
- Deduplication tested with real data
- Error handling robust
- Health dashboard shows all sources

---

### Sprint 5: Organizer OS - Advanced Tools

**Scope:**
- ICS import
- Printing integration (Zoubris)
- Promotions/boosts
- Targeted notifications

**Tasks:**
- [ ] ICS import UI (organizer dashboard)
- [ ] Printing integration
  - Create PrintOrder model
  - Stripe checkout for printing
  - Webhook handler → email Zoubris
  - Print history page
- [ ] Promotions/boosts system
  - Create Promotion model (if not exists)
  - Boost placement logic (homepage/list/map)
  - Stripe checkout for boosts
  - Boost management UI
- [ ] Targeted notifications
  - Create NotificationCampaign model
  - Segment builder (category, neighborhood, etc.)
  - Stripe checkout (pay-per-recipient)
  - Campaign management UI

**Acceptance Criteria:**
- Organizers can import ICS calendars
- Printing orders flow to Zoubris
- Boosts appear in designated slots
- Notification campaigns can be created
- All paid features gated by subscription

**Definition of Done:**
- All features tested end-to-end
- Stripe webhooks tested
- Feature gates enforced
- Analytics tracked

---

### Sprint 6: Venue OS - Complete Tools

**Scope:**
- Venue info management
- ICS calendar sync
- Booking inquiry workflow
- Venue analytics

**Tasks:**
- [ ] Venue info management UI
  - Edit venue details (capacity, amenities, photos)
  - Social links management
- [ ] ICS calendar sync
  - Upload ICS file
  - Auto-sync recurring events
- [ ] Booking inquiry form
  - Public form on venue page
  - Organizer submits request
  - Venue approves/rejects
  - Email notifications
- [ ] Venue analytics
  - Page views
  - Event performance
  - Booking inquiry stats

**Acceptance Criteria:**
- Venues can manage all info
- ICS syncs work correctly
- Booking inquiries flow properly
- Analytics display correctly
- All features role-gated

**Definition of Done:**
- All venue tools tested
- Booking workflow tested
- Analytics accurate
- Mobile responsive

---

### Sprint 7: Social Features + Pulse Picks

**Scope:**
- Friends activity feed
- Pulse Picks pages
- Social sharing improvements

**Tasks:**
- [ ] Friends activity feed
  - Query friends' favorites/interested events
  - Display in "For You" section
  - Real-time updates (if possible)
- [ ] Pulse Picks pages
  - `/top-5/[category]` routes
  - Weekly generation (cron)
  - Social content pack (caption + image)
- [ ] Social sharing
  - Improve share modal
  - Add QR code generation
  - Track share events

**Acceptance Criteria:**
- Friends activity visible in feed
- Pulse Picks pages render correctly
- Sharing works on all platforms
- QR codes generate correctly

**Definition of Done:**
- All social features tested
- Pulse Picks generated weekly
- Sharing tracked in analytics

---

### Sprint 8: Monetization + Billing

**Scope:**
- Subscription plans
- Feature gating
- Billing pages
- Payment flows

**Tasks:**
- [ ] Create Subscription model (if not exists)
- [ ] Implement feature gates (`lib/feature-gates.ts`)
- [ ] Create billing pages
  - `/organisateur/billing`
  - `/venue/billing`
  - Subscription management
  - Payment history
- [ ] Implement plan upgrades/downgrades
  - Stripe checkout for upgrades
  - Proration handling
  - Webhook handlers
- [ ] Add feature gates to all paid features
  - Event creation limits (FREE plan)
  - AI credits
  - Flyer generation limits
  - Notification campaigns

**Acceptance Criteria:**
- All plans defined and enforced
- Feature gates work correctly
- Billing pages functional
- Stripe webhooks handled
- Upgrades/downgrades work

**Definition of Done:**
- All feature gates tested
- Billing flows tested
- Stripe integration tested
- Error handling robust

---

### Sprint 9: Compliance + Polish

**Scope:**
- Legal pages
- Audit logging
- Rate limiting
- Spam prevention
- Performance optimization

**Tasks:**
- [ ] Legal pages
  - Privacy Policy (update if needed)
  - Terms of Service (update if needed)
  - Cookie policy (if needed)
- [ ] Audit logging
  - Create AuditLog model
  - Log admin actions
  - Log paid actions (boosts, notifications)
- [ ] Rate limiting
  - Implement on write endpoints
  - Use Vercel Edge Config or Upstash Redis
- [ ] Spam prevention
  - Campaign caps per user
  - Approval rules for new organizers
  - Unsubscribe handling
- [ ] Performance optimization
  - Image optimization (Next.js Image)
  - Code splitting
  - Bundle size optimization
  - Database query optimization

**Acceptance Criteria:**
- All legal pages exist and are accessible
- Audit logs capture critical actions
- Rate limiting prevents abuse
- Spam prevention rules enforced
- Lighthouse scores >90 (all categories)

**Definition of Done:**
- All compliance requirements met
- Performance budgets met
- Security audit passed
- Documentation complete

---

## File/Module Structure

### `/app` Routes

```
app/
├── (public)/
│   ├── page.tsx                    # Home (today/weekend)
│   ├── carte/page.tsx              # Map view
│   ├── calendrier/page.tsx         # Calendar view
│   ├── favoris/page.tsx            # Favorites
│   ├── pour-toi/page.tsx           # For You feed
│   ├── evenement/[id]/page.tsx     # Event detail
│   ├── salles/[slug]/page.tsx      # Venue page
│   ├── organisateur/[slug]/page.tsx # Organizer page
│   └── top-5/[category]/page.tsx  # Pulse Picks
│
├── (auth)/
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   └── callback/[...nextauth]/route.ts
│   └── api/auth/[...nextauth]/route.ts
│
├── (organizer)/
│   ├── organisateur/
│   │   ├── dashboard/page.tsx
│   │   ├── mes-evenements/page.tsx
│   │   ├── billing/page.tsx
│   │   └── ...
│   └── publier/page.tsx
│
├── (venue)/
│   └── venue/
│       ├── dashboard/page.tsx
│       ├── mon-profil/page.tsx
│       └── ...
│
├── (admin)/
│   └── admin/
│       ├── ingestion/page.tsx
│       └── venue-claims/page.tsx
│
└── api/
    ├── events/route.ts
    ├── events/[id]/route.ts
    ├── ai/
    │   ├── enrich-event/route.ts
    │   └── pulse-picks/route.ts
    ├── ingestion/
    │   └── [source]/route.ts
    ├── roles/
    │   └── enable-organizer/route.ts
    ├── venues/[id]/claim/route.ts
    └── ...
```

### `/components`

```
components/
├── navigation/
│   ├── NavigationMinimal.tsx
│   ├── ProfileMenu.tsx
│   ├── ExploreMenu.tsx
│   └── LanguageSwitcherFlag.tsx
│
├── event-detail/
│   ├── EventHeader.tsx
│   ├── EventHeroMedia.tsx
│   ├── PulseInsight.tsx
│   ├── EventDescriptionStructured.tsx
│   ├── SocialRelevance.tsx
│   ├── ContextualDiscovery.tsx
│   ├── PracticalInfo.tsx
│   ├── OrganizerTools.tsx
│   ├── VenueTools.tsx
│   └── ListenBeforeYouGo.tsx
│
├── organizer/
│   ├── OrganizerDashboard.tsx
│   ├── EventForm.tsx
│   ├── FlyerGenerator.tsx
│   ├── AIAssistant.tsx
│   └── ...
│
├── venue/
│   ├── VenueDashboard.tsx
│   ├── VenueClaimButton.tsx
│   └── ...
│
└── shared/
    ├── EventCard.tsx
    ├── ModernLoader.tsx
    └── ...
```

### `/lib`

```
lib/
├── auth.ts                    # NextAuth config
├── auth-guards.ts            # Role checking helpers
├── feature-gates.ts          # Subscription-based feature gating
├── prisma.ts                 # Prisma client
├── i18n.ts                   # i18n config
└── roles/
    └── require-organizer-role.ts
```

### `/services`

```
services/
├── ingestion/
│   ├── orchestrator.ts       # Main ingestion orchestrator
│   ├── connectors/
│   │   ├── ticketmaster.ts
│   │   ├── open-data-mtl.ts
│   │   └── base.ts           # Base connector interface
│   └── deduplication.ts
│
├── ai/
│   ├── classifier.ts         # GPT-4.1-mini classifier
│   ├── cache.ts              # AI cache management
│   └── pulse-picks.ts        # Pulse Picks generator
│
├── printing/
│   └── zoubris.ts            # Zoubris integration
│
└── notifications/
    └── campaigns.ts          # Notification campaign logic
```

### `/db` (Prisma)

```
prisma/
├── schema.prisma
└── migrations/
    └── ...
```

---

## Performance, SEO, Security Requirements

### Performance

**Budgets:**
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- TTFB: < 600ms

**Optimizations:**
- Image optimization (Next.js Image, WebP)
- Code splitting (dynamic imports)
- Lazy loading (iframes, maps, AI)
- Database query optimization (indexes, select only needed fields)
- CDN for static assets (Vercel Edge Network)

**Monitoring:**
- Vercel Analytics
- Lighthouse CI (on deploy)
- Real User Monitoring (RUM)

### SEO

**Requirements:**
- [x] Sitemap.xml (dynamic)
- [x] RSS feed
- [ ] Structured data (JSON-LD for events)
- [ ] Meta tags (Open Graph, Twitter Cards)
- [ ] Canonical URLs
- [ ] hreflang tags (FR/EN/ES)

**Implementation:**
```typescript
// app/evenement/[id]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEvent(params.id);
  return {
    title: event.title,
    description: event.description,
    openGraph: {
      images: [event.imageUrl],
    },
  };
}
```

### Security

**Requirements:**
- Server-side role checks (middleware + API routes)
- Rate limiting (write endpoints: 10 req/min per user)
- Input validation (Zod schemas)
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React auto-escaping)
- CSRF protection (NextAuth built-in)
- Audit logging (admin actions + paid actions)

**Implementation:**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});
```

---

## Execution Plan & Risks

### Top Risks

#### 1. Data Sourcing Limitations

**Risk:** Limited legal sources for event data.

**Mitigation:**
- Focus on user-driven submissions (organizers/venues)
- Build strong submission UX
- Partner with cultural institutions
- Open Data Montreal as primary public source

**Fallback:** If ingestion limited, prioritize user submissions + manual curation.

---

#### 2. Spam/Abuse with Notifications

**Risk:** Organizers abuse notification system.

**Mitigation:**
- Rate limiting (campaign caps per plan)
- Approval workflow for new organizers
- Unsubscribe handling
- Monitoring + alerting

**Fallback:** Manual review for first 10 campaigns per organizer.

---

#### 3. Legal Constraints with Imports

**Risk:** Legal issues with event imports.

**Mitigation:**
- Only use official APIs + open data
- No scraping without permission
- Clear attribution (EventSourceLink)
- Terms of Service cover user submissions

**Fallback:** Remove problematic connectors, focus on user submissions.

---

#### 4. Scaling Ingestion

**Risk:** Ingestion pipeline doesn't scale.

**Mitigation:**
- Async processing (queue system)
- Batch processing
- Database indexes
- Monitoring + alerting

**Fallback:** Reduce ingestion frequency, prioritize high-quality sources.

---

### Execution Priorities

**Phase 1 (Sprints 1-3):** Foundation
- Navigation + roles ✅
- Event detail enhancement
- AI caching

**Phase 2 (Sprints 4-6):** Core Features
- Ingestion expansion
- Organizer/Venue OS tools

**Phase 3 (Sprints 7-9):** Social + Monetization
- Social features
- Billing + subscriptions
- Compliance + polish

---

### Success Metrics

**Discovery:**
- Event page views per user
- Time on event detail page
- Click-through to ticket pages

**Organizer OS:**
- Events created per organizer
- Flyers generated
- Boosts purchased

**Venue OS:**
- Venue claims verified
- Booking inquiries submitted

**Monetization:**
- Subscription conversion rate
- Revenue per organizer/venue
- Boost placement utilization

---

## Definition of Done (Per Sprint)

1. **Code Complete:**
   - All tasks in sprint completed
   - No TypeScript errors
   - No console errors

2. **Tests:**
   - Critical paths tested manually
   - Role gating tested
   - API endpoints tested

3. **Documentation:**
   - Code comments for complex logic
   - API documentation updated
   - User-facing docs updated (if needed)

4. **Performance:**
   - Lighthouse scores >90 (Performance)
   - No regressions

5. **Security:**
   - Role checks verified
   - Input validation verified
   - No sensitive data exposed

6. **Deployment:**
   - Deployed to production
   - No critical bugs
   - Monitoring alerts configured

---

**End of Engineering Plan**
