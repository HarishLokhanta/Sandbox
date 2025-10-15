# Microburbs Sandbox - Suburb Intelligence Dashboard

A beautiful, production-ready web application for exploring Australian real estate data with comprehensive suburb insights, market analytics, and property listings.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![React Query](https://img.shields.io/badge/React_Query-5.0-ff4154)

## 🚀 Features

### Core Functionality
- **Real-time Suburb Search** - Typeahead search with recent suburbs and popular locations
- **Market Intelligence** - Median prices, days on market, clearance rates, and trends
- **Property Listings** - Comprehensive property cards with filtering and sorting
- **Interactive Charts** - Price trends, sales volume, and listings over time using Recharts
- **Local Amenities** - Schools, transport, shopping, and recreation with distance filtering
- **Risk Assessment** - Radial chart visualization of flood, bushfire, crime, and climate risks
- **Similar Suburbs** - Compare nearby areas with key metrics
- **Property Type Filtering** - Filter by all, house, unit, townhouse, or land
- **Dark/Light Themes** - Seamless theme switching with next-themes
- **Responsive Design** - Mobile-first, fully responsive across all devices
- **Accessible** - WCAG AA compliant with keyboard navigation and ARIA labels

### Technical Highlights
- **Type Safety** - Full TypeScript with Zod schema validation
- **API Proxy** - Next.js route handlers secure the Microburbs API token
- **React Query** - Smart caching, background refetching, and optimistic updates
- **URL State Management** - Shareable URLs with search params
- **Local Storage** - Persists recent suburbs and bookmarks
- **Error Handling** - Graceful error states with retry functionality
- **Loading States** - Skeleton loaders for every component

## 📸 Screenshots

```
┌─────────────────────────────────────────────────────────┐
│  🏠 Microburbs Sandbox    [Search] [Property Type] 🌙  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Belmont North                                          │
│  Comprehensive real estate intelligence and insights   │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ $825,000 │ │ 32 Days  │ │ 15 New   │ │ 68%      │  │
│  │ +5.2% ↗  │ │ on Mkt   │ │ Listings │ │ Cleared  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│  Market Trends                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [Prices] [Sales] [Listings]                     │   │
│  │   📈 Interactive area/line charts                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  For Sale Properties (24)      [Sort: Newest First ▼]  │
│  ┌────────┐ ┌────────┐ ┌────────┐                      │
│  │ 🏡     │ │ 🏡     │ │ 🏡     │                      │
│  │$850k   │ │$795k   │ │$920k   │                      │
│  │3🛏 2🛁 │ │4🛏 2🛁 │ │3🛏 1🛁 │                      │
│  └────────┘ └────────┘ └────────┘                      │
│                                                         │
│  [Amenities] [Risks] [Similar Suburbs]                 │
└─────────────────────────────────────────────────────────┘
```

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.3
- **Styling:** Tailwind CSS 3.4 + shadcn/ui
- **State Management:** @tanstack/react-query 5.0
- **Charts:** Recharts 2.12
- **Validation:** Zod 3.22
- **Icons:** Lucide React
- **Theme:** next-themes
- **Exports:** html2canvas + jsPDF (ready to implement)

## 📦 Installation

### Prerequisites
- Node.js 18.17 or later
- npm, yarn, or pnpm

### Setup

1. **Clone and Install**
   ```bash
   cd suburb-intelligence-dashboard
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## 🎨 UX Design Walkthrough

### Design Philosophy
This dashboard prioritizes **clarity, speed, and discovery** while maintaining a clean, professional aesthetic suitable for real estate professionals and home buyers alike.

### Key UX Decisions

#### 1. **Persistent Header with Smart Search**
- Logo anchors the brand identity
- Suburb search with debounced typeahead reduces API calls
- Recent suburbs appear on focus for quick access
- Property type selector is always visible - no hidden menus
- Theme toggle for user preference and accessibility

**Why:** Users often compare multiple suburbs. Making search and filters persistently accessible eliminates frustration and cognitive load.

#### 2. **Hero KPIs: Information at a Glance**
- Four critical metrics displayed prominently
- Color-coded trend indicators (green ↗ up, red ↓ down)
- 12-month change percentage provides historical context
- Icons reinforce meaning (clock = time, house = inventory)

**Why:** Real estate decisions are data-driven. Surfacing median price, days on market, new listings, and clearance rate immediately helps users assess market health without scrolling.

#### 3. **Tabbed Trend Charts**
- Three views: Prices, Sales, Listings
- Area charts for continuous data, line charts for discrete events
- Tooltips show exact values on hover
- Responsive containers scale on mobile

**Why:** Different users care about different metrics. Investors focus on price trends, agents track sales volume, buyers watch inventory. Tabs let each persona find their data quickly without overwhelming the interface.

#### 4. **Filterable, Sortable Listings**
- Visual hierarchy: Image → Price → Address → Features
- Sorting by newest, price ascending/descending
- Property type badge overlay on thumbnails
- Click to open detailed modal with full information

**Why:** Listings are the core action item. Large, tappable cards work on touch devices. Sorting empowers users to browse by preference. Modal keeps users in context without navigation.

#### 5. **Amenities with Category Filters**
- Badge-based category filtering (All, Schools, Transport, etc.)
- Search bar for quick finding (e.g., "coffee")
- Distance badges show proximity
- Scrollable list for large datasets

**Why:** Buyers care deeply about lifestyle amenities. Filtering by category and search accommodates both broad exploration and specific needs ("Where's the nearest school?").

#### 6. **Risk Panel with Radial Chart**
- Radial bar chart provides visual "at-a-glance" risk score
- Individual risk factors (flood, bushfire, crime) listed below
- Color coding: green (low), yellow (medium), red (high)
- Expandable details for transparency

**Why:** Risk is sensitive. A radial chart is less alarming than a bar chart, while still being honest. Users can quickly gauge overall safety, then drill into specifics if concerned.

#### 7. **Similar Suburbs Comparison**
- Side-by-side metrics (price, change %, DOM, sales)
- "View" button switches primary suburb
- "Compare" button (scaffolded for future drawer)
- Distance and similarity score when available

**Why:** Discovery drives engagement. Surfacing similar suburbs encourages exploration and helps users identify hidden gems or validate their choice.

#### 8. **Responsive Mobile-First Layout**
- Single column on mobile, 2-3 columns on tablet, 4+ on desktop
- Collapsible filters and tabs stack vertically
- Touch-friendly tap targets (min 44px)
- Readable font sizes (16px+ body text)

**Why:** Over 60% of real estate searches happen on mobile. Prioritizing mobile ensures the experience is fast and frustration-free on small screens.

#### 9. **Empty and Error States**
- Friendly illustrations (icons, not harsh red X's)
- Actionable copy ("Try a different suburb" vs "Error 404")
- Retry buttons that actually work
- Skeleton loaders prevent layout shift

**Why:** Errors and empty states are opportunities to guide users, not dead ends. Clear messaging reduces support requests and keeps users engaged.

#### 10. **URL State and Local Storage**
- Search params encode suburb and property type
- Shareable URLs for collaboration
- Recent suburbs persist across sessions
- No login required for core features

**Why:** Real estate is collaborative. Shareable URLs let users text links to family. Recent suburbs save time for serial browsers.

### Color Palette Rationale
- **Primary Blue (#0A5BD9):** Trust, stability, professionalism - core real estate values
- **Hover Blue (#0849AD):** Darker for accessible contrast ratios
- **Surface Blue (#E7F0FF):** Subtle backgrounds that don't compete with content
- **Black (#0F172A):** High-contrast text for readability
- **White (#FFFFFF):** Clean, premium feel with generous whitespace

### Accessibility Commitments
- ✅ WCAG AA contrast ratios (4.5:1 text, 3:1 UI)
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Focus indicators on all interactive elements
- ✅ ARIA labels on charts and dynamic content
- ✅ Semantic HTML (headings, landmarks, lists)
- ✅ Dark mode for light sensitivity

## 🏗 Architecture

### Folder Structure
```
suburb-intelligence-dashboard/
├── app/
│   ├── api/                  # Next.js route handlers (API proxy)
│   │   ├── properties/route.ts
│   │   ├── amenities/route.ts
│   │   ├── market/route.ts
│   │   ├── similar/route.ts
│   │   └── risk/route.ts
│   ├── layout.tsx            # Root layout with providers
│   ├── page.tsx              # Main dashboard page
│   └── globals.css           # Global styles and CSS variables
├── components/
│   ├── charts/
│   │   └── trend-chart.tsx   # Recharts components
│   ├── header/
│   │   ├── header.tsx
│   │   ├── suburb-search.tsx
│   │   ├── property-type-select.tsx
│   │   └── theme-toggle.tsx
│   ├── kpi/
│   │   ├── kpi-card.tsx
│   │   └── hero-kpis.tsx
│   ├── listings/
│   │   ├── listing-card.tsx
│   │   ├── property-dialog.tsx
│   │   └── listings-grid.tsx
│   ├── panels/
│   │   ├── amenity-list.tsx
│   │   ├── risk-panel.tsx
│   │   └── similar-table.tsx
│   ├── providers/
│   │   ├── query-provider.tsx
│   │   └── theme-provider.tsx
│   ├── shared/
│   │   ├── error-state.tsx
│   │   └── loading-skeleton.tsx
│   └── ui/                   # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── dialog.tsx
│       ├── tabs.tsx
│       └── ... (and more)
├── lib/
│   ├── api.ts                # React Query hooks
│   ├── schemas.ts            # Zod schemas
│   └── utils.ts              # Utilities and formatters
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### API Proxy Pattern

All API calls go through Next.js route handlers to:
1. **Secure the token** - `Authorization: Bearer test` never exposed to client
2. **Normalize responses** - Zod schemas ensure consistent data shapes
3. **Handle errors gracefully** - Return user-friendly error messages
4. **Enable caching** - Future CDN caching at the edge

Example:
```typescript
// Client calls:
const { data } = useMarket("Belmont North", "all");

// Which hits:
GET /api/market?suburb=Belmont%20North&property_type=all

// Route handler proxies to:
GET https://microburbs.com.au/report_generator/api/suburb/market?...
Authorization: Bearer test
```

### State Management

- **URL Search Params:** Suburb and property type (shareable, bookmarkable)
- **React Query:** Server state (caching, refetching, optimistic updates)
- **Local Storage:** Recent suburbs, bookmarks (persisted across sessions)
- **Component State:** UI state (modals, filters, tabs)

### Type Safety

Every API response is validated with Zod:
```typescript
const MarketResponseSchema = z.object({
  suburb: z.string().optional(),
  stats: MarketStatsSchema.optional(),
  priceHistory: z.array(MarketDataPointSchema).optional().default([]),
  // ... safe parsing with defaults
});
```

Missing or malformed fields gracefully default to `null` or `[]`, preventing crashes.

## 🧪 Testing

### Run Tests
```bash
# Unit tests (ready to add)
npm test

# E2E tests with Playwright (ready to add)
npm run test:e2e
```

### Test Coverage Scaffold
- **Unit:** Utility functions (formatCurrency, debounce, storage)
- **Unit:** Zod schemas (parse valid/invalid data)
- **E2E:** Happy path (search suburb → view listing → open modal)
- **E2E:** Filter listings by property type
- **E2E:** Navigate tabs (Amenities, Risks, Similar)

## 🚧 Future Enhancements

### Compare Drawer (Scaffolded)
- Pin up to 3 suburbs
- Side-by-side KPI comparison
- Mini sparkline trend charts
- Swap primary suburb with one click

### Export Functionality (Libraries Included)
- Export current view as PDF using jsPDF
- Export charts as PNG using html2canvas
- Shareable reports for clients

### Advanced Filtering
- Price range sliders
- Bedroom/bathroom filters
- Land size ranges
- Sort by multiple criteria

### Map Integration
- Leaflet or Mapbox for property locations
- Cluster markers for high-density areas
- Draw radius around amenities

### Bookmarks and Favorites
- Save suburbs to favorites
- Compare saved suburbs over time
- Email alerts for price changes (future API)

## 🔐 Security Notes

- **API Token:** Hardcoded `Bearer test` is for sandbox only. In production:
  - Store in environment variables (`MICROBURBS_API_KEY`)
  - Never expose in client-side code
  - Rotate regularly
- **CORS:** Next.js route handlers bypass browser CORS restrictions
- **Input Validation:** All user inputs validated with Zod
- **XSS Prevention:** React escapes all dynamic content by default

## 📄 License

This project is a demonstration application built for the Microburbs API sandbox. Not licensed for commercial use without permission.

## 🤝 Contributing

This is a demo project, but suggestions are welcome! Key areas:
- Additional chart types (box plots, heatmaps)
- Mobile UX improvements
- Accessibility enhancements
- Performance optimizations

## 🙏 Acknowledgments

- **Microburbs API** for providing sandbox access
- **shadcn/ui** for beautiful, accessible components
- **Vercel** for Next.js and hosting platform
- **Radix UI** for unstyled primitives
- **Recharts** for composable chart library

---

**Built with ❤️ using Next.js 14, TypeScript, and Tailwind CSS**

For questions or issues, please open a GitHub issue or contact the development team.
