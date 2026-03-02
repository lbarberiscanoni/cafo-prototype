# CLAUDE.md

## Project Overview

**More Than Enough (MTE) Foster Care Data Dashboard** — a React SPA that visualizes foster care metrics and organizations across the US at national, state, and county levels.

## Tech Stack

- **React 19** (CRA / react-scripts 5) — functional components with hooks
- **Tailwind CSS 3** — utility-first styling with MTE brand tokens
- **D3.js 7** — interactive US/state maps and data visualizations
- **Leaflet / react-leaflet** — geographic mapping for organizations
- **Static JSON data** — no backend; ETL scripts produce `src/data/real-data.json` (4.1 MB)
- **Vercel** — deployment with iframe embedding enabled

## Project Structure

```
src/
├── views/              # Main view components (MetricView, OrganizationalView, HistoricView)
├── data/               # JSON datasets, Excel sources, and ETL parse scripts
├── assets/             # Logos, icons, fonts
├── App.js              # Root component with hash-based routing
├── Landing_Page.js     # Home page with interactive US map
├── TopNav.js           # Navigation bar
├── CountySelect.js     # Reusable county dropdown
├── InteractiveUSMap.js # D3 national map
├── InteractiveStateMap.js # D3 state-level county map
├── real-data.js        # Data adapters and formatting utilities (fmt, fmtPct, fmtCompact)
└── styles/             # CSS modules
```

## Commands

```bash
npm start    # Dev server (localhost:3000)
npm run build # Production build
npm test     # Jest + React Testing Library
```

## Key Patterns

- **Hash-based routing** — URLs use `#/level/id/view` format (e.g., `#/state/alabama/metric`). No React Router; parsed by `parseHashToState()` in App.js.
- **Embed mode** — `?embed=true` URL param hides chrome for iframe embedding.
- **State management** — Plain React useState + prop drilling. No Redux or Context API.
- **Data layer** — All data statically imported from JSON at build time. No API calls. Lookup objects keyed by state/county ID for O(1) access.
- **ETL pipeline** — Raw Excel/CSV → parse scripts in `src/data/` → `real-data.json`. Scripts: `parse-metrics.js`, `parse-orgs-from-master.js`, `parse-afcars.js`, `merge.js`, `enrich-coordinates.js`, `audit.js`.
- **SEO** — `generate-seo-pages.js` creates static HTML in `public/data/` with Schema.org markup and JS redirects to the SPA.

## Styling

- MTE brand colors defined in `tailwind.config.js`: `mte-blue (#02ADEE)`, `mte-charcoal`, `mte-green`, `mte-orange`, `mte-purple`, `mte-yellow` with 20% opacity tint variants (e.g., `mte-blue-80`).
- Fonts: Lato (primary), Source Serif Pro (secondary), Nexa (specialty).
- See `styling-guide.md` for full brand guidelines.

## Data

- **real-data.json** — master dataset with `states`, `counties`, `national` (2021–2023 AFCARS timeseries), `organizations`, and `networks`.
- **sources.json** — data source citations and metric definitions.
- State IDs are lowercase slugs (`"alabama"`), county IDs are `"name-st"` format (`"nassau-ny"`).
- Some states use non-standard geography labels (Alaska → "District", Connecticut → "Region").

## Environment

- `.env` contains `ANTHROPIC_API_KEY` — do not commit.
