# PRD — AURA | 3D Forest Lake Resort Booking

## Original Problem Statement
Ultra-premium interactive 3D vacation rental booking web app (React, Tailwind, Three.js, React Three Fiber). Extreme 3D interactive resort map replacing standard lists: low-poly landscape, 5 distinct villas with glass roofs/inner glow/floating ID tags, micro-animations (clouds, swaying trees, water ripples), cinematic camera (slow orbit default, hover target-ring cursor + glassmorphism mini-card, click zips to isometric close-up with surroundings fading), right slide-out reservation panel (features, image slider, Reserve Now), top nav date selector (booked houses turn matte dark grey + pulse, unclickable), golden-hour lighting, sandy beige/deep emerald/gold palette, 60fps low-poly optimization.

## User Choices
- Visual demo bookings (name/email/dates saved to Mongo, no payment)
- 5 invented premium sample villas
- Forest lake retreat setting
- Simple admin view of reservations included

## Architecture
- Backend: FastAPI + Motor/MongoDB (`/app/backend/server.py`). Villas are a static constant; reservations stored in `reservations` collection (uuid ids, ISO date strings).
  - GET /api/villas, GET /api/availability?check_in&check_out, POST/GET/DELETE /api/reservations, GET /api/stats
  - Overlap check: check_in < existing.check_out AND check_out > existing.check_in → 409
  - Pricing: nights × price_per_night + $75 resort fee
- Frontend: React 19 + R3F v9 + drei + gsap + sonner
  - `src/three/Scene.jsx` — Canvas, golden-hour lights, fog, CameraRig (gsap focus blend + slow orbit, pauses on hover), FadeGroup (dims environment when villa selected)
  - `src/three/Villa.jsx` — 5 procedural house types (A-frame, lodge, overwater, treehouse, chalet), hover scale + wireframe glow (green/amber), booked = matte #1F2926 + amber pulse ring, Html tags + glass hover cards, toast on booked click
  - `src/three/Environment.jsx` — terrain, lake w/ ripples, 50+ swaying pines, drifting clouds, rocks, dock, mountains
  - `src/components/` — NavBar (date range, view toggles), ReservationPanel (slider, specs, amenities, form, price breakdown), AdminView (metrics, searchable table, delete)
  - `src/data/villas.js` — 3D positions/types/colors per villa id

## Implemented (June 2026)
- Full 3D interactive map, hover/click/camera choreography, reservation flow, date-driven availability sync, admin dashboard with delete → live 3D state sync
- Iteration 2: MOCKED confirmation emails (HTML stored in `email_log` collection + logged, Resend-ready), guest booking lookup/cancel by email (My Bookings modal, POST /reservations/{id}/cancel with email match), owner-password admin gate (ADMIN_PASSWORD=1234567890 in backend/.env, JWT Bearer, 5-fail/15-min lockout keyed on X-Forwarded-For), instant orbit pause on hover (lag fix), mobile responsive nav/panel/admin
- Tested by testing agent: iteration 1 (100%/100%), iteration 2 (19/20 backend — lockout fixed post-report and curl-verified; 100% frontend)

## Backlog / Next
- P1: Real email sending via Resend once user provides API key (template + log already in place)
- P1: Larger invisible click target around villas for trackpad users
- P1: Filter pills (bedrooms, waterfront, price) in nav
- P2: Gate /api/stats if metrics become sensitive; TTL index on email_log
- P2: Sound design / ambient audio toggle, day-night cycle, payments (Stripe) if promoted beyond demo
