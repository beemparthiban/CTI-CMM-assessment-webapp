# CTI-CMM Assessment Web App — Implementation Plan for Claude Code

## Overview
Convert the CTI-CMM Excel assessment tool (https://github.com/cti-cmm/assessor) into a fully interactive React web application. The Excel file (`CTI-CMM-v1.3.xlsx`) is already downloaded at `~/Downloads/CTI-CMM-v1.3.xlsx`.

The app must faithfully reproduce the spreadsheet's full functionality: scoring 195 objectives across 11 domains on a CTI0–CTI3 scale, with a live dashboard, planning fields, and local persistence.

---

## Phase 1 — Data Extraction

### Task 1.1 — Extract Excel data to JSON

Write a Python script `scripts/extract_data.py` that reads `~/Downloads/CTI-CMM-v1.3.xlsx` using `openpyxl` and outputs `src/data/domains.json`.

**Known Excel structure:**
- Sheets: `CTI-CMM Introduction`, `Assessment Tool README`, `Planning Sheet`, `Dashboard`, then `Domain 1 - ASSET` through `Domain 11 - PROGRAM`
- Each domain sheet layout:
  - Row 2: Title
  - Row 3: `Domain is Relevant?` → col G value
  - Row 4: Full domain name (col B)
  - Row 5: Column headers → col D=SCORE, col E=MAX, col F=STATUS, col G=EVIDENCE, col H=POC, col I=NOTES
  - Then alternating section headers and objective rows
  - Section header rows: col B has section name (e.g. "1. Asset Visibility"), cols C–I are null
  - Objective rows: col B = maturity level (CTI1/CTI2/CTI3, only on first objective of that level — others blank), col C = objective text, col E = max score (always 3), col F = status
  - Subtotal rows: col C = "Section Subtotal"
  - Domain total row: col C = "Domain Total"

**Dashboard sheet (rows 5–16):**
- Col B = full domain name, Col C = nickname, Col D = score, Col E = max, Col F = % complete, Col G = date last assessed, Col H = domain in use

**Output JSON schema:**
```json
{
  "domains": [
    {
      "id": 1,
      "name": "Asset, Change, and Configuration Management",
      "nickname": "ASSET",
      "maxScore": 39,
      "sections": [
        {
          "id": "1.1",
          "name": "Asset Visibility",
          "objectives": [
            {
              "id": "1.1.a",
              "maturityLevel": "CTI1",
              "text": "Full objective text...",
              "maxScore": 3
            }
          ]
        }
      ]
    }
  ]
}
```

The `maturityLevel` field should be inherited: if a row has no level in col B, carry forward the last seen level (CTI1/CTI2/CTI3). Only include non-subtotal, non-domain-total rows as objectives. Skip rows where col C is null or is "Section Subtotal" or "Domain Total".

Run the script and confirm `src/data/domains.json` is generated correctly with all 11 domains and ~195 total objectives.

---

## Phase 2 — Project Scaffold

### Task 2.1 — Initialize Vite + React + TypeScript project

```bash
cd ~/Downloads/cti-cmm-webapp
npm create vite@latest . -- --template react-ts
npm install
npm install tailwindcss @tailwindcss/vite
npm install recharts
npm install lucide-react
npm install react-router-dom
npm install @types/react-router-dom
```

### Task 2.2 — Configure Tailwind CSS v4

Update `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Replace `src/index.css` with:
```css
@import "tailwindcss";
```

Remove `src/App.css`. Clear `src/App.tsx` placeholder content.

### Task 2.3 — Project file structure

```
src/
  data/
    domains.json
  types/
    index.ts
  store/
    useAssessmentStore.ts
  components/
    Layout.tsx
    Sidebar.tsx
    ScoreSelector.tsx
    ObjectiveRow.tsx
    DomainCard.tsx
    MaturityBadge.tsx
    ProgressBar.tsx
    ExportImport.tsx
  pages/
    Dashboard.tsx
    DomainPage.tsx
    PrioritiesPage.tsx
  App.tsx
  main.tsx
```

---

## Phase 3 — Types and Data Model

### Task 3.1 — Define TypeScript types in `src/types/index.ts`

```ts
export type MaturityLevel = 'CTI0' | 'CTI1' | 'CTI2' | 'CTI3' | 'NA';

export interface Objective {
  id: string;          // e.g. "1.1.a"
  maturityLevel: string; // CTI1 | CTI2 | CTI3 (from source data)
  text: string;
  maxScore: number;    // always 3
}

export interface Section {
  id: string;          // e.g. "1.1"
  name: string;
  objectives: Objective[];
}

export interface Domain {
  id: number;
  name: string;
  nickname: string;
  maxScore: number;
  sections: Section[];
}

// User's responses per objective
export interface ObjectiveResponse {
  score: number | null;  // 0, 1, 2, 3, or null (not scored yet)
  isNA: boolean;
  evidence: string;
  poc: string;
  notes: string;
  targetScore: number | null;
  estImpact: 'High' | 'Medium' | 'Low' | '';
  estLOE: 'High' | 'Medium' | 'Low' | '';
  targetDate: string;  // ISO date string
}

export type ImpactLOE = 'High' | 'Medium' | 'Low' | '';

// Computed priority: High impact + Low LOE = P1, etc.
export type Priority = 'P1' | 'P2' | 'P3' | 'P4' | 'Unset';

export interface AssessmentState {
  responses: Record<string, ObjectiveResponse>;  // keyed by objective id
  domainInUse: Record<number, boolean>;           // keyed by domain id
  dateLastAssessed: Record<number, string>;       // keyed by domain id
  assessmentName: string;
}
```

---

## Phase 4 — State Management

### Task 4.1 — `src/store/useAssessmentStore.ts`

Use React `useState` + `useEffect` with `localStorage`. Do NOT use Zustand or Redux — keep it simple with a custom hook.

```ts
// Key exported values:
// - state: AssessmentState
// - getResponse(objectiveId): ObjectiveResponse
// - updateResponse(objectiveId, partial: Partial<ObjectiveResponse>): void
// - setDomainInUse(domainId, inUse): void
// - getDomainScore(domain: Domain): { score: number, max: number, pct: number }
// - getOverallScore(): { score: number, max: number, pct: number }
// - resetAll(): void
// - exportJSON(): string
// - importJSON(json: string): void
```

**Default ObjectiveResponse:**
```ts
const defaultResponse: ObjectiveResponse = {
  score: null,
  isNA: false,
  evidence: '',
  poc: '',
  notes: '',
  targetScore: null,
  estImpact: '',
  estLOE: '',
  targetDate: '',
};
```

**getDomainScore logic:**
- For each objective in the domain:
  - If `isNA === true`: skip (subtract 3 from max, don't add to score)
  - If `score === null`: treat as 0 for score, include in max
  - Else: add score to total; max += 3
- Only count domain if `domainInUse[domainId] === true`

**getOverallScore:** sum of all in-use domain scores / sum of all in-use domain maxes

**Priority calculation (pure function, exported):**
```ts
export function computePriority(impact: ImpactLOE, loe: ImpactLOE): Priority {
  if (!impact || !loe) return 'Unset';
  const matrix: Record<string, Priority> = {
    'High-Low': 'P1', 'High-Medium': 'P2', 'Medium-Low': 'P2',
    'High-High': 'P3', 'Medium-Medium': 'P3', 'Low-Low': 'P3',
    'Medium-High': 'P4', 'Low-Medium': 'P4', 'Low-High': 'P4',
  };
  return matrix[`${impact}-${loe}`] ?? 'Unset';
}
```

**getStatus (pure function, exported):**
```ts
export function getStatus(score: number | null, isNA: boolean): string {
  if (isNA) return 'N/A';
  if (score === null || score === 0) return 'Not Implemented';
  if (score === 1) return 'Partially Implemented';
  if (score === 2) return 'Largely Implemented';
  return 'Fully Implemented';
}
```

**localStorage key:** `cti-cmm-assessment-v1`

**Import/Export:** `exportJSON()` returns `JSON.stringify(state, null, 2)`. `importJSON(str)` parses and replaces state, validating that it has a `responses` key before accepting.

---

## Phase 5 — Core Components

### Task 5.1 — `src/components/ScoreSelector.tsx`

A row of pill buttons for scoring a single objective.

Props:
```ts
interface Props {
  value: number | null;
  isNA: boolean;
  onChange: (score: number | null, isNA: boolean) => void;
}
```

Render 5 buttons: `CTI0`, `CTI1`, `CTI2`, `CTI3`, `N/A`
- CTI0 maps to score=0, CTI1→1, CTI2→2, CTI3→3, N/A→isNA=true
- Active button: solid color background
- Color scheme per level:
  - CTI0: red (`bg-red-500`)
  - CTI1: orange (`bg-orange-400`)
  - CTI2: yellow (`bg-yellow-400`)
  - CTI3: green (`bg-green-500`)
  - N/A: gray (`bg-gray-400`)
- Inactive: white background with colored border and text
- Clicking an already-active button deselects (sets score=null, isNA=false)
- Each button: `px-3 py-1 rounded-full text-sm font-medium transition-colors`

### Task 5.2 — `src/components/ObjectiveRow.tsx`

Renders one objective row. This is the main data-entry component.

Props:
```ts
interface Props {
  objective: Objective;
  response: ObjectiveResponse;
  onUpdate: (partial: Partial<ObjectiveResponse>) => void;
  showPlanningFields: boolean;
}
```

Layout (use a card / bordered row):
```
┌─────────────────────────────────────────────────────────────────┐
│ [CTI1 badge]  Objective text (full, wrapping)                   │
│                                                                  │
│ Score: [CTI0][CTI1][CTI2][CTI3][N/A]    Status: [auto badge]   │
│                                                                  │
│ Evidence: [text input]    POC: [text input]                     │
│ Notes: [textarea, 2 rows]                                       │
│                                                                  │
│ ── Planning ──────────────────────────────────────────────────  │
│ Target Score: [0][1][2][3]   Est. Impact: [dropdown]            │
│ Est. LOE: [dropdown]         Priority: [auto badge]             │
│ Target Date: [date input]                                        │
└─────────────────────────────────────────────────────────────────┘
```

- Planning fields section is only shown if `showPlanningFields === true`
- Status badge uses `getStatus()` — color matches: Not Implemented=red, Partially=orange, Largely=yellow, Fully=green, N/A=gray
- Target Score uses same pill buttons as ScoreSelector but smaller, without N/A option
- Priority badge: P1=red, P2=orange, P3=yellow, P4=gray, Unset=gray/dashed
- All text inputs call `onUpdate` on `onChange` (controlled inputs)

### Task 5.3 — `src/components/ProgressBar.tsx`

```ts
interface Props {
  score: number;
  max: number;
  showLabel?: boolean;
  colorScheme?: 'default' | 'domain';
}
```

Renders a horizontal progress bar. Color based on percentage:
- 0–25%: red
- 25–50%: orange
- 50–75%: yellow
- 75–100%: green

### Task 5.4 — `src/components/MaturityBadge.tsx`

Small colored badge for CTI0/CTI1/CTI2/CTI3. Props: `{ level: string }`. Same color scheme as ScoreSelector pills. Used in ObjectiveRow to show the source maturity level of an objective.

### Task 5.5 — `src/components/DomainCard.tsx`

Dashboard card for a single domain.

```ts
interface Props {
  domain: Domain;
  score: number;
  max: number;
  pct: number;
  inUse: boolean;
  onToggleInUse: () => void;
  onClick: () => void;
}
```

- Clickable card (navigates to domain page on click)
- Shows: domain nickname as large colored label, full name, score/max, % as number, ProgressBar
- Toggle switch for "Domain in Use" — when toggled off, card grays out and domain is excluded from overall score
- Border color based on % completion (red/orange/yellow/green)

### Task 5.6 — `src/components/ExportImport.tsx`

Two buttons: "Export JSON" and "Import JSON".
- Export: calls `exportJSON()`, creates a Blob, triggers browser download as `cti-cmm-assessment-{date}.json`
- Import: hidden `<input type="file" accept=".json">`, clicking "Import" button triggers it; on file select, reads `FileReader`, calls `importJSON()`; show a success/error toast (simple inline message, no library needed)

### Task 5.7 — `src/components/Sidebar.tsx`

Left sidebar navigation.
- App logo/title: "CTI-CMM Assessor" at top
- Links: Dashboard, then each of the 11 domain names (abbreviated or nickname), then Priorities
- Use `NavLink` from react-router-dom for active state highlighting
- Active link: `bg-blue-600 text-white`, inactive: `text-gray-300 hover:bg-gray-700`
- Dark sidebar background: `bg-gray-900`
- Domain links show a colored dot indicating completion % (red/orange/yellow/green)
- Collapsible on mobile (hamburger toggle)

### Task 5.8 — `src/components/Layout.tsx`

Wraps all pages with Sidebar + main content area.
- Full-height flex layout: sidebar (fixed width 256px on desktop) + scrollable main content
- Main: `bg-gray-50 min-h-screen`
- Top bar in main area: shows current page title + ExportImport buttons

---

## Phase 6 — Pages

### Task 6.1 — `src/pages/Dashboard.tsx`

**Header section:**
- Title, version badge ("v1.3"), assessment name (editable inline text field)
- Overall maturity: large number showing `score / max` and `%`
- Maturity tier label based on overall %:
  - 0–25%: "CTI0 — No Capability"
  - 25–50%: "CTI1 — Partial Implementation"
  - 50–75%: "CTI2 — Largely Implemented"
  - 75–100%: "CTI3 — Fully Implemented"

**Chart section (two charts side by side):**

Left — Radar Chart (Recharts `RadarChart`):
- One data point per domain (in-use only)
- Value: domain % completion (0–100)
- Use `PolarAngleAxis` with domain nicknames
- Fill: `rgba(59, 130, 246, 0.3)`, stroke: `rgb(59, 130, 246)`

Right — Bar Chart (Recharts `BarChart`):
- Horizontal bars, one per domain
- X axis: score / max
- Color bars by completion %

**Domain table:**
- Columns: #, Domain, Score, Max, %, Last Assessed, In Use
- Each row clickable (navigate to domain page)
- In Use column: toggle switch
- % column: color-coded number

**12 domain cards** below the table (grid 3-4 cols):
- Use DomainCard component

### Task 6.2 — `src/pages/DomainPage.tsx`

Route: `/domain/:domainId`

**Header:**
- Domain name + nickname badge
- Domain score / max + ProgressBar
- "Domain in Use" toggle
- Tab bar: `Assessment` | `Planning` — toggles `showPlanningFields` across all ObjectiveRows

**Content:**
- For each section in the domain:
  - Section header (sticky on scroll): section name + section score/max + section ProgressBar
  - For each objective in the section:
    - `<ObjectiveRow>` with appropriate props
  - Section divider

**Behavior:**
- All inputs auto-save to store on change (no save button needed)
- Keyboard navigation friendly (Tab between inputs)
- Section headers use `position: sticky; top: 0` to remain visible while scrolling

### Task 6.3 — `src/pages/PrioritiesPage.tsx`

Route: `/priorities`

**Purpose:** Show a consolidated view of objectives where a Target Score has been set, sorted by Priority.

**Filter bar:**
- Filter by Priority: All | P1 | P2 | P3 | P4
- Filter by Domain: All | [domain nicknames]
- Filter by Status: All | Not Implemented | Partially | Largely | Fully

**Table columns:**
- Priority badge (P1/P2/P3/P4)
- Domain
- Section
- Objective text (truncated to 2 lines with expand)
- Current Score
- Target Score
- Est. Impact
- Est. LOE
- Target Date
- Notes

Sort by Priority (P1 first) then by domain ID by default. Allow clicking column headers to sort.

**Summary cards at top:**
- Count of P1, P2, P3, P4 items
- Count with target dates set
- Count completed (current score >= target score)

---

## Phase 7 — Routing

### Task 7.1 — `src/App.tsx`

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DomainPage from './pages/DomainPage';
import PrioritiesPage from './pages/PrioritiesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/domain/:domainId" element={<DomainPage />} />
          <Route path="/priorities" element={<PrioritiesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

Use `<Outlet />` inside `Layout.tsx`.

---

## Phase 8 — Polish and Final Details

### Task 8.1 — Empty states

- Dashboard with no scores: show "Start your assessment" call-to-action pointing to Domain 1
- Priorities page with no planning data: explain how to add target scores in domain pages

### Task 8.2 — Responsive design

- Mobile (<768px): sidebar collapses to hamburger menu overlay
- Domain pages: ObjectiveRow stacks inputs vertically on mobile
- Dashboard charts: stack vertically on mobile

### Task 8.3 — Accessibility

- All interactive elements have proper `aria-label`
- ScoreSelector buttons use `role="group"` with `aria-label="Score for objective"`
- Color is never the only indicator (include text labels)
- Focus rings visible on all focusable elements

### Task 8.4 — Performance

- `domains.json` is imported statically (Vite handles it)
- `useAssessmentStore` reads from localStorage once on mount; writes on each update
- Memoize `getDomainScore` computations with `useMemo` where called in loops (e.g., Dashboard domain cards)
- No unnecessary re-renders: use `useCallback` for update handlers passed to ObjectiveRow

---

## Implementation Order

Execute phases in this order:
1. Phase 1 (extract data → domains.json) — FIRST, everything depends on this
2. Phase 2 (scaffold project)
3. Phase 3 (types)
4. Phase 4 (store)
5. Phase 5 (components, in order: ScoreSelector → MaturityBadge → ProgressBar → ObjectiveRow → DomainCard → ExportImport → Sidebar → Layout)
6. Phase 6 pages (DomainPage first — it's the core UX — then Dashboard, then Priorities)
7. Phase 7 (routing — wire it all together)
8. Phase 8 (polish)

After each phase, run `npm run dev` and verify no TypeScript errors before continuing.

---

## Verification Checklist

After full implementation, verify:
- [ ] All 11 domains render with correct section/objective counts
- [ ] Scoring a CTI3 on all objectives in Domain 1 shows max score (39) on dashboard
- [ ] N/A correctly reduces max score
- [ ] Domain "not in use" excludes from overall total
- [ ] Scores persist across page refresh (localStorage working)
- [ ] Export produces valid JSON; import restores full state
- [ ] Radar chart updates live as scores change
- [ ] Priorities page shows only objectives with target scores set
- [ ] Priority auto-calculates correctly: High impact + Low LOE = P1
- [ ] Mobile layout works without horizontal scroll

---

## Notes

- The app is entirely client-side. No backend, no build-time server.
- All 195 objectives and their full text must be in `domains.json` — do not truncate.
- The Excel file is at `~/Downloads/CTI-CMM-v1.3.xlsx`. The extraction script must handle the inherited maturity level logic (CTI1/CTI2/CTI3 label only appears once per level group, subsequent objectives in that group have an empty col B).
- Default all `domainInUse` values to `true` for all 11 domains.
- The date pickers should use native `<input type="date">` — no date library needed.
