# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (webapp)
```bash
# Development
npm run dev          # Start Next.js dev server on port 3000

# Production
npm run build        # Build for production + generate 404.html
npm run start        # Start production server
npm run lint         # Run ESLint

# Database Management (Prisma)
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes without migration
npm run db:seed      # Seed database with initial data
npm run db:studio    # Open Prisma Studio GUI
npm run db:reset     # Reset database (WARNING: deletes all data)

# Single component development
npm run dev -- --turbo  # Use Turbo mode for faster HMR
```

### Backend (websocket-server)
```bash
# Development
npm run dev          # Start with nodemon hot reload on port 8081
npm run dev:port     # Start on custom port (PORT env var)

# Production
npm run build        # Compile TypeScript + copy XML templates
npm run start        # Start production server
npm run start:ngrok  # Start with automated ngrok tunnel

# Utilities
npm run copy-files   # Copy XML templates to dist/
npm run sync:ngrok   # Watch ngrok URL changes and sync
npm run update:twilio-webhook  # Update Twilio webhook URL
```

### Full Stack Development
```bash
# Terminal 1: Backend with ngrok
cd websocket-server && npm run start:ngrok

# Terminal 2: Frontend
cd webapp && npm run dev
```

## Architecture

### System Overview
This is a real-time voice calling application that bridges OpenAI's GPT-4o Realtime API with Twilio Voice API. The architecture follows a hub-and-spoke pattern where the WebSocket server acts as the central coordinator between:
- Twilio (handles telephony)
- OpenAI (provides AI conversation capabilities)
- Frontend (user interface and control panel)

### Core Components

**WebSocket Server** (`/websocket-server/`)
- Central hub managing all real-time connections
- Handles Twilio webhook endpoints (`/incoming-call`, `/outgoing-call`)
- Manages OpenAI Realtime API WebSocket connections
- Coordinates multi-client sessions (multiple browser tabs can view same call)
- Implements custom function handlers for AI tool integration

**Web Application** (`/webapp/`)
- Next.js app with App Router pattern
- Supabase for authentication and user management
- Stripe integration for credit system
- Real-time WebSocket connection for live call updates
- Zustand store for state management
- Prisma ORM for database operations
- Call recordings management and playback

### Key Architectural Patterns

**Session Management**
- Each call creates a unique session ID
- Sessions bridge Twilio calls ↔ OpenAI conversations ↔ Frontend clients
- Multiple clients can connect to observe the same session
- Session cleanup on call termination

**WebSocket Message Flow**
```
Twilio Audio → WebSocket Server → OpenAI Realtime API
                     ↓
              Frontend Client(s)
```

**Function Handler System**
- Extensible tool integration for AI assistant
- Located in `/websocket-server/src/functions/`
- Each handler implements specific capabilities (weather, time, etc.)

## Key Files and Their Roles

### Backend Critical Files
- `src/server.ts` - Main server initialization and WebSocket setup
- `src/twilio-handlers.ts` - Twilio webhook handlers for calls
- `src/websocket-handlers.ts` - WebSocket message routing
- `src/lib/get-session.ts` - Session management logic
- `src/services/stream-service.ts` - Audio streaming coordination
- `src/templates/` - TwiML XML templates for Twilio responses

### Frontend Critical Files
- `app/page.tsx` - Main dashboard with call controls
- `app/recordings/page.tsx` - Call recordings management page
- `app/login/page.tsx` - Authentication page
- `components/call-interface.tsx` - Main call interface component
- `components/realtime-logs-panel.tsx` - Real-time call logs display
- `components/session-configuration-panel.tsx` - AI session configuration
- `lib/auth-context.tsx` - Authentication context provider
- `lib/handle-realtime-event.ts` - WebSocket event handling
- `lib/prisma.ts` - Database client configuration
- `components/ui/` - Shadcn/ui component library

## Environment Configuration

### Required Environment Variables

**Frontend (.env.local)**
```bash
# Supabase (Authentication)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# WebSocket Server
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8081  # Development
# NEXT_PUBLIC_WEBSOCKET_URL=wss://your-domain.com  # Production

# Stripe (Optional - for credits)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

# Database (Prisma)
DATABASE_URL=  # PostgreSQL connection string

# Twilio (for frontend API routes)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

**Backend (.env)**
```bash
# Core
PORT=8081
ALLOWED_ORIGIN=http://localhost:3000  # Frontend URL

# OpenAI
OPENAI_API_KEY=  # Required for Realtime API

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=  # Your Twilio phone number

# Public URL (for Twilio webhooks)
PUBLIC_URL=  # Ngrok URL in dev, domain in production
```

## Development Workflow

### Initial Setup
1. Install dependencies in both directories:
   ```bash
   cd webapp && npm install
   cd ../websocket-server && npm install
   ```
2. Set up database:
   ```bash
   cd webapp
   npm run db:push    # Create database schema
   npm run db:seed    # Optional: seed with test data
   ```
3. Configure environment variables in both `.env` files

### Setting Up Twilio Webhooks
1. Start backend with ngrok: `npm run start:ngrok`
2. Copy the ngrok URL from console output
3. Update Twilio phone number webhooks:
   - Voice webhook: `https://[ngrok-url]/incoming-call`
   - Status callback: `https://[ngrok-url]/call-status`
   - Recording status: `https://[ngrok-url]/recording-status`

### Adding New AI Functions
1. Create handler in `/websocket-server/src/functions/`
2. Export from `/websocket-server/src/functions/index.ts`
3. Update function definitions in session configuration
4. Functions automatically available to AI assistant

### Modifying UI Components
- All UI components use Shadcn/ui patterns
- Modify base components in `/webapp/components/ui/`
- Use existing design tokens from `tailwind.config.ts`
- Follow utility-first CSS approach with TailwindCSS

## Important Considerations

### Real-time Audio Handling
- Audio streams are base64-encoded PCM16 format
- Sample rate: 24kHz for OpenAI, 8kHz for Twilio
- The server handles audio format conversion automatically
- Minimize latency by keeping server geographically close to users

### Session Persistence
- Sessions are ephemeral (memory-only, not database-backed)
- Call logs can be saved to database via frontend
- Consider implementing Redis for production session storage

### Security Notes
- CORS configured for specific origins
- Twilio webhook validation implemented
- API keys should never be exposed to frontend
- Use Supabase RLS policies for data access control

### Performance Optimization
- WebSocket connections use heartbeat/ping-pong for connection health
- Implement reconnection logic for network interruptions
- Consider implementing audio buffering for poor network conditions
- Monitor OpenAI API usage and costs

## Common Development Tasks

### Testing Outgoing Calls
```bash
# 1. Ensure backend is running with ngrok
# 2. Open frontend and login (create account if needed)
# 3. Enter phone number with country code (+1234567890)
# 4. Click "Start Call"
# 5. Monitor console for WebSocket messages
```

### Managing Call Recordings
- Recordings are automatically saved to database when calls complete
- Access recordings at `/recordings` page in the frontend
- Recordings include playback controls and download options
- Database schema managed via Prisma migrations

### Testing Database Changes
```bash
# View database in GUI
cd webapp && npm run db:studio

# Apply schema changes
npm run db:push  # Quick sync without migration
npm run db:migrate  # Create and apply migration
```

### Debugging WebSocket Connections
- Check browser console for connection errors
- Verify CORS settings match frontend URL
- Ensure WebSocket URL protocol matches (ws:// for http, wss:// for https)
- Check backend logs for connection attempts
- Monitor real-time events in the Logs panel

### Updating AI Behavior
- Modify system instructions in `/websocket-server/src/lib/get-session.ts`
- Adjust voice settings in Session Configuration panel or OpenAI session config
- Add new tools via the function handler system in `/websocket-server/src/functions/`
- Available voices can be configured via `OPENAI_VOICES` environment variable

### Revised Comprehensive Technical Prompt for Implementing a Scalable User Authentication System, Profile Management, and Token Purchasing in the Jingle.AI AI-Voice-Caller Repository

**Objective:**  
As a PhD-level genius software programmer adhering to best practices in all development areas—including security (e.g., zero-trust architecture, cryptographic primitives), scalability (e.g., microservices-ready design, async processing), modularity (e.g., hexagonal architecture for domain isolation), error handling (e.g., circuit breakers, idempotent operations), testing (e.g., TDD with 90%+ coverage, chaos engineering), and performance optimization (e.g., caching layers, query optimization)—design and implement a fully functional, scalable, and professionally designed user authentication system integrated into the existing Jingle.AI codebase (located at https://github.com/jwillz7667/ai-voice-caller). This system must leverage the **existing database** for storage, supporting seamless user sign-up, sign-in, profile settings persistence, and a token purchasing mechanism. The implementation should extend the current architecture: a Next.js frontend in the `webapp/` directory (using TypeScript/JavaScript, with components like `sidebar.tsx`, `client-layout.tsx`, `call-interface.tsx`, and pages like `logs/page.tsx` and `settings/page.tsx`) and an Express-based WebSocket backend in the `websocket-server/` directory (with files like `server.ts` and `sessionManager.ts`). Ensure minimal disruption to existing real-time voice calling functionality powered by OpenAI Realtime API and Twilio, while enhancing it with user-specific sessions (e.g., token-gated calls).

The system must prioritize:
- **Security:** Employ OWASP-compliant practices: Argon2id or bcrypt (with PBKDF2 fallback) for password hashing (≥16 rounds), JWT/RS256 for stateless auth with short-lived access tokens (5-15m expiry) and long-lived refresh tokens (24h-7d), CSRF/XSS mitigation via SameSite cookies and Content-Security-Policy headers, SQL injection prevention via parameterized queries/ORM, and audit logging for all auth events.
- **Scalability:** Design for distributed systems: Use database sharding (e.g., via Citus for PostgreSQL), Redis for token blacklisting/session caching (TTL-based eviction), and horizontal scaling of backend instances with shared auth middleware. Target 99.99% uptime with health checks and auto-scaling triggers.
- **User Experience:** Frictionless flows with progressive enhancement (e.g., offline-capable forms via Service Workers), real-time updates via WebSockets (e.g., token balance sync), and inclusive design (WCAG 2.2 AA compliance, dark mode support).
- **Modularity:** Enforce clean architecture: Domain layer for business logic (e.g., `UserDomainService`), infrastructure layer for DB/externals, adapters for HTTP/WebSocket. Use TypeScript generics and dependency inversion for loose coupling.
- **Testing:** Comprehensive suite: Unit tests (Vitest/Jest, 95% coverage), integration tests (Supertest for APIs, MSW for mocks), e2e tests (Playwright for auth flows), security scans (npm audit, Snyk), and performance benchmarks (Artillery for load testing).
- **Deployment Considerations:** Align with existing Node.js v18+ setup; add Docker Compose for local dev (with DB container); support Kubernetes manifests for prod; use GitHub Actions for CI/CD with automated migrations and smoke tests.

**Technology Stack Additions/Integrations:**  
- **Database:** Integrate seamlessly with the **existing database** (assumed relational like PostgreSQL for ACID guarantees; if NoSQL like MongoDB, adapt schemas to documents/collections). Extend current ORM (e.g., Prisma if present; otherwise, introduce Prisma for type-safe migrations without disrupting existing schemas). Ensure backward-compatible extensions.
- **Authentication:** JWT ecosystem with NextAuth.js v5 for frontend (credential + future OAuth providers). Backend: `jsonwebtoken` for signing/verification, `jose` for modern JWE if needed.
- **Payments for Tokens:** Stripe v14+ for token purchases (virtual credits for API usage, e.g., 1 token = 1 min call). Use Stripe Elements for PCI-compliant forms, webhooks for async fulfillment (idempotent via transaction IDs), and atomic DB updates (e.g., via Prisma transactions).
- **Additional Libraries:** 
  - Backend: `@prisma/client` (if not present), `argon2`, `redis` (ioredis for clustering), `express-rate-limit`, `cors`.
  - Frontend: `@next-auth/prisma-adapter` (for session storage), `zod` + `react-hook-form` for validation/forms, `@stripe/stripe-js` + `stripe`.
  - Shared: Monorepo tools like Turborepo if expanding; define shared types in `types/auth.ts`.
- **Environment Variables:** Extend existing `.env.example` in both directories with `DATABASE_URL` (already present), `JWT_SECRET` (≥32 chars, rotated quarterly), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `REDIS_URL`. Enforce validation with `zod` at startup.

**Step-by-Step Implementation Instructions:**

1. **Database Schema Extensions (Leverage Existing Setup):**
   - Audit existing schema: Run `prisma introspect` (if Prisma) or query metadata to map current tables/collections. Assume core tables (e.g., for calls/logs) exist; extend without altering them.
   - Update `prisma/schema.prisma` (or equivalent ORM file):
     - Extend `User` model (or create if absent): `id String @id @default(cuid())`, `email String @unique`, `passwordHash String`, `username String? @unique`, `tokenBalance Int @default(0)`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`.
     - Add `Profile` model: `id String @id @default(cuid())`, `userId String @unique`, `user User @relation(fields: [userId], references: [id])`, `fullName String?`, `phoneNumber String?`, `preferences Json?` (for settings like voice prefs).
     - Add `TokenTransaction` model: `id String @id @default(cuid())`, `userId String`, `user User @relation(fields: [userId], references: [id])`, `amount Int`, `type TokenType` (enum: PURCHASE, USAGE), `stripeSessionId String?`, `createdAt DateTime @default(now())`.
     - Relations: Cascade deletes on Profile, soft deletes on Transactions for compliance.
   - Run targeted migration: `npx prisma migrate dev --name add-auth-models`. Use `@@index` for query perf (e.g., on email). Seed test data via `prisma/seed.ts` with factories (e.g., Faker.js).
   - Optimization: Add GIN indexes on Json fields, connection pooling (e.g., PgBouncer), and read replicas for queries.

2. **Backend Authentication API Endpoints (Extend `websocket-server/src/server.ts`):**
   - Refactor for modularity: Create `routes/auth.ts` (Express Router), `middleware/auth.ts` (JWT guard), `services/userService.ts` (Prisma-based CRUD with caching).
   - Endpoints (RESTful, under `/api/v1/auth`; use async/await with try-catch):
     - POST `/signup`: Zod schema validation (`z.object({email: z.string().email(), password: z.string().min(8), username: z.string().optional()})`). Hash password (`argon2.hash(password, { salt: crypto.randomBytes(32) })`). Atomic transaction: Create User + Profile + initial Transaction (balance=0). Generate JWT: `{ sub: user.id, iat, exp }` signed with RS256 private key. Set httpOnly Secure cookie for refresh token (encrypted with AES-GCM). Return `{ accessToken, user: { id, email, tokenBalance } }`.
     - POST `/signin`: Validate creds (`argon2.verify(hash, password)`). Issue tokens; increment login count in DB.
     - POST `/refresh`: Extract refresh from cookie, verify/decrypt, issue new access if valid; rotate refresh for forward secrecy.
     - POST `/logout`: Blacklist access token in Redis (key: `blacklist:${token}`, TTL=exp-iat); clear cookie.
     - GET `/profile`: Auth middleware extracts `req.user.id` from JWT, fetch User + Profile (include relations, N+1 avoidance via Prisma `include`).
     - PATCH `/profile`: Validate partial updates (`z.object({fullName: z.string().optional(), ...})`), apply via Prisma `update({ data: validated })`; emit WebSocket event for real-time sync.
     - POST `/purchase-tokens`: Auth req; create Stripe Checkout Session (`stripe.checkout.sessions.create({ mode: 'payment', line_items: [{ price: 'price_id', quantity }] })`). On webhook (`/stripe/webhook`, raw body + sig verification): Atomic update `tokenBalance += amount` + insert Transaction. Handle failures with exponential backoff retries.
   - WebSocket Integration: In `sessionManager.ts`, on upgrade: Parse `?token=JWT` query, verify, attach `ws.userId`. Reject unauth connections; deduct tokens on call init (e.g., via pub/sub to Redis).
   - Security/Perf: Rate limit (5 req/min signup, flexible per IP/user), CORS whitelist, helmet.js for headers. Cache profiles in Redis (invalidation on update).

3. **Frontend Authentication Integration (Extend `webapp/`):**
   - Setup NextAuth: Create `app/api/auth/[...nextauth]/route.ts` with `NextAuth({ adapter: PrismaAdapter(prisma), providers: [CredentialsProvider({ async authorize(creds) { /* API call to backend */ } })] })`. Configure callbacks for JWT customization (e.g., add tokenBalance).
   - Session Provider: Wrap `layout.tsx` or `client-layout.tsx` with `<SessionProvider>`. Use `useSession()` hook for state.
   - Auth Pages: Add `/app/auth/signup/page.tsx` and `/signin/page.tsx` (server components for SEO). Forms: `<form onSubmit={handleSubmit(async data => signIn('credentials', { ...data, redirect: false })) }>` with `react-hook-form` + Zod resolver. Error toasts via `react-hot-toast`. Redirect post-auth to `/settings`.
   - Route Protection: `middleware.ts`: `if (!session && protectedPaths.includes(req.nextUrl.pathname)) redirect('/auth/signin')`.
   - UI Enhancements: In `sidebar.tsx`, conditional render: Auth'd → `{user.email} | {tokenBalance} tokens | Profile/Settings`; Unauth'd → Sign In/Up. Add token buy button linking to Stripe modal.
   - Profile/Settings: Extend `settings/page.tsx`: Fetch via `getServerSession()`, form for updates (`useForm({ resolver: zodResolver(schema) })`), optimistic UI updates + `mutate()` from SWR/React Query.

4. **Token Purchasing System (Cross-Cutting):**
   - Frontend: In settings/sidebar, `<StripeElementsProvider><CheckoutForm amount={100} /></StripeElementsProvider>`. On success, poll `/profile` or subscribe to WebSocket for balance update.
   - Backend Fulfillment: Webhook endpoint verifies sig (`stripe.webhooks.constructEvent(body, sig)`), handles `checkout.session.completed`: `prisma.$transaction(async tx => { await tx.tokenTransaction.create({...}); await tx.user.update({ where: {id}, data: {tokenBalance: { increment: amount } } }); })`. Refund handling for `payment_failed`.
   - Usage Deduction: In call flow (`call-interface.tsx` → WebSocket msg), backend checks `if (user.tokenBalance < cost) reject`; else atomic decrement + Transaction log.
   - Analytics: Track via Stripe dashboard + custom DB queries (e.g., monthly revenue reports).

5. **Testing, Monitoring, and Refinements:**
   - Tests: `vitest` suite for services (mock Prisma with `@prisma/client` extend), Playwright for flows (e.g., `test('signup → purchase → call', async ({ page }) => {...})`). Security: OWASP ZAP scans.
   - Monitoring: Integrate Sentry for errors, Prometheus for metrics (e.g., auth latency), ELK stack for logs.
   - Refinements: A/B test UX (e.g., via PostHog), audit for GDPR compliance (consent for profiles), benchmark (e.g., 10k concurrent signins → <200ms p95).

This implementation transforms the app into a production-grade SaaS, with auth as the gating mechanism for monetized features. Commit incrementally with conventional commits; PRs require approvals.