# Pulse Engineering Plan - Executive Summary

**Quick Reference for Development Team**

---

## Current State ✅

- Next.js 15 + TypeScript + Tailwind + Supabase + Prisma
- Auth + Multi-role system (USER/ORGANIZER/VENUE/ADMIN) ✅
- Navigation minimaliste ✅
- Core pages exist (Home, Map, Calendar, Event detail)
- Ticketmaster ingestion ✅
- AI enrichment (basic) ✅
- Stripe integrated ✅

---

## 9 Sprints Overview

| Sprint | Focus | Key Deliverables |
|--------|-------|------------------|
| **1** ✅ | Navigation + Roles | Minimal nav, ProfileMenu, Venue claims |
| **2** | Event Detail | Organizer/Venue tools panels, lazy loading |
| **3** | AI Caching | EventAICache, Pulse Picks generation |
| **4** | Ingestion | Open Data MTL, direct submissions, ICS import |
| **5** | Organizer OS | ICS, Printing, Boosts, Notifications |
| **6** | Venue OS | Booking workflow, Analytics |
| **7** | Social | Friends feed, Pulse Picks pages |
| **8** | Monetization | Subscriptions, Feature gates, Billing |
| **9** | Compliance | Legal pages, Audit logs, Rate limiting |

---

## Critical Technical Decisions

1. **Role Model:** `UserRoleAssignment` join table + legacy `User.role`
2. **Venue Claims:** Status workflow (UNCLAIMED → PENDING → VERIFIED)
3. **AI Caching:** Content-hash based, 30-day TTL, never block pages
4. **Feature Gating:** Subscription-based, server-side checks
5. **Ingestion:** Legal sources only (APIs, open data, user submissions)

---

## File Structure (Key)

```
app/
├── (public)/evenement/[id]/page.tsx
├── (organizer)/organisateur/dashboard/
├── (venue)/venue/dashboard/
└── (admin)/admin/

components/
├── navigation/ (NavigationMinimal, ProfileMenu, etc.)
├── event-detail/ (all event page sections)
└── organizer/ (organizer tools)

lib/
├── auth-guards.ts
├── feature-gates.ts
└── roles/

services/
├── ingestion/connectors/
├── ai/
└── printing/
```

---

## Performance Targets

- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- Lighthouse: >90 (all categories)

---

## Security Checklist

- [x] Server-side role checks
- [ ] Rate limiting (write endpoints)
- [ ] Input validation (Zod)
- [ ] Audit logging
- [ ] Spam prevention

---

## Next Actions

1. **Sprint 2:** Event detail enhancement (organizer/venue tools panels)
2. **Sprint 3:** AI caching implementation
3. **Sprint 4:** Ingestion expansion (Open Data MTL)

---

**Full Plan:** See `docs/ENGINEERING_PLAN.md`
