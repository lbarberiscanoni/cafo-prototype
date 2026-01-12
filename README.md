- [ ] Check on Weld County because it has 5 organizations part of a network in MTE Master Data but we only display 2
- [ ] Add organization descriptions to the national org view by next week.
    - [ ] Look into using ChatGPT to generate one-liner descriptions for each organization based on their names/websites, probably by writing a script to do it one time
- [ ] Review the data pipeline
    - [ ] MTE Metrics State Database = each state page (Alabama, not AL Data), ignore All Data Connect + Metrics Check
    - [ ] Use all of Sources and Definitions
    - [ ] MTE Master Data = Master + Network Members + Connections
    - [ ] AFCARS = everything
- [ ] Historic View
    - [ ] Consider implementing option to download all county data at the state level in one file
- [ ] Fourth Card
- [ ] Investigate and fix Firefox-specific display issues with the map/legend overlay
- [ ] Set up a periodic (e.g., daily) function to download updated data from Google Sheets and rerun the data pipeline.

[Here are the CAFO Data Sources](https://docs.google.com/document/d/13Bq8yKjXXIynwdoOgY4efEtfI7M72JxQsLBlxl6WTWc/edit?tab=t.0)

Here are the counties/states with active network connections:

**Networks with Connection Lines (2+ orgs):**

| Network | State | County | # Orgs | URL to Test |
|---------|-------|--------|--------|-------------|
| Weld County Collaboration | CO | Weld/Larimer/Arapahoe | 4 | `#/state/colorado/organizational` |
| Okaloosa County Collaboration | FL | Okaloosa | 3 | `#/state/florida/organizational` |
| Kosciusko County Collaboration | IN | Kosciusko | 3 | `#/state/indiana/organizational` |
| Maury County Collaboration | TN | Maury | 2 | `#/state/tennessee/organizational` |
| Highlands County Collaboration | FL | Highlands | 2 | `#/state/florida/organizational` |
| Lowndes County Collaboration | GA | Lowndes | 2 | `#/state/georgia/organizational` |
| York County Collaboration | ME | York | 2 | `#/state/maine/organizational` |
| Upshur County Collaboration | WV | Upshur | 2 | `#/state/west-virginia/organizational` |

**Best for testing:**
- **Colorado** - Weld County Collaboration has 4 orgs spread across 3 counties (most complex)
- **Florida** - Has 2 networks (Okaloosa + Highlands)
- **Indiana** - Kosciusko has 3 orgs all in Warsaw

**Networks with only 1 org (no lines yet):**
- Wake County (NC), Douglas County (NE), Polk County (IA), Clark County (NV)