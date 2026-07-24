# Next.js Conventions

Rules for `leaderboard/`, running Next.js `16.2.11`, React `19.2.4`, and Tailwind CSS `^4`. This is a curated subset of Next.js's own App Router docs (vendored at `leaderboard/node_modules/next/dist/docs/`); consult those directly for anything not covered here, and re-check this doc when bumping major versions.

> Next.js 16 has real breaking changes vs. older training data — most notably Middleware → Proxy and the new Cache Components model (see below). Skim the vendored docs before assuming pre-16 behavior.

## Rendering & Routing Model

- App Router only — no `pages/` directory, no `getServerSideProps`/`getStaticProps`.
- Routing is folder-based under `leaderboard/app/`. A segment is only publicly routable once it has a `page.tsx` or `route.ts`; everything else (`_components/`, `_lib/`) is colocated and non-routable by underscore-prefix convention.
- Components are Server Components by default. Add `"use client"` only at the leaf that actually needs interactivity/state/browser APIs — push it down, don't put it at the top of a route.
- Middleware is called **Proxy** in this version: a request interceptor belongs in `leaderboard/proxy.ts` (not `middleware.ts`). Only one `proxy.ts` per project; break logic into modules and import them in.

## Data Fetching & Mutations

- Fetch data directly in async Server Components with `fetch`/`await` — no client-side data-fetching library needed for the initial read path.
- Mutations go through Server Actions (`"use server"` functions), not client-side POST handlers, unless the consumer is a non-browser client.
- API routes (`route.ts`) are for endpoints that need to be called from outside a React tree (webhooks, external clients) — not a default place to fetch data from your own pages.

## Caching

- `cacheComponents` is **not** enabled in `next.config.ts` yet — this app runs the pre-Cache-Components caching model (fetch-level caching + `revalidatePath`/`revalidateTag`), documented in the vendored `01-app/02-guides/caching-without-cache-components.md`.
- If/when a route needs partial prerendering or the `"use cache"` directive, enable `cacheComponents: true` in `next.config.ts` first and follow `01-app/01-getting-started/08-caching.md` — don't sprinkle `"use cache"` in without opting in, it's a no-op/error otherwise.
- Non-deterministic values (`Math.random()`, `Date.now()`, `crypto.randomUUID()`) inside a cached/prerendered path need `connection()` + `<Suspense>` once Cache Components is on; not relevant under the current model but flag it if the app enables Cache Components later.

## Security

- Never trust `params`/`searchParams` — Next.js does not validate or sanitize them; treat as untrusted user input at the boundary.
- Keep secrets in server-only modules; anything imported into a Client Component (or a shared module a Client Component imports) is bundled to the browser. Use `server-only` for modules that must never cross that boundary.
- Proxy is not a substitute for real auth/session checks in Server Components/Actions — it's for optimistic redirects only (see vendored `02-guides/authentication.md`).

## Styling

- Tailwind CSS v4, configured via `leaderboard/app/globals.css` + `@tailwindcss/postcss` — no `tailwind.config.js` (v4 uses CSS-first config). Add design tokens in `globals.css`, not a JS config file.

## Type Safety & Linting

- `strict: true` in `leaderboard/tsconfig.json` — keep it on; don't loosen it to silence errors.
- Path alias `@/*` → `leaderboard/*`.
- ESLint via flat config (`eslint.config.mjs`) extending `eslint-config-next`'s `core-web-vitals` + `typescript` presets. Run `pnpm lint` (delegates from root via `pnpm --dir leaderboard lint`, or run inside `leaderboard/` directly).

## Version Watch

Things that will bite on the next major upgrade, or that are already version-specific traps in this one:

- **Middleware → Proxy** already happened in v16 — don't reintroduce a `middleware.ts` file from muscle memory or outdated examples.
- **Cache Components** is opt-in now but is the direction Next.js is heading; when it's enabled here, this doc's Caching section needs a rewrite, not just an addendum.
- No test runner is configured yet (`leaderboard/package.json` has no `test` script). Pick one (Vitest + React Testing Library is the common App Router pairing) before writing the first behavior test per `AGENTS.md`'s TDD rule, and record the choice here.
