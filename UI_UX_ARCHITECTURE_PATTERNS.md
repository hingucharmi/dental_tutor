# UI/UX Architecture Patterns in Dental Tutor

This repo follows a few recurring patterns to keep the UI consistent, responsive, and role-aware. Below is a quick reference for how the front-end is structured and the patterns you can reuse.

## 1) App Shell & Layout
- App router layout wraps every page with a persistent header and footer, keeping main content centered in a responsive container.  
  Source: `src/app/layout.tsx`
- Tailwind utility aliases (`container-responsive`, `heading-responsive`, `text-responsive`) provide consistent spacing and typography across breakpoints.  
  Source: `src/app/globals.css`

## 2) Role-Aware Navigation (Desktop & Mobile)
- `Header` renders different link sets for patients, dentists, and admins, driven by `useAuth` state; includes a “More” overflow menu for secondary links.  
  Source: `src/components/layout/Header.tsx`
- Mobile menu mirrors desktop IA with collapsible sections, keeping parity between viewports.  
  Source: `src/components/layout/Header.tsx`

## 3) Auth State & Route Guarding
- `useAuth` centralizes token lookup, `/api/auth/me` verification, cross-tab sync via `auth-change` + `storage` events, and redirect-on-miss for protected paths.  
  Source: `src/lib/hooks/useAuth.ts`
- Screens that must be signed-in (e.g., chat) opt into the guard with `useAuth(true)` and short-circuit rendering until the user is known.  
  Source: `src/app/chat/page.tsx`

## 4) Form Architecture (Auth Flows)
- React Hook Form + Zod manage validation, error messaging, and disabled states; forms provide inline icons, helper copy, and loading spinners to set user expectations.  
  Source: `src/app/auth/login/page.tsx`
- Registration extends the pattern with real-time password strength meter and criteria checklist to guide strong passwords.  
  Source: `src/app/auth/register/page.tsx`

## 5) Chat Experience Pattern
- Optimistic send appends the user message immediately, tracks `conversationId`, and shows an assistant “Thinking…” bubble while awaiting the API.  
  Source: `src/app/chat/page.tsx`
- Scroll management uses a ref to auto-focus the latest message, keeping the conversation anchored.  
  Source: `src/app/chat/page.tsx`

## 6) Feedback & Empty States
- Loading, error, and empty states are explicit: alerts for auth errors, disabled buttons with spinners, empty chat prompts, and “Thinking…” indicators.  
  Sources: `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx`, `src/app/chat/page.tsx`

## 7) Visual Language
- Cards with rounded corners, soft borders, and gradient headers convey hierarchy (auth cards, chat surface).  
- Grids and flex layouts adapt from single-column to multi-column feature blocks for marketing and support sections.  
  Sources: `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx`, `src/components/layout/Footer.tsx`


