# Flip Calculator — Product Specification

## 1. Overview

A single-user real estate flip calculator that helps evaluate potential house-flip deals by fetching property details, finding comparable sales, estimating After Repair Value (ARV), and calculating a maximum offer price. Hosted on Vercel, built with Next.js.

**Target user:** Solo real estate investor operating primarily in Tennessee.
**Session model:** Disposable — no accounts, no auth, no saved history.
**Devices:** Fully responsive, optimized equally for mobile and desktop.

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js (App Router) | Full-stack on Vercel; API routes handle server-side scraping |
| UI | React + Tailwind CSS + shadcn/ui | Modern, utility-first, clean aesthetic |
| Scraping (subject) | Zillow | Property details (beds, baths, sqft, year built, home type, lot size) |
| Scraping (comps) | Redfin | Sold comps data; more scrape-friendly than Zillow |
| Address resolution | Redfin search (V1) | Pass raw address to Redfin's search; architect for future Google Places Autocomplete swap |
| TN Assessment | Link out only | Provide pre-filled link to tnmap.tn.gov; no server-side scraping of the GIS portal |
| Hosting | Vercel | Serverless functions for scraping, edge for static assets |
| Theme | System-matched | Light/dark mode follows OS setting via Tailwind `dark:` classes |

---

## 3. Application Structure

### 3.1 Layout

Tabbed interface with three tabs:

1. **Property** — Input and subject property details
2. **Comps** — Comparable sales search, filtering, and results
3. **Calculator** — Offer calculator with real-time computation

Tabs are clean — no badges, no indicators. Navigation is user-driven except for a toast notification when comp data finishes loading (see §5.3).

### 3.2 Responsive Behavior

- **Desktop:** Tabs render as a horizontal tab bar. Tables use full-width columns.
- **Mobile:** Tabs render as a bottom navigation bar or compact top tabs. Tables become horizontally scrollable or card-based.

---

## 4. Tab 1: Property Input

### 4.1 Smart Input Field

A single input field that auto-detects the input type:

| Input Pattern | Detection Logic | Action |
|---------------|----------------|--------|
| Starts with `http://` or `https://` | URL detected | Scrape property details from the linked page (Zillow or Redfin) |
| Matches numeric-only or parcel format | Parcel number detected | Look up via TN assessment portal link |
| Otherwise | Street address assumed | Resolve via Redfin search to find the property |

The input field should have placeholder text: `Enter address, paste a link, or enter parcel number`

### 4.2 Property Details Display

Once the subject property is resolved, display:

| Field | Source |
|-------|--------|
| Address | Scraped |
| Bedrooms | Scraped |
| Bathrooms | Scraped |
| Total Square Footage | Scraped |
| Year Built | Scraped |
| Home Type | Scraped (SFH, Attached/Multi-unit, Manufactured, Land/Lot) |
| Lot Size | Scraped |

If the property is in Tennessee, show a **"View on TN Assessment Portal"** link that opens `tnmap.tn.gov/assessment` pre-filled with the address or parcel number.

### 4.3 Scrape Failure Handling

When scraping fails (blocked, not found, layout changed):

1. Display an inline error message explaining the failure.
2. Suggest trying an alternate input method: *"Couldn't find this property on Zillow. Try pasting a Redfin link instead."*
3. Do **not** fall back to a manual entry form — the tool relies on scraped data.

---

## 5. Tab 2: Comparable Sales

### 5.1 Comp Search Filters

All filters apply to the Redfin comp search. Filters update the comp list, ARV, and max offer in a **full live chain** — changing any filter recalculates everything downstream.

| Filter | Default | Range / Options |
|--------|---------|-----------------|
| Search Radius | 1 mile | 1–10 miles (slider or dropdown) |
| Home Type | Match subject property type | SFH, Attached/Multi-unit, Manufactured, Land/Lot |
| Bedrooms | Exact match to subject | Toggle to expand: ±1, ±2, or all |
| Bathrooms | Exact match to subject | Toggle to expand: ±1, ±2, or all |
| Square Footage | Subject sqft ± 250 (relative mode) | Adjustable in ±250 increments; toggle to absolute min/max mode |
| Minimum Sale Price | None (disabled) | User-set dollar floor to exclude distressed/foreclosure sales |
| Time Period | 180 days | Display groups: 30, 60, 90, 120, 180 days |

### 5.2 Comp Results Display

#### Aggregate Statistics

Displayed at the top of the comps section. Default to **median**; toggle to switch to average.

| Stat | Description |
|------|-------------|
| Days on Market | Median (or average) DOM across filtered comps |
| Sales Price | Median (or average) sale price |
| Price per Square Foot | Median (or average) $/sqft |

#### Time Period Grouping

Comps are grouped by time period with a **toggle between exclusive and cumulative views**:

- **Exclusive:** 0–30 days, 31–60 days, 61–90 days, 91–120 days, 121–180 days (each comp appears in exactly one bucket)
- **Cumulative:** 0–30 days, 0–60 days, 0–90 days, 0–120 days, 0–180 days (larger buckets include all comps from smaller ones)

Each group shows its own aggregate stats (median/average).

#### Comp Table

| Column | Description |
|--------|-------------|
| Address | Full street address |
| Bedrooms | Bedroom count |
| Bathrooms | Bathroom count (including half baths) |
| Square Footage | Total sqft |
| Days on Market | DOM for this sale |
| Sales Price | Final sale price |
| Price per Sq Ft | Calculated: sales price ÷ sqft |
| Date Sold | Date of sale |

**Table behavior:**
- All columns are sortable by clicking the column header. Default sort: date sold (newest first).
- Each row has an **exclude toggle** (e.g., an "X" or checkbox) to manually remove individual comps from the ARV calculation. Excluded comps remain visible but visually muted (strikethrough or dimmed).

#### Low Comp Warning

When the filtered comp set returns fewer than 3 results, display a **confidence warning**: *"Low confidence — only X comps found. Consider expanding search radius or filters."* The ARV still calculates; the warning is informational only.

### 5.3 Navigation Toast

When comp data finishes loading (from a search initiated on the Property tab), display a toast notification on whatever tab the user is currently on:

> **"X comps found — View Results"** (clickable, navigates to Comps tab)

The toast auto-dismisses after ~5 seconds.

---

## 6. Tab 3: Offer Calculator

### 6.1 Inputs

All inputs are **pre-filled with defaults** from the standard deal parameters. Changing any input recalculates the max offer in **real-time** (no submit button).

| Input | Default | Type | Notes |
|-------|---------|------|-------|
| Estimated ARV | Auto-populated from comps | Currency | Editable text input for manual override; shows "(calculated)" label when auto-populated, "(manual)" when overridden |
| Closing Costs at Sale | 2% | Percentage | Percentage of ARV |
| Agent Fees | 5% | Percentage | Percentage of ARV |
| Desired Profit | $60,000 | Currency | Absolute dollar amount |
| Hold Time | 6 | Months | Integer months |
| Loan Interest Rate | 13% | Percentage | Annual rate; interest calculated on full loan amount from day 1 |
| Points Paid at Purchase | 2% | Percentage | Calculated on total loan amount (purchase price + repair costs) |
| Repair Costs | $85,000 | Currency | Absolute dollar amount |
| Monthly Holding Costs | $125 | Currency | Single lump sum covering utilities, insurance, taxes |
| Closing Costs at Buy | 2% | Percentage | Percentage of purchase price |

### 6.2 Calculation Formula

The max offer is derived by working backwards from ARV:

```
Let ARV = Estimated After Repair Value
Let purchase_price = Max Offer (what we're solving for)
Let total_loan = purchase_price + repair_costs

Costs:
  closing_at_sale    = ARV × closing_costs_sale_pct
  agent_fees         = ARV × agent_fees_pct
  profit             = desired_profit
  holding            = monthly_holding_costs × hold_time_months
  interest           = total_loan × (annual_interest_rate / 12) × hold_time_months
  points             = total_loan × points_pct
  closing_at_buy     = purchase_price × closing_costs_buy_pct
  repairs            = repair_costs

Max Offer (purchase_price) = ARV - closing_at_sale - agent_fees - profit
                              - holding - interest - points - closing_at_buy - repairs

Since interest, points, and closing_at_buy depend on purchase_price,
solve algebraically:

purchase_price = (ARV - closing_at_sale - agent_fees - profit - holding - repairs)
                 / (1 + closing_costs_buy_pct
                    + (annual_interest_rate / 12 × hold_time_months)
                    + points_pct
                    + (annual_interest_rate / 12 × hold_time_months × (repair_costs / purchase_price))
                    + (points_pct × (repair_costs / purchase_price)))

Note: Because repair_costs/purchase_price creates a circular dependency,
use iterative solving or rearrange to:

Let fixed_costs = closing_at_sale + agent_fees + profit + holding + repairs
Let net = ARV - fixed_costs

purchase_price = (net - (annual_interest_rate/12 × hold_time_months + points_pct) × repair_costs)
                 / (1 + closing_costs_buy_pct + annual_interest_rate/12 × hold_time_months + points_pct)
```

### 6.3 Output

**Max Offer** displayed as a plain dollar amount (no color coding).

Below the max offer, a **collapsible breakdown section** (collapsed by default) showing:

```
ARV                          $280,000
─ Closing Costs at Sale       - $5,600    (2%)
─ Agent Fees                  - $14,000   (5%)
─ Desired Profit              - $60,000
─ Repair Costs                - $85,000
─ Holding Costs               - $750      (6 mo × $125)
─ Loan Interest               - $X,XXX   (13% on total loan)
─ Points                      - $X,XXX   (2% of total loan)
─ Closing Costs at Buy        - $X,XXX   (2% of purchase)
                              ─────────
= Max Offer                   $94,520.99
```

### 6.4 ARV Auto-Population

- When the Comps tab has filtered results, the ARV is automatically calculated as the **median price per square foot** × subject property's square footage.
- The ARV field shows a "(calculated)" label.
- The user can type over it to set a manual ARV; the label changes to "(manual)" and a small reset link appears to revert to the calculated value.
- The median/average toggle on the Comps tab also affects the auto-populated ARV.

---

## 7. Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Property    │     │    Comps     │     │  Calculator  │
│  Tab         │     │    Tab       │     │    Tab       │
│             │     │              │     │              │
│  Address ──────►  Redfin Scrape ──►  Filter Comps  │
│  Input      │     │              │     │              │
│             │     │  Aggregate   │     │              │
│  Zillow  ◄──┘     │  Stats  ─────────► ARV ────────► │
│  Scrape     │     │  (median)    │     │  Max Offer   │
│             │     │              │     │  (real-time)  │
│  Property   │     │  Exclusions  │     │              │
│  Details    │     │  Filters ────────► Recalculate   │
└─────────────┘     └──────────────┘     └──────────────┘
```

**Reactivity chain:** Any change to comp filters, comp exclusions, or calculator inputs triggers an immediate recalculation of all downstream values. No submit buttons anywhere in the chain.

---

## 8. API Routes (Next.js)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/scrape/property` | POST | Accepts URL or address; scrapes Zillow/Redfin for subject property details |
| `/api/scrape/comps` | POST | Accepts location + filters; scrapes Redfin for comparable sold properties |

Both routes run as Vercel serverless functions with appropriate timeouts (default 10s, extend if needed for scraping).

### 8.1 Scraping Architecture

- Use a server-side HTTP client (e.g., `axios` or `fetch`) with appropriate headers to mimic a browser request.
- Parse HTML responses with `cheerio` for lightweight DOM parsing (no headless browser in V1).
- If Redfin/Zillow requires JavaScript rendering, consider upgrading to Playwright on Vercel (heavier, but more reliable).
- Implement request delays between scraping calls to avoid rate limiting.

---

## 9. Supported Property Types

| Type | Filter Label | Notes |
|------|-------------|-------|
| Single Family Residence | Single Family | Detached houses |
| Attached / Multi-unit | Attached / Multi-unit | Townhomes, condos, duplexes, triplexes |
| Manufactured | Manufactured | Mobile/manufactured homes |
| Land / Lot | Land / Lots | Vacant land (comps may lack sqft-based metrics) |

---

## 10. Geography

- **V1:** Tennessee focus. TN assessment portal link provided for TN addresses.
- **Future:** Add support for other states by plugging in state-specific assessment portal links and adjusting scraping logic if needed.
- Address resolution is geography-agnostic (Redfin covers nationwide), so the app works for any US address even in V1 — the TN assessment link just won't appear for non-TN properties.

---

## 11. Error Handling

| Scenario | Behavior |
|----------|----------|
| Subject property scrape fails | Inline error + suggest alternate input method |
| Comp scrape fails | Inline error on Comps tab; suggest trying a different source or adjusting search |
| Comp scrape returns 0 results | Show "No comps found" message; suggest widening radius or relaxing filters |
| Comp scrape returns < 3 results | Show low-confidence warning; still calculate ARV |
| Network timeout | Show error with retry option |
| Invalid address / not found | Show "Property not found" with suggestion to check spelling or try a link |

---

## 12. Non-Goals (V1)

- User authentication or accounts
- Saved/persistent analyses
- Map view for comps
- PDF/CSV export
- Multiple loan type comparison
- Variable/adjustable interest rates
- Draw schedule interest modeling
- Automated TN assessment portal scraping
- Google Places Autocomplete (deferred to V2)
- Deal quality color coding
- Multi-scenario side-by-side comparison
- Tab badges or indicators

---

## 13. Future Considerations (V2+)

- **Google Places Autocomplete** for address input (swap out Redfin resolution)
- **Additional state assessment portals** as link-outs
- **Map view** for comps (Mapbox free tier)
- **Saved analyses** with lightweight database (Vercel KV or Postgres)
- **Headless browser scraping** (Playwright) if cheerio-based scraping breaks
- **Multi-state support** with state-specific configuration
