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