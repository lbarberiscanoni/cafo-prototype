# MTE Data Pipeline - Architectural Decisions

## Overview

This document tracks architectural decisions for the More Than Enough (MTE) foster care data visualization pipeline.

---

## Questions for Leah

### Pending Decisions

**1. Connections Sheet - ON HOLD**
The Connections sheet has 1,199 org-to-org relationships. We're holding on this for now.
- For initial release: focus on network memberships only (which orgs belong to which networks)
- May revisit org-to-org connections later

**2. Missing Organizations - DECIDED: IGNORE**
11 orgs appear in Network Members but not in Master sheet. We're ignoring them because:
- They have no coordinates (can't display on map)
- They have no category/activity data (can't filter)
- They'd only contribute names to network rosters

Orgs being skipped: NoCo CAFO, Dream Together 2030, Chestnut Mountain Village Ministry, Wildwood Collective, Plant Tamarisk King's Table Church, NoMore Foundation, Morningstar Storage Generations Church, The Church of Remerton, Camp Rock of Georgia Inc, Hands of Hope NWI

### Data Quality Issues to Fix

**Sources and Definitions - LEAH FIXING:**
- ✓ Adding missing states: New York, South Dakota
- ✓ Fixing typo: "Pennslyvania" → "Pennsylvania"
- ✓ Removing embedded notes from: Nevada, Ohio, West Virginia (keeping states)

**MTE Metrics - LEAH FIXING:**
- ✓ Standardizing adoption column names across all states (currently varies: "Number Adopted", "Number of Adoptions", etc.)
- ✓ Connecticut: R2 duplicate, R3 missing (typo)
- States without adoption data remain as N/A

**Stale State Data (from Sources and Definitions "Date of Data Collection"):**
| State | Data From | Age |
|-------|-----------|-----|
| Minnesota | 2019 | 6 years |
| Washington | 2020 | 5 years |
| Wisconsin | 2021 | 4 years |
| Alabama | 2022 | 3 years |
| Pennsylvania | 2022 | 3 years |

Is fresher data coming for these states? (Historic View will show actual date so users know)

### Process Questions - ANSWERED

1. **File delivery:** Daily Google Sheets export in Excel format (.xlsx)
2. **Refresh frequency:** Daily
3. **Who runs pipeline:** *(still open)*

### Validation - CONFIRMED BY LEAH ✓

These "ground truth" values are confirmed correct and will be used for pipeline verification:

**AFCARS 2023:**
| State | Children in Care | Adopted |
|-------|-----------------|---------|
| National | 358,080 | 55,480 |
| California | 44,468 | 5,994 |
| Texas | 19,168 | 3,861 |
| Florida | 20,322 | 5,325 |

**County counts:**
| State | Counties |
|-------|----------|
| Texas | 254 |
| Georgia | 159 |
| Kentucky | 120 |

---

## Data Sources

### 1. MTE Master Data (Google Sheets → Excel)

**File:** `MTE_Master_Data.xlsx`

| Sheet | Rows | Purpose | Status |
|-------|------|---------|--------|
| Master | 490 | Organizations - names, locations, coords, categories, impact areas | ✅ Use |
| Network Members | 73 | Which orgs belong to which networks | ✅ Use |
| Connections | 1199 | Org-to-org relationships | ⏸️ Hold (phase 2) |
| Counties Served | 1526 | Which counties each org serves beyond HQ | ✅ Use (profile only, not map) |
| Counties Served | 1526 | Which counties each org serves beyond HQ | ✅ Use (in org profile only, not on map) |
| Stats | 12 | Summary stats | ❌ Ignore |
| Map Notes for Qlik | 21 | Legacy notes | ❌ Ignore |
| Documentation | 0 | Empty | ❌ Ignore |
| Fellowship Participants | 95 | Fellowship tracking | ❌ Ignore |
| lat long data | 177 | Geocoding helper | ❌ Ignore |
| Counties Served | 1526 | Org coverage mapping | ❌ Ignore (for now) |
| All Counties | 3143 | Reference list | ❌ Ignore |
| Other sheets | - | Lookups/helpers | ❌ Ignore |

### 2. AFCARS Data

**File:** `AFCARS_GOOD.xlsx`

**Purpose:** Federal foster care statistics from Administration for Children and Families. **GROUND TRUTH** for state/national metrics.

**Structure:** Single sheet, 156 rows (52 states × 3 years), 9 columns

| Column | Coverage | Description |
|--------|----------|-------------|
| State | 156/156 | 2-letter code (50 states + DC + PR) |
| Year | 156/156 | 2021, 2022, 2023 |
| Children in Care | 156/156 | Total children in out-of-home care |
| Children in Foster Care | 154/156 | In licensed foster homes |
| Children in Kinship Care | 155/156 | With relatives |
| Children Waiting For Adoption | 154/156 | TPR completed, waiting |
| Children Adopted | 156/156 | Adoptions completed |
| Biological Reunification Rate | 156/156 | Rate (0.25-0.68 range) |
| Family Preservation Cases | 111/156 | 45 have '-' or '*' values |

**National Totals (US excluding PR):**

| Year | Children in Care | Adopted | Avg Reunification |
|------|-----------------|---------|-------------------|
| 2021 | 390,604 | 53,022 | 46.5% |
| 2022 | 366,222 | 52,929 | 45.7% |
| 2023 | 358,080 | 55,480 | 46.2% |

**Trend:** -8.3% children in care (2021→2023), +4.6% adoptions

**State Highlights (2021→2023):**
- Biggest decrease: TX -31.6%, HI -28.2%, MT -26.8%
- Biggest increase: LA +34.1%, DE +32.2%, NM +15.3%
- Top 5 by size (2023): CA (44K), FL (20K), IL (19K), TX (19K), OH (16K)

**Data Quality Notes:**
- Family Preservation Cases has 38 rows with '-' and 7 with '*' (data not available)
- HI missing foster/kinship breakdown
- Very clean data overall

**Column Mapping to MTE Metrics:**

| AFCARS | MTE Metrics Equivalent |
|--------|----------------------|
| Children in Care | Number of Children in Care |
| Children in Foster Care | Number of Children in Foster Care |
| Children in Kinship Care | Number of Children in Kinship Care |
| Children Waiting For Adoption | Number of Children Waiting for Adoption |
| Children Adopted | Number Adopted (varies by state) |
| Biological Reunification Rate | Biological Family Reunification Rate |
| Family Preservation Cases | Number of Family Preservation Cases |

**Pipeline Role:**
- AFCARS = authoritative state/national metrics (standardized definitions)
- MTE Metrics = supplemental county-level data (varying definitions)
- Historical view: AFCARS 2021-2023, MTE 2024-2025 snapshots
- Status: ✅ Use

### 3. MTE Metrics State Database

**Files:** `_2024__MTE_Metrics_State_Database.xlsx`, `_2025__MTE_Metrics_State_Database_-_GOOD__1_.xlsx`

**Structure:** Each file contains ~111 sheets:
- **51 State pages** (Alabama, California, etc.) → ✅ USE - county-level data
- **51 "XX Data" sheets** (AL Data, CA Data, etc.) → ❌ IGNORE - raw source data
- **9 Meta sheets** → ❌ IGNORE per README

| Sheet Type | Example | Status |
|------------|---------|--------|
| State pages | Alabama, California, Texas | ✅ Use |
| Data pages | AL Data, CA Data | ❌ Ignore |
| All Data Connect | - | ❌ Ignore |
| Metrics Check | - | ❌ Ignore |
| State Overview | Demographics | ❌ Ignore |
| Top 50% | - | ❌ Ignore |
| Sheet75, Sheet77 | - | ❌ Ignore |
| AFCARSCSC | - | ❌ Ignore |
| Population & Church Numbers | - | ❌ Ignore |
| County PopulationPovertyRacial | - | ❌ Ignore |

**State Page Structure:**
- Row 0 = column headers
- Row 1+ = county data
- ~3,064 total county rows across all states

**17 Common Columns (all states):**
- County, County Population
- Number of Children in Care
- Number of Children in Foster Care
- Number of Children in Kinship Care
- Number of Children Placed Out-of-County
- Number of Foster and Kinship Homes
- Number of Children Waiting for Adoption
- Number of Family Preservation Cases
- Biological Family Reunification Rate
- Number of Churches
- Average Beds per Family
- Number of Children with 80+ Connections Made
- Number of Adoptive Families
- Number of Biological Families
- Number of Wraparound Supporters
- Foster Family Retention Rate

**Variable Columns (by state) - BEING STANDARDIZED:**
- Adoption columns: Currently varies ("Number Adopted", "Number of Adoptions", etc.) - **Leah standardizing to single column name**
- States without adoption data: N/A
- Time Elapsed to Adoption (various formats, 5 states)
- Bio Reunifications, Exits (OH only)

**⚠️ CRITICAL: Data Freshness Varies by State**

"2024" and "2025" files are **database snapshots**, NOT data from those years. Each state has its own "Date Collected":

| Year | States | Examples |
|------|--------|----------|
| 2025 | 7 | CA, ME, NC, OK, IA, LA, SC |
| 2024 | 21 | TX, FL, GA, IL, NY, AZ, CO, KS, etc. |
| 2023 | 3 | CT, DC, NM |
| 2022 | 2 | AL, PA |
| 2021 | 1 | WI |
| 2020 | 1 | WA |
| 2019 | 1 | MN |

*(Note: Table above from MTE Metrics "XX Data" sheets for audit. Authoritative dates come from Sources and Definitions.)*

**Data Completeness:**
- Children in Care: 92% populated
- Foster/Kinship Homes: 60% populated (18 states have <50%, some have 0%)

**Pipeline Implications:**
1. Use BOTH files for time-series (shows database evolution)
2. **Dates come from Sources and Definitions**, not from MTE Metrics "XX Data" sheets
3. Year-over-year comparisons only meaningful where states updated between snapshots
4. Some state changes are dramatic (MN shows -81%) due to stale vs fresh data, not actual foster care changes
5. Historic View must render actual data date so users know what year they're seeing

### 4. Sources and Definitions

**File:** `Sources_and_Definitions_New.xlsx`

**Purpose:** Metadata documenting data sources and metric definitions per state. **Provides authoritative "Date of Data Collection" for each state** (MTE Metrics provides the actual values).

**Structure:** Single sheet, 51 rows (states), 15 columns *(after Leah's fixes)*

| Column | Coverage | Description |
|--------|----------|-------------|
| State name | 51/51 | State identifier |
| Date of Data Collection | ~50/51 | When data was collected |
| Source | ~49/51 | Government agency name |
| Source Hyperlink | ~48/51 | Link to source website |
| Number of Children in Care | ~46/51 | Definition of this metric |
| Number of Children in Family Foster Care | ~38/51 | Definition |
| Number of Children in Kinship Care | ~45/51 | Definition |
| Number of Children Placed Out-of-County | ~16/51 | Definition |
| Number of Foster and Kinship Homes | ~31/51 | Definition |
| Number of Children Waiting for Adoption | ~30/51 | Definition |
| Biological Family Reunification Rate | ~35/51 | Definition |
| Number of Family Preservation Cases | ~18/51 | Definition |
| Number of Churches | 0/51 | No definitions (MTE-specific) |
| Number of Children Adopted | ~33/51 | Definition |
| Months Elapsed to Adoption | ~7/51 | Definition |

**Key Findings:**
- Definitions vary significantly by state (e.g., "Children in Care" means different things)
- "Number of Churches" has no definitions (MTE-gathered data, not government)

**Data quality issues being fixed by Leah:**
- Adding: New York, South Dakota
- Fixing: "Pennslyvania" → "Pennsylvania"
- Cleaning: Removing embedded notes from Nevada, Ohio, West Virginia

**Example Definition Variations for "Children in Care":**
- Alaska: "The count of children in all out-of-home placement types"
- Arkansas: "Children in Foster Care are defined as any child who has been removed from his or her home and resides in foster care at end of month"
- California: Complex definition with exclusions for Mental Health, Private Adoption, KinGAP agencies

**Pipeline Use:**
- **Authoritative source for "Date of Data Collection" per state** (used in Historic View)
- Display source attribution in UI per state
- Show definitions on hover/click for transparency
- Status: ✅ Use

---

## Architectural Decisions

### ADR-001: Network Membership Source of Truth

**Date:** 2025-01-29

**Context:**
- Master sheet has `network_member` and `network_name` columns (70 entries, 22 networks)
- Network Members sheet has dedicated tracking (73 entries, 20 networks)
- Data between them is inconsistent (e.g., Weld County has 7 orgs in Network Members, fewer in Master)
- 11 orgs in Network Members don't exist in Master at all

**Decision:** **Network Members sheet is authoritative.** Ignore Master's `network_member` and `network_name` columns.

**Rationale:**
- Network Members sheet appears to be the actively maintained source
- Has additional metadata (Fellowship Cohort, MOU Participant, Added to Map status)
- More complete network membership data

**Consequences:**
- Pipeline must join Network Members → Master by org name
- Orgs in Network Members but not in Master will be flagged (data quality issue to resolve upstream)
- Master's network columns become unused

---

### ADR-002: Connections Sheet Usage

**Date:** 2025-01-29

**Context:**
- Connections sheet has 1199 org-to-org relationships
- 95% of "From" orgs are in Master
- Only 33% of "To" orgs are in Master
- 369 connections have BOTH orgs in Master (drawable on map)
- Current app draws connection lines based on shared network membership

**Decision:** **ON HOLD** - Focus on network memberships only for initial release.

**Rationale:**
- Network membership is cleaner data (fewer missing orgs)
- Simpler to implement and verify
- Can revisit org-to-org connections in phase 2

**Implementation:**
- parse-orgs-from-master.js will NOT process Connections sheet
- orgs-and-networks.json will contain organizations and networks only
- Map will show network relationships, not direct org-to-org lines

---

### ADR-003: Handling Missing Organizations

**Date:** 2025-01-29

**Context:**
- 11 orgs appear in Network Members but not in Master sheet
- Examples: NoCo CAFO, Dream Together 2030, Chestnut Mountain Village Ministry

**Decision:** **IGNORE** - Skip orgs that are in Network Members but not in Master.

**Rationale:**
- These orgs have no coordinates (can't display on map)
- No category or activity data (can't filter)
- Would only contribute names to network rosters - no visual or functional value
- Including them would add complexity for no benefit

**Implementation:**
- parse-orgs-from-master.js only processes orgs that exist in Master sheet
- Network memberships for missing orgs are silently skipped
- Audit report logs skipped orgs for documentation

---

## Pipeline Architecture

### Overview

```
Excel files (source of truth)
    ↓
[parse-afcars.js]           → afcars.json
[parse-metrics.js]          → metrics.json  
[parse-orgs-from-master.js] → orgs-and-networks.json
[parse-sources.js]          → sources.json
    ↓
[audit.js] → reads all 4 JSONs, verifies each, outputs audit-report.json
    ↓ (if pass)
[merge.js] → real-data.json
    ↓
[merge-simplemaps.js]       → real-data.json (+ county coords & population)
[org-descriptions.js]       → real-data.json (+ org descriptions)
    ↓
App
```

### Scripts

**Parsing (Excel → JSON)**

| Script | Input | Output | Purpose |
|--------|-------|--------|---------|
| `parse-afcars.js` | AFCARS_GOOD.xlsx | afcars.json | Federal state-level data (2021-2023) |
| `parse-metrics.js` | 2024 + 2025 Metrics xlsx | metrics.json | County-level data from both snapshots |
| `parse-orgs-from-master.js` | MTE_Master_Data.xlsx | orgs-and-networks.json | Organizations, network memberships, counties served |
| `parse-sources.js` | Sources_and_Definitions_New.xlsx | sources.json | Data sources and metric definitions |

**Verification & Merge**

| Script | Input | Output | Purpose |
|--------|-------|--------|---------|
| `audit.js` | All 4 JSONs + Excel files | audit-report.json | Verify parsing integrity |
| `merge.js` | All 4 JSONs | real-data.json | Combine into final app data |

**Enrichment (post-merge)**

| Script | Input | Output | Purpose |
|--------|-------|--------|---------|
| `merge-simplemaps.js` | real-data.json + uscounties.csv | real-data.json | Add county coordinates & population |
| `org-descriptions.js` | real-data.json | real-data.json | Generate org descriptions via Claude API |

### Intermediate JSON Outputs

**afcars.json**
- 156 records (52 states × 3 years)
- State-level metrics with consistent definitions
- Source: Federal AFCARS data

**metrics.json**
- ~3,100 county records per snapshot year
- State-level supplemental data
- Tracks data freshness per state

**orgs-and-networks.json**
- ~490 organizations with coordinates
- ~20 networks with membership lists
- Counties served per org (for profile display, not map markers)

**sources.json**
- 51 state entries (after Leah's fixes)
- Source URLs and agency names
- Metric definitions per state

### Enrichment Data Sources

**uscounties.csv** (SimpleMaps)
- Source: https://simplemaps.com/data/us-counties (free download)
- Contains: county_fips, lat, lng, population
- ~3,234 US counties
- Used by: `merge-simplemaps.js`

**Claude API** (Anthropic)
- Used by: `org-descriptions.js`
- Crawls org websites, generates one-liner descriptions
- Requires ANTHROPIC_API_KEY in .env

### Audit Process

**Purpose:** Verify each parser preserved data correctly before merging.

**For each source, audit.js checks:**

1. **Count preservation** - Rows in Excel = records in JSON
2. **Sum preservation** - Key numeric columns sum to same total
3. **Null tracking** - Document where gaps exist and how handled

**Audit report contains:**
- Per-source: input counts, output counts, sums, null counts
- Pass/fail status per source
- Exception list (any transformations or decisions made)

**Example audit output:**
```
AFCARS
  Input: 156 rows, 9 columns
  Output: 156 records
  Sums: { childrenInCare: 358080, adopted: 55480 } ✓
  Nulls: { familyPreservation: 45, fosterCare: 2, kinshipCare: 1 }
  Status: PASS

METRICS  
  Input: 51 states, 3064 counties (2024), 3064 counties (2025)
  Output: 3064 county records per year
  Nulls by state: { California: 59 missing fosterHomes, ... }
  Status: PASS

ORGS-AND-NETWORKS
  Input: 490 orgs, 73 network memberships, 1526 counties served entries
  Output: 490 orgs, 20 networks, 62 memberships, counties served per org
  Matching: Exact org name to Master (double-check address if needed)
  Coordinates: Handled by separate coordinate script
  Skipped: 11 network memberships (orgs not in Master - per ADR-003)
  Status: PASS

SOURCES
  Input: 51 states
  Output: 51 records
  Status: PASS
```

### Final Output

**real-data.json** (produced by merge.js)

```
{
  nationalStats: {                    // From afcars.json (aggregated)
    2021: { childrenInCare, adopted, reunificationRate, ... },
    2022: { ... },
    2023: { ... }
  },
  stateData: {                        // afcars.json + metrics.json + sources.json
    "Alabama": {
      afcars: { 2021: {...}, 2022: {...}, 2023: {...} },
      metrics: { 2024: {...}, 2025: {...} },
      source: { name, url, dateCollected },
      definitions: { childrenInCare: "...", ... }
    },
    ...
  },
  countyData: {                       // From metrics.json
    "Alabama": {
      "Autauga": { 2024: {...}, 2025: {...} },
      ...
    },
    ...
  },
  organizations: [ ... ],             // From orgs-and-networks.json
  networks: { ... },                  // From orgs-and-networks.json
  stateCoordinates: { ... },          // Derived during merge
  countyCoordinates: { ... },         // Derived during merge
}
```

---

### ADR-004: Metrics Data Freshness Handling

**Date:** 2025-01-29

**Context:**
- "2024" and "2025" MTE Metrics files are database snapshots, not year-specific data
- Each state has its own "Date Collected" ranging from 2019 (MN) to 2025 (CA, SC, etc.)
- Some states show dramatic year-over-year changes that reflect data staleness, not real foster care trends
- Example: Minnesota appears to drop 81% because 2024 file has 2019 data, 2025 file has different 2019 data

**Decision:** Track and display data freshness per state.

**Implementation:**
- **Dates come from Sources and Definitions** (not MTE Metrics "XX Data" sheets)
- **Actual metric values come from MTE Metrics files**
- parse-sources.js extracts "Date of Data Collection" per state
- merge.js attaches dates to state data
- Historic View renders the actual date so users know what year they're looking at (e.g., "Data from: 2022" for Alabama)

**Rationale:**
- Users need to know how current the data is for each state
- Prevents misinterpretation of apparent trends that are actually data artifacts
- Builds trust by being transparent about data limitations

---

### ADR-005: Using Both Metrics Snapshots

**Date:** 2025-01-29

**Context:**
- User confirmed both 2024 and 2025 files should be used to show changes over time
- Files are database snapshots showing state of data collection at different points
- ~92% of counties show different values between snapshots (where states updated)

**Decision:** Include both snapshots in pipeline for time-series display.

**Implementation:**
- Parse both Excel files
- Tag data with snapshot year (2024 vs 2025)
- For states that updated: show actual change
- For states with identical data: indicate "no update" rather than "no change"

---

### ADR-006: Data Source Hierarchy

**Date:** 2025-01-29

**Context:**
- AFCARS provides federal standardized data (state-level, 2021-2023)
- MTE Metrics provides state-reported county data (varying freshness 2019-2025)
- Both have overlapping metrics but different scopes and definitions
- Need clear rules for which source to use when

**Decision:** Establish data hierarchy by scope and metric.

**Hierarchy:**
1. **National totals:** AFCARS only (aggregated from states)
2. **State metrics (core 7):** AFCARS is authoritative for:
   - Children in Care
   - Children in Foster Care
   - Children in Kinship Care
   - Children Waiting for Adoption
   - Children Adopted
   - Reunification Rate
   - Family Preservation Cases
3. **State metrics (extended):** MTE Metrics for:
   - Number of Churches
   - Number of Foster and Kinship Homes
   - County Population aggregates
4. **County metrics:** MTE Metrics only (AFCARS has no county data)
5. **Historical trends:** AFCARS 2021-2023 (reliable), MTE 2024-2025 (snapshot evolution)

**Rationale:**
- AFCARS has standardized definitions across states
- MTE Metrics definitions vary by state (see Sources and Definitions)
- County data only available from MTE Metrics
- **Confirmed by Leah:** Numbers don't need to match between AFCARS state totals and MTE county sums due to different collection timeframes

---

### ADR-007: Data Delivery Method

**Date:** 2025-01-29

**Context:**
- Need reliable way to get updated data from Leah
- Data lives in Google Sheets
- Pipeline needs Excel files

**Decision:** Daily Google Sheets export in Excel format (.xlsx)

**Implementation:**
- Leah exports from Google Sheets → .xlsx files
- Files delivered daily
- Pipeline parses .xlsx directly (not CSV)

**Rationale:**
- Excel preserves data types better than CSV
- Multiple sheets in single file (MTE Master, MTE Metrics)
- Daily refresh keeps data current

---

### ADR-008: Organization Map Display

**Date:** 2025-01-29

**Context:**
- Counties Served sheet has 1,526 rows mapping orgs to multiple counties
- An org might serve 5+ counties beyond their HQ
- Showing same org multiple times clutters the map

**Decision:** Show each org once at HQ location only. Display counties served in org profile/detail tab.

**Implementation:**
- Map marker = org HQ coordinates (from Master sheet)
- Org profile includes "Counties Served" list (from Counties Served sheet)
- No duplicate markers on state map

**Rationale:**
- Clean map without clutter
- Users can still see coverage in org detail view
- Simpler implementation

---

### ADR-009: Metric Definition Display

**Date:** 2025-01-29

**Decision:** Show metric definitions via tooltip.

**Implementation:**
- Hover/tap on metric name shows definition from Sources and Definitions
- Definitions vary by state, so tooltip content is state-specific

---

### ADR-010: State Geographic Customizations

**Date:** 2025-01-29

**Context:**
Not all states use "counties" as their geographic subdivision. Some use districts, regions, or other terms. Additionally, some states have stale data that should display with the correct year.

**Decision:** Handle state-specific geography terms and date overrides.

**Non-County States (from MTE Metrics audit):**

| State | Header in Data | Values | Count | Geocode Strategy |
|-------|----------------|--------|-------|------------------|
| Alaska | Region | Anchorage, Northern, Southcentral, Southeast, Western | 5 | Region center |
| Connecticut | Region | R1-R6 | 6 | Region center |
| New Hampshire | County (but cities) | Berlin, Claremont, Concord, Conway, Keene, Laconia... | 11 | City center |
| South Dakota | Office | Hot Springs, Rapid City, Deadwood, Eagle Butte, Pierre... | 19 | City center |
| Vermont | District Office | St. Albans, Burlington, Hartford, St. Johnsbury, Brattleboro, Barre | 12 | City center |
| Washington | County (but regions) | Region 1, Region 2, Region 3, Region 4, Region 5, Region 6 | 6 | Region center |
| DC | County | District of Columbia | 1 | DC center |

**Geocoding Strategy:**
- **City-based (NH, SD, VT):** Geocode city names to get coordinates (city center)
- **Region-based (Alaska, CT, WA):** Use regional office city coordinates (documented below)

**Display Names:**
- Washington regions display as-is: "Region 1", "Region 2", etc. (no friendly names provided)
- Other states use names from data

**Date Display Overrides:**

| State | Display Year | Notes |
|-------|--------------|-------|
| Alabama | 2022 | Data is from 2022, show in historic view |
| Wisconsin | 2022 | Data is from 2022, show in historic view |

**Special Cases:**

| State | Handling |
|-------|----------|
| DC | Create a single "county" page with metrics card |

**Data Quality Issues (Leah fixing):**
- Connecticut: R2 appears twice, R3 missing (typo)

**Implementation:**
- Store geography term per state in config
- UI displays "Regions" / "Districts" / "District Offices" instead of "Counties" for affected states
- Geocode cities for NH, SD, VT using standard geocoding
- Use region office coordinates for Alaska, CT, WA (see table below)
- Historic view uses correct year for stale data states
- DC gets its own county-level page despite being a single entity

**Region Coordinates Reference:**

*Alaska OCS Regions (use main office city):*

| Region | Office City | Lat | Lng |
|--------|-------------|-----|-----|
| Anchorage | Anchorage | 61.22 | -149.90 |
| Northern | Fairbanks | 64.84 | -147.72 |
| Southcentral | Wasilla | 61.58 | -149.44 |
| Southeast | Juneau | 58.30 | -134.42 |
| Western | Bethel | 60.79 | -161.76 |

*Connecticut DCF Regions (use primary office city):*

| Region | Office Cities | Center City | Lat | Lng |
|--------|--------------|-------------|-----|-----|
| R1 | Bridgeport, Norwalk | Bridgeport | 41.19 | -73.20 |
| R2 | Milford, New Haven | New Haven | 41.31 | -72.93 |
| R3 | Middletown, Norwich, Willimantic | Middletown | 41.56 | -72.65 |
| R4 | Hartford, Manchester | Hartford | 41.77 | -72.67 |
| R5 | Danbury, Torrington, Waterbury | Waterbury | 41.56 | -73.05 |
| R6 | Meriden, New Britain | Meriden | 41.54 | -72.81 |

*Washington DCYF Regions (use primary office city):*

| Region | Counties/Area | Center City | Lat | Lng |
|--------|--------------|-------------|-----|-----|
| Region 1 | Eastern WA (Spokane, etc.) | Spokane | 47.66 | -117.43 |
| Region 2 | North Central (Yakima, etc.) | Yakima | 46.60 | -120.51 |
| Region 3 | Northwest (Everett, etc.) | Everett | 47.98 | -122.20 |
| Region 4 | King County | Seattle | 47.61 | -122.33 |
| Region 5 | Southwest (Tacoma, Olympia) | Tacoma | 47.25 | -122.44 |
| Region 6 | Southwest (Vancouver, etc.) | Vancouver | 45.64 | -122.66 |

*DC:*

| Area | Lat | Lng |
|------|-----|-----|
| District of Columbia | 38.91 | -77.04 |

*City-based states (NH, SD, VT):* Geocode city names at runtime or pre-populate using geocoding API.

---

## Open Questions

1. **Who runs pipeline** - When data updates, who triggers the rebuild? *(TODO: figure out best approach)*

---

## TODOs

1. **Update merge-simplemaps.js** - Currently only pulls coordinates. Need to also pull population column from uscounties.csv.
2. **Wait for Leah's fixes** - Sources and Definitions (NY, SD, PA), adoption column standardization, CT region typo
3. **Implement state customizations (ADR-010)** - Geography terms (District/Region), date overrides, DC special case
4. **Geocode non-county states:**
   - City-based (NH, SD, VT): Use geocoding API for city centers
   - Region-based (Alaska, CT, WA): ✅ Coordinates documented in ADR-010

---

## Audit Known Values ✓

Values verified from source files during audit (2025-01-29). **Confirmed by Leah** as ground truth for validation.

### AFCARS

| Check | Expected | Notes |
|-------|----------|-------|
| Total rows | 156 | 52 states × 3 years |
| National 2023 Children in Care | 358,080 | Sum across states |
| National 2023 Adopted | 55,480 | Sum across states |
| CA 2023 Children in Care | 44,468 | Spot check |
| TX 2023 Children in Care | 19,168 | Spot check |
| FL 2023 Children in Care | 20,322 | Spot check |
| Family Preservation nulls | 45 | Expected gaps |

### MTE Metrics

| Check | Expected | Notes |
|-------|----------|-------|
| State sheets | 51 | Each file |
| Texas counties | 254 | Spot check |
| Georgia counties | 159 | Spot check |
| Kentucky counties | 120 | Spot check |
| Alabama counties | 67 | Spot check |
| Total counties | ~3,064 | Per snapshot |

### Organizations

| Check | Expected | Notes |
|-------|----------|-------|
| Total orgs | 490 | From Master sheet |
| Orgs with coordinates | ~462 | 28 missing coords (handled by coordinate script) |
| Network memberships (input) | 73 | From Network Members sheet |
| Network memberships (output) | 62 | 11 skipped per ADR-003 |
| Unique networks | 20 | |
| Counties served entries | 1,526 | From Counties Served sheet |

**Org matching:** Exact name match to Master (double-check address if needed)

### Sources and Definitions

| Check | Expected | Notes |
|-------|----------|-------|
| State entries | 51 | After Leah adds NY, SD |
| States with source URL | ~48 | |
| States with definitions | Varies | 14-44 per metric |

### Non-County States (from ADR-010)

| State | Geography Type | Count | Geocode Source |
|-------|---------------|-------|----------------|
| Alaska | Regions | 5 | Manual (region centers) |
| Connecticut | Regions | 6 | Manual (region centers) |
| New Hampshire | Cities/Districts | 11 | Geocoding API |
| South Dakota | Office cities | 19 | Geocoding API |
| Vermont | District Office cities | 12 | Geocoding API |
| Washington | Regions | 6 | Manual (region centers) |
| DC | Single entity | 1 | DC center |

### SimpleMaps (uscounties.csv)

| Check | Expected | Notes |
|-------|----------|-------|
| Total counties | 3,144 | All US counties |
| Has coordinates | All | lat, lng columns |
| Has population | All | population column |
| Has FIPS | All | county_fips for matching |

---

## Changelog

| Date | Change |
|------|--------|
| 2025-01-29 | Initial document created |
| 2025-01-29 | ADR-001: Network Members is authoritative source |
| 2025-01-29 | Expanded MTE Metrics section with full audit findings |
| 2025-01-29 | ADR-004: Track data freshness per state |
| 2025-01-29 | ADR-005: Use both metrics snapshots for time-series |
| 2025-01-29 | Added Sources and Definitions audit |
| 2025-01-29 | Added AFCARS audit with national totals and trends |
| 2025-01-29 | ADR-006: Data source hierarchy (AFCARS vs MTE) |
| 2025-01-29 | Replaced monolithic pipeline with multi-script architecture |
| 2025-01-29 | Added audit.js verification step between parsing and merging |
| 2025-01-29 | Added Questions for Leah section at top |
| 2025-01-29 | ADR-002: Decided to hold on Connections, focus on networks only |
| 2025-01-29 | ADR-003: Decided to ignore 11 missing orgs (no coordinates/data) |
| 2025-01-29 | Sources and Definitions: Leah fixing NY, SD, PA typo, embedded notes |
| 2025-01-29 | Clarified: Dates from Sources and Definitions, values from MTE Metrics |
| 2025-01-29 | ADR-007: Daily Google Sheets export in Excel format |
| 2025-01-29 | Leah confirmed ground truth values for validation |
| 2025-01-29 | Leah standardizing adoption column names in MTE Metrics |
| 2025-01-29 | Confirmed ADR-006: AFCARS for state/national, MTE for county (numbers don't need to match) |
| 2025-01-29 | ADR-008: Orgs shown at HQ only, counties served in profile (not on map) |
| 2025-01-29 | ADR-009: Metric definitions displayed via tooltip |
| 2025-01-29 | Added enrichment phase: merge-simplemaps.js + org-descriptions.js |
| 2025-01-29 | ADR-010: State geographic customizations (districts, regions, date overrides) |
| 2025-01-29 | Added region coordinates for Alaska, Connecticut, Washington to ADR-010 |
