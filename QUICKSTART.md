# Quick Start Guide

## Get Running in 3 Steps

### 1. Install Dependencies
```bash
cd suburb-intelligence-dashboard
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Browser
Navigate to **http://localhost:3000**

Default suburb: **Belmont North**

---

## Project Structure at a Glance

```
suburb-intelligence-dashboard/
│
├── app/                    # Next.js 14 App Router
│   ├── api/               # API route handlers (proxy to Microburbs)
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main dashboard
│   └── globals.css        # Global styles
│
├── components/
│   ├── header/            # Top navigation and search
│   ├── kpi/               # KPI cards and hero section
│   ├── charts/            # Recharts trend visualizations
│   ├── listings/          # Property cards and details
│   ├── panels/            # Amenities, risks, similar suburbs
│   ├── providers/         # React Query & Theme providers
│   ├── shared/            # Error states, skeletons
│   └── ui/                # shadcn/ui base components
│
├── lib/
│   ├── api.ts             # React Query hooks
│   ├── schemas.ts         # Zod validation schemas
│   └── utils.ts           # Formatters and utilities
│
└── Configuration files (package.json, tsconfig.json, etc.)
```

---

## Features Available Out of the Box

### ✅ Completed Features
- [x] Real-time suburb search with typeahead
- [x] Market KPIs (median price, DOM, listings, clearance)
- [x] Interactive price/sales/listings trend charts
- [x] Property listings with sorting and filtering
- [x] Detailed property modal dialogs
- [x] Amenities list with category filters
- [x] Risk assessment with radial chart
- [x] Similar suburbs comparison table
- [x] Property type filtering (all, house, unit, townhouse, land)
- [x] Dark/light theme toggle
- [x] Responsive mobile-first design
- [x] URL state management (shareable links)
- [x] Local storage for recent suburbs
- [x] Error and empty states
- [x] Skeleton loaders
- [x] Full TypeScript with Zod validation

### 🚧 Ready to Implement (Scaffolded)
- [ ] Compare drawer (pin up to 3 suburbs)
- [ ] Export to PDF/PNG (libraries installed)
- [ ] Advanced filters (price range, beds/baths)
- [ ] Map integration (property locations)
- [ ] Bookmarks and favorites

---

## Common Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)

# Production
npm run build        # Build for production
npm start            # Serve production build

# Code Quality
npm run lint         # Run ESLint

# Testing (when configured)
npm test             # Run unit tests
npm run test:e2e     # Run Playwright E2E tests
```

---

## Environment Variables (Optional)

Copy `.env.example` to `.env.local` for custom configuration:

```bash
cp .env.example .env.local
```

For production, replace `MICROBURBS_API_KEY=test` with your actual API key.

---

## Troubleshooting

### Port 3000 already in use?
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Build errors after pulling changes?
```bash
# Clean install
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### Types not updating?
```bash
# Restart TypeScript server in VSCode
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

## Next Steps

1. **Explore the Dashboard**
   - Try searching different suburbs (Sydney, Melbourne, Brisbane)
   - Switch property types (house, unit, townhouse)
   - Click on listings to view details
   - Toggle between light and dark themes

2. **Customize the Design**
   - Edit colors in `tailwind.config.ts`
   - Adjust spacing/fonts in `app/globals.css`
   - Modify KPI cards in `components/kpi/`

3. **Add New Features**
   - Implement compare drawer in `components/compare/`
   - Add export functionality using `html2canvas` + `jspdf`
   - Integrate a map library (Leaflet, Mapbox)

4. **Deploy**
   - Vercel (recommended): `vercel deploy`
   - Netlify: `netlify deploy --prod`
   - Docker: Create Dockerfile with `node:18-alpine`

---

## API Endpoints

All endpoints are proxied through Next.js route handlers:

- `GET /api/properties?suburb=X&property_type=Y`
- `GET /api/amenities?suburb=X`
- `GET /api/market?suburb=X&property_type=Y`
- `GET /api/similar?suburb=X`
- `GET /api/risk?suburb=X`

These forward to `https://www.microburbs.com.au/report_generator/api` with `Authorization: Bearer test`

---

## Tech Stack Recap

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.3 |
| Styling | Tailwind CSS 3.4 |
| Components | shadcn/ui + Radix UI |
| State | React Query 5.0 |
| Charts | Recharts 2.12 |
| Validation | Zod 3.22 |
| Icons | Lucide React |
| Theme | next-themes |

---

**Happy coding! 🚀**

For detailed documentation, see [README.md](./README.md)
