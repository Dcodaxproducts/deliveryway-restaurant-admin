# DeliveryWay Restaurant Admin

Production-ready Next.js admin dashboard for restaurant, branch, menu, order, POS, promotion, report, loyalty, and settings management.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- TanStack Query
- ESLint 9 with Next.js Core Web Vitals rules

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev        # Start local development server
npm run build      # Create production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript checks
npm run check      # Run lint, typecheck, tests, and build
```

## Environment

Create a local `.env.local` file with the API and authentication values required by the backend. Do not commit secrets.

## Notes

- The dashboard is scoped for business, restaurant, and branch admin workflows.
- Branch admin views are restricted where applicable.
- Keep generated folders such as `.next/`, `node_modules/`, coverage output, and local env files out of git.
