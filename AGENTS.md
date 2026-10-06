# AGENTS.md: Paid Order Pipeline
## Product
A small storefront. A visitor browses products without signing in. To buy, they sign in with Google.
Checkout creates a pending order and a Razorpay order (test mode). The order becomes PAID only when a
signature-verified Razorpay webhook says so. When an order becomes PAID, a BullMQ job sends a
confirmation email via Mailgun. The user sees the order go from pending to paid on a status page by polling.
## Repo layout (monorepo, no workspaces tool)
- apps/api = NestJS + TypeScript + Prisma + PostgreSQL + BullMQ (Redis). ALL business logic lives here.
- apps/web = Next.js (App Router) + TypeScript + Tailwind. UI only. NO business logic.
- scripts/ = helper scripts (webhook replay)
- docker-compose.yml = Postgres 16 + Redis 7
## Hard rules (a violation fails the assignment)
1. NEVER use NextAuth/Auth.js, Clerk, Auth0, Firebase, Supabase, Appwrite, Hasura. Auth is Passport in NestJS.
2. NEVER put business logic in Next.js route handlers. Next.js only renders and proxies /api/* to NestJS via rewrites.
3. NEVER mark an order PAID from the frontend, a redirect, or a client callback. ONLY from the verified webhook.
4. Webhook signature MUST be verified against the RAW request body bytes (req.rawBody), using crypto.timingSafeEqual.
5. Webhook idempotency MUST be enforced by a UNIQUE constraint in PostgreSQL, not only in application code.
6. Emails MUST be sent from a BullMQ job (attempts + exponential backoff). No fire-and-forget, no setTimeout.
7. Email and payment providers MUST sit behind interfaces (abstract classes with DI tokens) so tests can fake them.
8. NEVER commit secrets. Only .env.example is committed. .env is gitignored.
9. NEVER trust client-sent prices or amounts. Read the price from the products table.
10. No commerce starter kits, no cloned boilerplate.
## Tech decisions (do not change)
- Prisma 6 (pin prisma@6 and @prisma/client@6; do NOT use Prisma 7).
- Payments: Razorpay, test mode. Email: Mailgun (REST API, called with built-in fetch, no SDK). Queue: BullMQ with Redis.
- Money is stored as integer paise (Int). Currency INR.
- Session: our own JWT in an httpOnly, SameSite=Lax cookie named `session`. Secure flag when NODE_ENV=production.
- Order status enum: PENDING | PAID | FAILED. PAID is terminal and never goes backwards.
- Webhook event status enum: PROCESSED | UNMATCHED | IGNORED.
## Code quality rules
- TypeScript strict. No `any` unless commented why.
- One NestJS module per concern: auth, users, products, orders, payments, webhooks, queue, email, admin, prisma, config.
- DTOs validated with class-validator + ValidationPipe (whitelist: true).
- Small functions, clear names, short comments explaining WHY (not what) at the tricky parts.
- Do not touch files unrelated to the current task. Do not refactor unprompted. Do not add dependencies unprompted.
## How to work
- Do exactly the task in the prompt. If something is ambiguous, pick the simplest option and state it in your final message.
- After finishing: run build/lint/tests that exist and report the result honestly. Say what you did NOT do.